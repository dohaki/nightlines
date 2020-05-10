import tl from "trustlines-clientlib/lib/TLNetwork.js";
import chalk from "chalk";

import config from "../config/index.js";

import { main as setupZokrates } from "../zokrates/setup.js";
import { benchmarkGateway } from "./benchmark-gateway.js";
import { benchmarkZok, zokStep } from "./benchmark-zokrates.js";
import { benchmarkShield } from "./benchmark-shield.js";
import {
  writeToCsv,
  getAverageValuesOfZok,
  getAverageValuesOfShield,
  getAverageValuesOfGateway
} from "./utils.js";

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
  try {
    const n = process.argv[2] >= 2 ? Number(process.argv[2]) : 2;

    const tlInstances = [tl1, tl2];
    await createAndLoadUsers(tlInstances);
    await loadCoins(tlInstances);

    await setupZokrates();

    const shieldBenchmarkData = await benchmarkShield(tlInstances, n);
    writeToCsv("shield.csv", shieldBenchmarkData);

    const gatewayBenchmarkData = await benchmarkGateway(tlInstances, n);
    writeToCsv("gateway.csv", gatewayBenchmarkData);

    const zokCompileBenchmarkData = await benchmarkZok(zokStep.COMPILE, n);
    writeToCsv(`zokrates-${zokStep.COMPILE}.csv`, zokCompileBenchmarkData);

    const zokSetupBenchmarkData = await benchmarkZok(zokStep.SETUP, n);
    writeToCsv(`zokrates-${zokStep.SETUP}.csv`, zokSetupBenchmarkData);

    const zokWitnessBenchmarkData = await benchmarkZok(zokStep.WITNESS, n);
    writeToCsv(`zokrates-${zokStep.WITNESS}.csv`, zokWitnessBenchmarkData);

    const zokProofBenchmarkData = await benchmarkZok(zokStep.PROOF, n);
    writeToCsv(`zokrates-${zokStep.PROOF}.csv`, zokProofBenchmarkData);

    // average values for zokrates related data
    const zokAveragesCSV = [];
    for (const step of Object.keys(zokStep)) {
      const zokAverages = await getAverageValuesOfZok(
        `zokrates-${step.toLowerCase()}.csv`
      );
      const [headRow, ...rows] = zokAverages.split("\n");
      if (zokAveragesCSV.length === 0) {
        zokAveragesCSV.push(headRow);
      }
      for (const row of rows) {
        zokAveragesCSV.push(row);
      }
    }
    writeToCsv(`zokrates-averages.csv`, zokAveragesCSV.join("\n"));

    // average values for shield related data
    const shieldAveragesCSV = await getAverageValuesOfShield();
    writeToCsv(`shield-averages.csv`, shieldAveragesCSV);

    // average values for gateway related data
    const gatewayAveragesCSV = await getAverageValuesOfGateway();
    writeToCsv(`gateway-averages.csv`, gatewayAveragesCSV);

    console.log(chalk.green("\n==================="));
    console.log(chalk.green("[ BENCHMARK SUCCESS ]"));
    console.log(chalk.green("==================="));
    console.log(
      "Benchmarking data are stored as .csv files in ./benchmark/data"
    );
  } catch (error) {
    console.log(chalk.red("\n=================="));
    console.log(chalk.red("[ BENCHMARK FAILED ]"));
    console.log(chalk.red("=================="));
    console.error(error);
  }
}

start();
