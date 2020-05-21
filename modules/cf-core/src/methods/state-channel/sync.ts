import {
  MethodNames,
  MethodParams,
  MethodResults,
  ProtocolNames,
  EventNames,
  SyncMessage,
} from "@connext/types";

import { jsonRpcMethod } from "rpc-server";

import { RequestHandler } from "../../request-handler";

import { NodeController } from "../controller";
import { NO_STATE_CHANNEL_FOR_MULTISIG_ADDR, NO_MULTISIG_IN_PARAMS } from "../../errors";
import { StateChannel } from "../../models";

export class SyncController extends NodeController {
  @jsonRpcMethod(MethodNames.chan_sync)
  public executeMethod = super.executeMethod;

  protected async getRequiredLockName(
    requestHandler: RequestHandler,
    params: MethodParams.Sync,
  ): Promise<string> {
    if (!params.multisigAddress) {
      throw new Error(NO_MULTISIG_IN_PARAMS(params));
    }
    return params.multisigAddress;
  }

  protected async executeMethodImplementation(
    requestHandler: RequestHandler,
    params: MethodParams.Sync,
    preProtocolStateChannel: StateChannel | undefined,
  ): Promise<MethodResults.Sync> {
    const { protocolRunner, publicIdentifier } = requestHandler;
    const { multisigAddress } = params;
    if (!preProtocolStateChannel) {
      throw new Error(NO_STATE_CHANNEL_FOR_MULTISIG_ADDR(multisigAddress));
    }

    const responderIdentifier = [
      preProtocolStateChannel.initiatorIdentifier,
      preProtocolStateChannel.responderIdentifier,
    ].find((identifier) => identifier !== publicIdentifier);

    if (!responderIdentifier) {
      throw new Error(NO_STATE_CHANNEL_FOR_MULTISIG_ADDR(multisigAddress));
    }

    const { channel: updated }: { channel: StateChannel } = await protocolRunner.initiateProtocol(
      ProtocolNames.sync,
      {
        multisigAddress,
        initiatorIdentifier: publicIdentifier,
        responderIdentifier,
      },
    );

    return { syncedChannel: updated.toJson() };
  }

  protected async afterExecution(
    requestHandler: RequestHandler,
    params: MethodParams.Sync,
    returnValue: MethodResults.Sync,
  ): Promise<void> {
    const { router, publicIdentifier } = requestHandler;

    const msg = {
      from: publicIdentifier,
      type: EventNames.SYNC,
      data: { syncedChannel: returnValue.syncedChannel },
    } as SyncMessage;
    await router.emit(msg.type, msg, `outgoing`);
  }
}