import { CreateChannelMessage, Node, NODE_EVENTS } from "../../src";

import { setup, SetupContext } from "./setup";
import {
  confirmChannelCreation,
  getChannelAddresses,
  getMultisigCreationTransactionHash,
  assertNodeMessage,
  constructChannelCreationRpc
} from "./utils";
import { isHexString } from "ethers/utils";

describe("Node can create multisig, other owners get notified", () => {
  let nodeA: Node;
  let nodeB: Node;
  let nodeC: Node;

  beforeAll(async () => {
    const context: SetupContext = await setup(global, true);
    nodeA = context["A"].node;
    nodeB = context["B"].node;
    nodeC = context["C"].node;
  });

  describe("Queued channel creation", () => {
    it("Node A and Node B can create a channel", async done => {
      const owners = [
        nodeA.publicIdentifier,
        nodeB.publicIdentifier
      ];

      nodeA.once(NODE_EVENTS.CREATE_CHANNEL, async (msg: CreateChannelMessage) => {
        assertNodeMessage(msg, {
          from: nodeB.publicIdentifier,
          type: NODE_EVENTS.CREATE_CHANNEL,
          data: {
            owners: [
              nodeB.freeBalanceAddress,
              nodeA.freeBalanceAddress,
            ],
            counterpartyXpub: nodeB.publicIdentifier,
          }
        }, ['data.multisigAddress']);
        done();
      });

      const txHash = await nodeB.rpcRouter.dispatch(constructChannelCreationRpc(owners));
      expect(isHexString(txHash)).toBeTruthy();
    })
  
    it("Node A can create multiple back-to-back channels with Node B and Node C", async done => {
      const ownersABPublicIdentifiers = [
        nodeA.publicIdentifier,
        nodeB.publicIdentifier
      ];

      const ownersACPublicIdentifiers = [
        nodeA.publicIdentifier,
        nodeC.publicIdentifier
      ];

      nodeA.on(
        NODE_EVENTS.CREATE_CHANNEL,
        async (msg: CreateChannelMessage) => {
          if (msg.data.owners === ownersABPublicIdentifiers) {
            const openChannelsNodeA = await getChannelAddresses(nodeA);
            const openChannelsNodeB = await getChannelAddresses(nodeB);

            expect(openChannelsNodeA.size).toEqual(1);
            expect(openChannelsNodeB.size).toEqual(1);

            await confirmChannelCreation(
              nodeA,
              nodeB,
              ownersABPublicIdentifiers,
              msg.data
            );
          } else {
            const openChannelsNodeA = await getChannelAddresses(nodeA);
            const openChannelsNodeC = await getChannelAddresses(nodeC);

            expect(openChannelsNodeA.size).toEqual(2);
            expect(openChannelsNodeC.size).toEqual(1);

            await confirmChannelCreation(
              nodeA,
              nodeC,
              ownersACPublicIdentifiers,
              msg.data
            );

            done();
          }
        }
      );

      const txHash1 = await getMultisigCreationTransactionHash(
        nodeA,
        ownersABPublicIdentifiers
      );

      const txHash2 = await getMultisigCreationTransactionHash(
        nodeA,
        ownersACPublicIdentifiers
      );

      expect(txHash1).toBeDefined();
      expect(txHash2).toBeDefined();
    });
  });
});
