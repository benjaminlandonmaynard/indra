import { CFCoreTypes } from "@connext/types";
import { One, Zero } from "ethers/constants";

import {
  NO_APP_INSTANCE_FOR_TAKE_ACTION,
  Node,
  NODE_EVENTS,
  UpdateStateMessage
} from "../../src";
import { NetworkContextForTestSuite } from "../contracts";

import { setup, SetupContext } from "./setup";
import { validAction } from "./tic-tac-toe";
import {
  collateralizeChannel,
  constructGetStateRpc,
  constructTakeActionRpc,
  createChannel,
  installVirtualApp,
  assertNodeMessage
} from "./utils";

jest.setTimeout(15000);

const { TicTacToeApp } = global["networkContext"] as NetworkContextForTestSuite;

// NOTE: no initiator events
function confirmMessages(initiator: Node, responder: Node, expectedData: CFCoreTypes.UpdateStateEventData) {
  const expected = {
    from: initiator.publicIdentifier,
    type: "UPDATE_STATE_EVENT",
    data: expectedData,
  };
  // initiator.once("UPDATE_STATE_EVENT", (msg: UpdateStateMessage) => {
  //   assertNodeMessage(msg, expected);
  // });
  responder.once("UPDATE_STATE_EVENT", (msg: UpdateStateMessage) => {
    assertNodeMessage(msg, expected);
  });
}

describe("Node method follows spec - takeAction virtual", () => {
  let nodeA: Node;
  let nodeB: Node;
  let nodeC: Node;

  beforeAll(async () => {
    const context: SetupContext = await setup(global, true);
    nodeA = context["A"].node;
    nodeB = context["B"].node;
    nodeC = context["C"].node;
  });

  describe(
    "Node A and C install an AppInstance via Node B, Node A takes action, " +
      "Node C confirms receipt of state update",
    () => {
      it("sends takeAction with invalid appInstanceId", async () => {
        const takeActionReq = constructTakeActionRpc("", validAction);
        await expect(
          nodeA.rpcRouter.dispatch(takeActionReq)
        ).rejects.toThrowError(NO_APP_INSTANCE_FOR_TAKE_ACTION);
      });

      it("can take action", async done => {
        const multisigAddressAB = await createChannel(nodeA, nodeB);
        const multisigAddressBC = await createChannel(nodeB, nodeC);

        await collateralizeChannel(multisigAddressAB, nodeA, nodeB);
        await collateralizeChannel(multisigAddressBC, nodeB, nodeC);

        const appInstanceId = await installVirtualApp(
          nodeA,
          nodeB,
          nodeC,
          TicTacToeApp
        );

        const expectedNewState = {
          board: [[One, Zero, Zero], [Zero, Zero, Zero], [Zero, Zero, Zero]],
          versionNumber: One,
          winner: Zero
        };

        nodeC.once(
          "UPDATE_STATE_EVENT",
          async () => {
            const req = constructGetStateRpc(appInstanceId);

            /**
             * TEST #3
             * The database of Node C is correctly updated and querying it works
             */
            const {
              result: {
                result: { state: nodeCState }
              }
            } = await nodeC.rpcRouter.dispatch(req);

            expect(nodeCState).toEqual(expectedNewState);

            /**
             * TEST #4
             * The database of Node A is correctly updated and querying it works
             */
            const {
              result: {
                result: { state: nodeAState }
              }
            } = await nodeA.rpcRouter.dispatch(req);

            expect(nodeAState).toEqual(expectedNewState);

            done();
          }
        );

        /**
         * TEST #1
         * The event emitted by Node C after an action is taken by A
         * sends the appInstanceId and the newState correctly.
         */
        confirmMessages(nodeA, nodeC, { 
          newState: expectedNewState,
          appInstanceId,
          action: validAction,
        });

        const takeActionReq = constructTakeActionRpc(
          appInstanceId,
          validAction
        );

        /**
         * TEST #2
         * The return value from the call to Node A includes the new state
         */
        const {
          result: {
            result: { newState }
          }
        } = await nodeA.rpcRouter.dispatch(takeActionReq);

        expect(newState).toEqual(expectedNewState);
      });
    }
  );
});
