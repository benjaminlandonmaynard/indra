import { xkeyKthAddress } from "@connext/cf-core";
import { IConnextClient } from "@connext/types";
import { AddressZero, One } from "ethers/constants";
import { bigNumberify } from "ethers/utils";

import { createClient, fundChannel, requestCollateral } from "../util";
import { asyncTransferAsset } from "../util/helpers/asyncTransferAsset";

describe("Full Flow: Transfer", () => {
  let clientA: IConnextClient;
  let tokenAddress: string;
  let nodePublicIdentifier: string;
  let nodeFreeBalanceAddress: string;

  beforeEach(async () => {
    clientA = await createClient();
    tokenAddress = clientA.config.contractAddresses.Token;
    nodePublicIdentifier = clientA.config.nodePublicIdentifier;
    nodeFreeBalanceAddress = xkeyKthAddress(nodePublicIdentifier);
  });

  it("User transfers to multiple clients", async () => {
    const clientB = await createClient();
    const clientC = await createClient();
    const clientD = await createClient();
    const clientE = await createClient();

    // fund sender
    await fundChannel(clientA, bigNumberify(4), AddressZero);

    // collateralize recipients
    await requestCollateral(clientB, AddressZero);
    await requestCollateral(clientC, AddressZero);
    await requestCollateral(clientD, AddressZero);
    await requestCollateral(clientE, AddressZero);

    await asyncTransferAsset(clientA, clientB, One, AddressZero, nodeFreeBalanceAddress);
    await asyncTransferAsset(clientA, clientC, One, AddressZero, nodeFreeBalanceAddress);
    await asyncTransferAsset(clientA, clientD, One, AddressZero, nodeFreeBalanceAddress);
    await asyncTransferAsset(clientA, clientE, One, AddressZero, nodeFreeBalanceAddress);
  });
});
