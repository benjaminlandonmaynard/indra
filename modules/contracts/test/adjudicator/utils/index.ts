import { waffle as buidler } from "@nomiclabs/buidler";
import { AppIdentity, toBN, ChallengeStatus } from "@connext/types";
import * as chai from "chai";
import { solidity } from "ethereum-waffle";
import {
  BigNumberish,
  defaultAbiCoder,
  keccak256,
  hexlify,
  randomBytes,
  solidityPack,
  BigNumber,
} from "ethers/utils";

import { use } from "chai";
import { AddressZero, Zero, HashZero } from "ethers/constants";
export * from "./context";

// ETH helpers
export const provider = buidler.provider;
export const mineBlock = async () => await provider.send("evm_mine", []);
export const snapshot = async () => await provider.send("evm_snapshot", []);
export const restore = async (snapshotId: any) => await provider.send("evm_revert", [snapshotId]);

// TODO: Not sure this works correctly/reliably...
export const moveToBlock = async (blockNumber: BigNumberish) => {
  const blockNumberBN: BigNumber = toBN(blockNumber);
  let currentBlockNumberBN: BigNumber = toBN(await provider.getBlockNumber());
  expect(currentBlockNumberBN).to.be.at.most(blockNumberBN);
  while (currentBlockNumberBN.lt(blockNumberBN)) {
    await mineBlock();
    currentBlockNumberBN = toBN(await provider.getBlockNumber());
  }
  expect(currentBlockNumberBN).to.be.equal(blockNumberBN);
};

use(require("chai-subset"));
use(solidity);
export const expect = chai.use(solidity).expect;

export const randomState = (numBytes: number = 64) => hexlify(randomBytes(numBytes));

// App State With Action types for testing
export type AppWithCounterState = {
  counter: BigNumber;
}

export enum ActionType {
  SUBMIT_COUNTER_INCREMENT,
  ACCEPT_INCREMENT,
}

export type AppWithCounterAction = {
  actionType: ActionType,
  increment: BigNumber,
}

export function encodeState(state: AppWithCounterState) {
  return defaultAbiCoder.encode([`tuple(uint256 counter)`], [state]);
}

export function encodeAction(action: AppWithCounterAction) {
  return defaultAbiCoder.encode([`tuple(uint8 actionType, uint256 increment)`], [action]);
}

// TS version of MChallengeRegistryCore::appStateToHash
export const appStateToHash = (state: string) => keccak256(state);

// TS version of MChallengeRegistryCore::computeAppChallengeHash
export const computeAppChallengeHash = (
  id: string,
  appStateHash: string,
  versionNumber: BigNumberish,
  timeout: number,
) =>
  keccak256(
    solidityPack(
      ["bytes1", "bytes32", "uint256", "uint256", "bytes32"],
      ["0x19", id, versionNumber, timeout, appStateHash],
    ),
  );

// TS version of MChallengeRegistryCore::computeActionHash
export const computeActionHash = (
  turnTaker: string,
  previousState: string,
  action: string,
  versionNumber: number,
) =>
  keccak256(
    solidityPack(
      ["bytes1", "address", "bytes", "bytes", "uint256"],
      ["0x19", turnTaker, previousState, action, versionNumber],
    ),
  );

export class AppWithCounterClass {
  get identityHash(): string {
    return keccak256(
      defaultAbiCoder.encode(["uint256", "address[]"], [this.channelNonce, this.participants]),
    );
  }

  get appIdentity(): AppIdentity {
    return {
      participants: this.participants,
      appDefinition: this.appDefinition,
      defaultTimeout: this.defaultTimeout.toString(),
      channelNonce: this.channelNonce.toString(),
    };
  }

  constructor(
    readonly participants: string[],
    readonly appDefinition: string,
    readonly defaultTimeout: number,
    readonly channelNonce: number,
  ) {}
}

export const EMPTY_CHALLENGE = {
  latestSubmitter: AddressZero,
  versionNumber: Zero,
  appStateHash: HashZero,
  status: ChallengeStatus.NO_CHALLENGE,
  finalizesAt: Zero,
};