import tl from "trustlines-clientlib/lib/TLNetwork.js";
import ethers from "ethers";
import chalk from "chalk";

import config from "../config/index.js";

import { benchmarkGateway } from "./benchmark-gateway.js";
import { benchmarkZok, zokStep } from "./benchmark-zokrates.js";
import { benchmarkShield } from "./benchmark-shield.js";
import { writeToCsv } from "./utils.js";

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

  const shieldBenchmarkData = await benchmarkShield(tlInstances, 100);
  writeToCsv("shield.csv", shieldBenchmarkData);

  // const gatewaBenchmarkData = await benchmarkGateway(tl1);
  // writeToCsv("gateway.csv", gatewaBenchmarkData);

  // const zokCompileBenchmarkData = await benchmarkZok(zokStep.COMPILE);
  // writeToCsv(`zokrates-${zokStep.COMPILE}.csv`, zokCompileBenchmarkData);

  // const zokSetupBenchmarkData = await benchmarkZok(zokStep.SETUP);
  // writeToCsv(`zokrates-${zokStep.SETUP}.csv`, zokSetupBenchmarkData);

  // const zokWitnessBenchmarkData = await benchmarkZok(zokStep.WITNESS);
  // writeToCsv(`zokrates-${zokStep.WITNESS}.csv`, zokWitnessBenchmarkData);

  // const zokProofBenchmarkData = await benchmarkZok(zokStep.PROOF);
  // writeToCsv(`zokrates-${zokStep.PROOF}.csv`, zokProofBenchmarkData);
}

try {
  start();
} catch (error) {
  console.error(error);
}
