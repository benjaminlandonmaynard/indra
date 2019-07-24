import { convert, NodeChannel, RegisteredAppDetails, TransferParameters } from "@connext/types";
import { RejectInstallVirtualMessage } from "@counterfactual/node";
import { AppInstanceInfo, Node as NodeTypes } from "@counterfactual/types";
import { constants } from "ethers";
import { AddressZero, Zero } from "ethers/constants";
import { BigNumber } from "ethers/utils";
import { fromExtendedKey } from "ethers/utils/hdnode";

import { delay } from "../lib/utils";
import { invalidAddress, invalidXpub } from "../validation/addresses";
import { falsy, notLessThanOrEqualTo } from "../validation/bn";

import { AbstractController } from "./AbstractController";

export class TransferController extends AbstractController {
  private appId: string;

  private timeout: NodeJS.Timeout;

  public transfer = async (params: TransferParameters): Promise<NodeChannel> => {
    this.log.info(`Transfer called with parameters: ${JSON.stringify(params, null, 2)}`);

    // convert params + validate
    const { recipient, amount, assetId } = convert.TransferParameters("bignumber", params);
    const invalid = await this.validate(recipient, amount, assetId);
    if (invalid) {
      throw new Error(invalid.toString());
    }

    // check that there is sufficient free balance for amount
    const freeBal = await this.connext.getFreeBalance(assetId);
    const preTransferBal = freeBal[this.connext.freeBalanceAddress];

    // TODO: check if the recipient is the node, and if so transfer without
    // installing an app (is this possible?)

    // TODO: check if recipient has a channel with the hub w/sufficient balance
    // or if there is a route available through the node

    // verify app is supported without swallowing errors
    const appInfo = this.connext.getRegisteredAppDetails("UnidirectionalTransferApp");

    // install the transfer application
    const appId = await this.transferAppInstalled(amount, recipient, assetId, appInfo);
    if (!appId) {
      throw new Error(`App was not installed`);
    }

    // update state
    // TODO: listener for reject state?
    await this.connext.takeAction(this.appId, {
      finalize: false,
      transferAmount: amount,
    });

    // finalize state + uninstall application
    await this.finalizeAndUninstallApp(this.appId);

    // sanity check, free balance decreased by payment amount
    const postTransferBal = await this.connext.getFreeBalance(assetId);
    const diff = preTransferBal.sub(postTransferBal[this.connext.freeBalanceAddress]);
    if (!diff.eq(amount)) {
      this.log.info(
        "Welp it appears the difference of the free balance before and after " +
          "uninstalling is not what we expected......",
      );
    } else if (postTransferBal[this.connext.freeBalanceAddress].gte(preTransferBal)) {
      this.log.info(
        "Free balance after transfer is gte free balance " +
          "before transfer..... That's not great..",
      );
    }

    const newState = await this.connext.getChannel();

    // TODO: fix the state / types!!
    return newState;
  };

  /////////////////////////////////
  ////// PRIVATE METHODS
  private validate = async (
    recipient: string,
    amount: BigNumber,
    assetId: string,
  ): Promise<undefined | string> => {
    // check that there is sufficient free balance for amount
    const freeBalance = await this.connext.getFreeBalance(assetId);
    const preTransferBal = freeBalance[this.connext.freeBalanceAddress];
    const errs = [
      invalidXpub(recipient),
      invalidAddress(assetId),
      notLessThanOrEqualTo(amount, preTransferBal),
    ];
    return errs ? errs.filter(falsy)[0] : undefined;
  };

  // TODO: fix type of data
  private resolveInstallTransfer = (res: (value?: unknown) => void, data: any): any => {
    if (this.appId !== data.params.appInstanceId) {
      this.log.info(
        `Caught INSTALL_VIRTUAL event for different app ${JSON.stringify(data)}, expected ${
          this.appId
        }`,
      );
      // TODO: do we need to recreate the handler here?
      res();
      return;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    res(data);
    return data;
  };

  // TODO: fix types of data
  private rejectInstallTransfer = (
    rej: (reason?: any) => void,
    msg: RejectInstallVirtualMessage,
  ): any => {
    // check app id
    if (this.appId !== msg.data.appInstanceId) {
      return;
    }

    return rej(`Install virtual failed. Event data: ${JSON.stringify(msg, null, 2)}`);
  };

  // creates a promise that is resolved once the app is installed
  // and rejected if the virtual application is rejected
  private transferAppInstalled = async (
    amount: BigNumber,
    recipient: string,
    assetId: string,
    appInfo: RegisteredAppDetails,
  ): Promise<string | undefined> => {
    let boundResolve: (value?: any) => void;
    let boundReject: (reason?: any) => void;

    // note: intermediary is added in connext.ts as well
    const params: NodeTypes.ProposeInstallVirtualParams = {
      abiEncodings: {
        actionEncoding: appInfo.actionEncoding,
        stateEncoding: appInfo.stateEncoding,
      },
      appDefinition: appInfo.appDefinitionAddress,
      initialState: {
        finalized: false,
        transfers: [
          {
            amount,
            to: this.wallet.address,
            // TODO: replace? fromExtendedKey(this.publicIdentifier).derivePath("0").address
          },
          {
            amount: Zero,
            to: fromExtendedKey(recipient).derivePath("0").address,
          },
        ],
      },
      initiatorDeposit: amount,
      initiatorDepositTokenAddress: assetId,
      intermediaries: [this.connext.nodePublicIdentifier],
      outcomeType: appInfo.outcomeType,
      proposedToIdentifier: recipient,
      responderDeposit: constants.Zero,
      responderDepositTokenAddress: assetId,
      timeout: constants.Zero, // TODO: fix, add to app info?
    };

    const res = await this.connext.proposeInstallVirtualApp(params);
    // set app instance id
    this.appId = res.appInstanceId;

    try {
      await new Promise((res, rej) => {
        boundReject = this.rejectInstallTransfer.bind(null, rej);
        boundResolve = this.resolveInstallTransfer.bind(null, res);
        this.listener.on(NodeTypes.EventName.INSTALL_VIRTUAL, boundResolve);
        this.listener.on(NodeTypes.EventName.REJECT_INSTALL_VIRTUAL, boundReject);
        // this.timeout = setTimeout(() => {
        //   this.cleanupInstallListeners(boundResolve, boundReject);
        //   boundReject({ data: { appInstanceId: this.appId } });
        // }, 5000);
      });
      this.log.info(`App was installed successfully!: ${JSON.stringify(res)}`);
      return res.appInstanceId;
    } catch (e) {
      this.log.error(`Error installing app: ${e.toString()}`);
      return undefined;
    } finally {
      this.cleanupInstallListeners(boundResolve, boundReject);
    }
  };

  private cleanupInstallListeners = (boundResolve: any, boundReject: any): void => {
    this.listener.removeListener(NodeTypes.EventName.INSTALL_VIRTUAL, boundResolve);
    this.listener.removeListener(NodeTypes.EventName.REJECT_INSTALL_VIRTUAL, boundReject);
  };

  private finalizeAndUninstallApp = async (appId: string): Promise<void> => {
    await this.connext.takeAction(appId, {
      finalize: true,
      transferAmount: constants.Zero,
    });

    await this.connext.uninstallVirtualApp(appId);
    // TODO: cf does not emit uninstall virtual event on the node
    // that has called this function but ALSO does not immediately
    // uninstall the apps. This will be a problem when trying to
    // display balances...
    const openApps = await this.connext.getAppInstances();
    this.log.info(`Open apps: ${openApps.length}`);
    this.log.info(`AppIds: ${JSON.stringify(openApps.map(a => a.identityHash))}`);

    // adding a promise for now that polls app instances, but its not
    // great and should be removed
    await new Promise(async (res, rej) => {
      const getAppIds = async (): Promise<string[]> => {
        return (await this.connext.getAppInstances()).map((a: AppInstanceInfo) => a.identityHash);
      };
      let retries = 0;
      while ((await getAppIds()).indexOf(this.appId) !== -1 && retries <= 5) {
        this.log.info("found app id in the open apps... retrying...");
        await delay(500);
        retries = retries + 1;
      }

      if (retries > 5) rej();

      res();
    });
  };
}
