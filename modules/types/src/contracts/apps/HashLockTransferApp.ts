import { BigNumber, BigNumberish } from "ethers/utils";

import { enumify } from "../../utils";

import { CoinTransfer } from "../funding";
import {
  singleAssetTwoPartyCoinTransferEncoding,
  tidy,
} from "../misc";

import { HashLockTransfer } from "./common";

export const HashLockTransferAppName = "HashLockTransferApp";

////////////////////////////////////////
// keep synced w contracts/app/HashLockTransferApp.sol

// ABI Encoding TS Types
export type HashLockTransferAppState = {
  coinTransfers: CoinTransfer[];
  lockHash: string;
  preImage: string;
  timelock: BigNumber;
  finalized: boolean;
};

// ABI Encodings
export const HashLockTransferAppStateEncoding = tidy(`tuple(
  ${singleAssetTwoPartyCoinTransferEncoding} coinTransfers,
  bytes32 lockHash,
  bytes32 preImage,
  uint256 timelock,
  bool finalized
)`);

export type HashLockTransferAppAction = {
  preImage: string;
};

export const HashLockTransferAppActionEncoding = `tuple(bytes32 preImage)`;

////////////////////////////////////////
// Off-chain app types

// statuses
export const HashLockTransferStatus = enumify({
  PENDING: "PENDING",
  REDEEMED: "REDEEMED",
  FAILED: "FAILED",
  UNLOCKED: "UNLOCKED",
  EXPIRED: "EXPRED",
});
export type HashLockTransferStatus =
  (typeof HashLockTransferStatus)[keyof typeof HashLockTransferStatus];

// Client Controller Params
export type HashLockTransferParameters = {
  conditionType: typeof HashLockTransfer;
  amount: BigNumberish;
  timelock: BigNumberish;
  lockHash: string;
  assetId?: string;
  meta?: object;
};

// Client Controller Response
export type HashLockTransferResponse = {
  appId: string;
};

// Client Resolve Params
export type ResolveHashLockTransferParameters = {
  conditionType: typeof HashLockTransfer;
  preImage: string;
};

// Client Resolve Response
export type ResolveHashLockTransferResponse = {
  appId: string;
  sender: string;
  amount: BigNumber;
  assetId: string;
  meta?: object;
};

// Getter
export type GetHashLockTransferResponse =
  | {
      senderPublicIdentifier: string;
      receiverPublicIdentifier?: string;
      assetId: string;
      amount: string;
      lockHash: string;
      status: HashLockTransferStatus;
      meta?: any;
    }
  | undefined;

// Event Data
export type CreatedLinkedTransferMeta = {
  encryptedPreImage?: string;
};
