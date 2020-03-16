import tl from "trustlines-clientlib/lib/TLNetwork.js";
import ethers from "ethers";
import chalk from "chalk";

import config from "../config/index.js";

import { benchmarkGateway } from "./benchmark-gateway.js";

const provider = new ethers.providers.JsonRpcProvider(
  `http://${config.RPC_PROVIDER_HOST}:${config.RPC_PROVIDER_PORT}`
);

const tl1 = new tl.TLNetwork({
  port: config.RELAY_PORT,
  path: "/api/v1"
});

const tl2 = new tl.TLNetwork({
  port: config.RELAY_PORT,
  path: "/api/v1"
});

async function createAndLoadUsers(tlInstances) {
  const walletDatas = await Promise.all(
    tlInstances.map(instance => instance.user.create())
  );
  await Promise.all(
    walletDatas.map((walletData, i) => tlInstances[i].user.loadFrom(walletData))
  );
}

async function loadCoins(tlInstances) {
  await Promise.all(tlInstances.map(instance => instance.user.requestEth()));
}

async function start() {
  const tlInstances = [tl1, tl2];
  await createAndLoadUsers(tlInstances);
  await loadCoins(tlInstances);

  benchmarkGateway(tl1);
}

try {
  start();
} catch (error) {
  console.error(error);
}
