import { MNEMONIC_PATH, } from "@counterfactual/node";
import {
  confirmPostgresConfigurationEnvVars,
  POSTGRES_CONFIGURATION_ENV_KEYS,
  PostgresServiceFactory,
} from "@counterfactual/postgresql-node-connector";
import * as eth from "ethers";
import { NatsServiceFactory } from "../../nats-messaging-client/src/index";

import { showMainPrompt } from "./bot";
import {
  afterUser,
  getFreeBalance,
  logEthFreeBalance,
} from "./utils";
import * as connext from "../../client"

const BASE_URL = process.env.BASE_URL!;
const NETWORK = process.env.ETHEREUM_NETWORK || "kovan";

const ethUrl = process.env.ETHEREUM_NETWORK || `https://${NETWORK}.infura.io/metamask`;

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw Error("No private key specified in env. Exiting.");
}

const nodeUrl = process.env.NODE_URL;
if (!nodeUrl || !nodeUrl.startsWith('nats://')) {
  throw Error("No accurate node url specified in env. Exiting.");
}

let pgServiceFactory: PostgresServiceFactory;
// console.log(`Using Nats configuration for ${process.env.NODE_ENV}`);
// console.log(`Using Firebase configuration for ${process.env.NODE_ENV}`);

process.on("warning", e => console.warn(e.stack));

// FIXME for non local testing
// @ts-ignore
natsServiceFactory = new NatsServiceFactory();

confirmPostgresConfigurationEnvVars();
pgServiceFactory = new PostgresServiceFactory({
  database: process.env[POSTGRES_CONFIGURATION_ENV_KEYS.database]!,
  host: process.env[POSTGRES_CONFIGURATION_ENV_KEYS.host]!,
  password: process.env[POSTGRES_CONFIGURATION_ENV_KEYS.password]!,
  port: parseInt(process.env[POSTGRES_CONFIGURATION_ENV_KEYS.port]!, 10),
  type: "postgres",
  username: process.env[POSTGRES_CONFIGURATION_ENV_KEYS.username]!,
});

let client: connext.ConnextChannel;
let bot;

export function getMultisigAddress() {
  return client.multisigAddress;
}

export function getWalletAddress() {
  return client.wallet.address;
}

export function getBot() {
  return bot;
}

(async () => {
  await pgServiceFactory.connectDb();

  console.log("Creating store");
  const store = pgServiceFactory.createStoreService(process.env.USERNAME!);

  const connextOpts: connext.ClientOptions = {
    delete_this_url: BASE_URL,
    rpcProviderUrl: ethUrl,
    nodeUrl,
    privateKey,
    loadState: store.loadState,
    saveState: store.saveState,
  }

  console.log("Using client options:");
  console.log("     - rpcProviderUrl:", ethUrl);
  console.log("     - nodeUrl:", nodeUrl);
  console.log("     - privateKey:", privateKey);

  console.log("process.env.NODE_MNEMONIC: ", process.env.NODE_MNEMONIC);
  await store.set([{ key: MNEMONIC_PATH, value: process.env.NODE_MNEMONIC }]);

  try {
    console.log("Creating connext");
    const client = await connext.connect(connextOpts);
    console.log("Client created successfully!");

    console.log("Public Identifier", client.publicIdentifier);
    console.log("Account multisig address:", client.multisigAddress);

    if (process.env.DEPOSIT_AMOUNT) {
      const depositParams: connext.DepositParameters = {
        amount: eth.utils.parseEther(process.env.DEPOSIT_AMOUNT).toString(),
        assetId: null, // deposit eth
      }
      await client.deposit(depositParams)
      console.log(`Successfully deposited ${depositParams.amount}!`)
      // await client.deposit(node, process.env.DEPOSIT_AMOUNT, client.multisigAddress);
    }

    afterUser(node, bot.nodeAddress, client.multisigAddress);
    logEthFreeBalance(await getFreeBalance(node, client.multisigAddress));
    showMainPrompt(node);
  } catch (e) {
    console.error("\n");
    console.error(e);
    console.error("\n");
    process.exit(1);
  }
})();
