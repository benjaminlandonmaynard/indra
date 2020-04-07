import { JsonRpcProvider } from "ethers/providers";
import {
  AppRegistry,
  IMessagingService,
  Contract,
  GetConfigResponse,
  IChannelProvider,
  IClientStore,
  ILoggerService,
  INodeApiClient,
  KeyGen,
  Network,
  Xpub,
} from "@connext/types";
import { MessagingService } from "@connext/messaging";

export interface NodeInitializationParameters {
  nodeUrl: string;
  messaging: IMessagingService;
  logger?: ILoggerService;
  userPublicIdentifier?: Xpub;
  nodePublicIdentifier?: Xpub;
  channelProvider?: IChannelProvider;
}

export type InternalClientOptions = {
  appRegistry: AppRegistry;
  channelProvider: IChannelProvider;
  config: GetConfigResponse;
  ethProvider: JsonRpcProvider;
  keyGen: KeyGen;
  logger: ILoggerService;
  messaging: MessagingService;
  network: Network;
  node: INodeApiClient;
  store: IClientStore;
  token: Contract;
  xpub: Xpub;
};

export {
  Address,
  AppInstanceInfo,
  AppInstanceJson,
  AppRegistry,
  calculateExchange,
  CFChannelProviderOptions,
  ChannelAppSequences,
  ChannelProviderConfig,
  ChannelState,
  CheckDepositRightsParameters,
  CheckDepositRightsResponse,
  ClientOptions,
  ConnextClientStorePrefix,
  ConnextEventEmitter,
  CreateChannelMessage,
  CreateChannelResponse,
  DefaultApp,
  DepositConfirmationMessage,
  DepositFailedMessage,
  DepositParameters,
  DepositStartedMessage,
  fromWad,
  GetChannelResponse,
  GetConfigResponse,
  IChannelProvider,
  IConnextClient,
  INodeApiClient,
  InstallMessage,
  inverse,
  IRpcConnection,
  isBN,
  IStoreService,
  JsonRpcRequest,
  KeyGen,
  LinkedTransferParameters,
  LinkedTransferResponse,
  maxBN,
  minBN,
  NodeInitializationParameters,
  NodeMessageWrappedProtocolMessage,
  RebalanceProfile,
  ProposeMessage,
  RejectProposalMessage,
  RequestCollateralResponse,
  RequestDepositRightsParameters,
  RequestDepositRightsResponse,
  RescindDepositRightsParameters,
  RescindDepositRightsResponse,
  ResolveConditionParameters,
  ResolveConditionResponse,
  ResolveLinkedTransferParameters,
  ResolveLinkedTransferResponse,
  StateChannelJSON,
  StorePair,
  SwapParameters,
  SwapResponse,
  toBN,
  tokenToWei,
  toWad,
  TransferInfo,
  TransferParameters,
  UninstallMessage,
  UpdateStateMessage,
  weiToToken,
  WithdrawParameters,
} from "@connext/types";
