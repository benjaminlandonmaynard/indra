import {
  AppInstanceJson,
  AppInstanceProposal,
  ConditionalTransactionCommitmentJSON,
  IStoreService,
  MinimalTransaction,
  SetStateCommitmentJSON,
  StateChannelJSON,
  STORE_SCHEMA_VERSION,
  AppChallenge,
  StateProgressedContractEvent,
  ChallengeUpdatedContractEvent,
} from "@connext/types";

export class MockStoreService implements IStoreService {
  getSchemaVersion(): Promise<number> {
    return Promise.resolve(STORE_SCHEMA_VERSION);
  }
  updateSchemaVersion(version: number = STORE_SCHEMA_VERSION): Promise<void> {
    return Promise.resolve();
  }
  getAllChannels(): Promise<StateChannelJSON[]> {
    return Promise.resolve([]);
  }

  getStateChannel(multisigAddress: string): Promise<StateChannelJSON | undefined> {
    return Promise.resolve(undefined);
  }
  getStateChannelByOwners(owners: string[]): Promise<StateChannelJSON | undefined> {
    return Promise.resolve(undefined);
  }
  getStateChannelByAppIdentityHash(appIdentityHash: string): Promise<StateChannelJSON | undefined> {
    return Promise.resolve(undefined);
  }
  createStateChannel(stateChannel: StateChannelJSON): Promise<void> {
    return Promise.resolve();
  }
  getAppInstance(appIdentityHash: string): Promise<AppInstanceJson | undefined> {
    return Promise.resolve(undefined);
  }
  createAppInstance(multisigAddress: string, appInstance: AppInstanceJson): Promise<void> {
    return Promise.resolve();
  }
  updateAppInstance(multisigAddress: string, appInstance: AppInstanceJson): Promise<void> {
    return Promise.resolve();
  }
  removeAppInstance(multisigAddress: string, appIdentityHash: string): Promise<void> {
    return Promise.resolve();
  }
  getAppProposal(appIdentityHash: string): Promise<AppInstanceProposal | undefined> {
    return Promise.resolve(undefined);
  }
  createAppProposal(multisigAddress: string, appProposal: AppInstanceProposal): Promise<void> {
    return Promise.resolve();
  }
  removeAppProposal(multisigAddress: string, appIdentityHash: string): Promise<void> {
    return Promise.resolve();
  }
  getFreeBalance(multisigAddress: string): Promise<AppInstanceJson | undefined> {
    return Promise.resolve(undefined);
  }
  createFreeBalance(multisigAddress: string, freeBalance: AppInstanceJson): Promise<void> {
    return Promise.resolve();
  }
  updateFreeBalance(multisigAddress: string, freeBalance: AppInstanceJson): Promise<void> {
    return Promise.resolve();
  }
  getSetupCommitment(multisigAddress: string): Promise<MinimalTransaction | undefined> {
    return Promise.resolve(undefined);
  }
  createSetupCommitment(multisigAddress: string, commitment: MinimalTransaction): Promise<void> {
    return Promise.resolve();
  }
  getSetStateCommitment(appIdentityHash: string): Promise<SetStateCommitmentJSON | undefined> {
    return Promise.resolve(undefined);
  }
  createSetStateCommitment(
    appIdentityHash: string,
    commitment: SetStateCommitmentJSON,
  ): Promise<void> {
    return Promise.resolve();
  }
  updateSetStateCommitment(
    appIdentityHash: string,
    commitment: SetStateCommitmentJSON,
  ): Promise<void> {
    return Promise.resolve();
  }
  getConditionalTransactionCommitment(
    appIdentityHash: string,
  ): Promise<ConditionalTransactionCommitmentJSON | undefined> {
    return Promise.resolve(undefined);
  }
  createConditionalTransactionCommitment(
    appIdentityHash: string,
    commitment: ConditionalTransactionCommitmentJSON,
  ): Promise<void> {
    return Promise.resolve();
  }
  updateConditionalTransactionCommitment(
    appIdentityHash: string,
    commitment: ConditionalTransactionCommitmentJSON,
  ): Promise<void> {
    return Promise.resolve();
  }
  getWithdrawalCommitment(multisigAddress: string): Promise<MinimalTransaction | undefined> {
    return Promise.resolve(undefined);
  }
  createWithdrawalCommitment(
    multisigAddress: string,
    commitment: MinimalTransaction,
  ): Promise<void> {
    return Promise.resolve();
  }
  updateWithdrawalCommitment(
    multisigAddress: string,
    commitment: MinimalTransaction,
  ): Promise<void> {
    return Promise.resolve();
  }
  clear(): Promise<void> {
    return Promise.resolve();
  }
  restore(): Promise<void> {
    return Promise.resolve();
  }

  ////// Watcher methods
  async getAppChallenge(appIdentityHash: string): Promise<AppChallenge | undefined> {
    return Promise.resolve(undefined);
  }

  async createAppChallenge(
    multisigAddress: string,
    appChallenge: AppChallenge,
  ): Promise<void> {
    return Promise.resolve();
  }

  async updateAppChallenge(
    multisigAddress: string,
    appChallenge: AppChallenge,
  ): Promise<void> {
    return Promise.resolve();
  }

  ///// Events
  async getLatestProcessedBlock(): Promise<number> {
    return Promise.resolve(4);
  }

  async updateLatestProcessedBlock(blockNumber: number): Promise<void> {
    return Promise.resolve();
  }

  async getStateProgressedEvent(
    appIdentityHash: string,
  ): Promise<StateProgressedContractEvent | undefined> {
    return Promise.resolve(undefined);
  }

  async createStateProgressedEvent(
    multisigAddress: string,
    appChallenge: StateProgressedContractEvent,
  ): Promise<void> {
    return Promise.resolve();
  }

  async updateStateProgressedEvent(
    multisigAddress: string,
    appChallenge: StateProgressedContractEvent,
  ): Promise<void> {
    return Promise.resolve();
  }

  async getChallengeUpdatedEvent(
    appIdentityHash: string,
  ): Promise<ChallengeUpdatedContractEvent | undefined> {
    return Promise.resolve(undefined);
  }

  async createChallengeUpdatedEvent(
    multisigAddress: string,
    event: ChallengeUpdatedContractEvent,
  ): Promise<void> {
    return Promise.resolve();
  }

  async updateChallengeUpdatedEvent(
    multisigAddress: string,
    appChallenge: ChallengeUpdatedContractEvent,
  ): Promise<void> {
    return Promise.resolve();
  }
}

export const mockStoreService = new MockStoreService();
