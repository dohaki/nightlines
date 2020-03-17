import chalk from "chalk";
import axios from "axios";
import { readFileSync } from "fs";

import { getGateways } from "./benchmark-gateway.js";
import * as nightlinesUtils from "../utils.js";
import * as iou from "../iou.js";

function wait(waitingTime = 1000) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, waitingTime);
  });
}

async function getShields(relayApiUrl) {
  const { data } = await axios.get(`${relayApiUrl}/shields`);
  return data;
}

async function openCollateralizedTrustlines(
  tlInstance,
  gatewayAddress,
  gatedNetworkAddress
) {
  console.log("Opened collateralized trustline...");
  const { rawTx } = await tlInstance.trustline.prepareOpenCollateralized(
    gatewayAddress,
    "0.000000001", // = 1 GWEI = 10000 WEI
    10000
  );
  const txHash = await tlInstance.transaction.confirm(rawTx);

  await wait();

  // accept
  const updateRequests = await tlInstance.trustline.getRequests(
    gatedNetworkAddress
  );
  const collateralRequest = updateRequests.find(
    ({ transactionId }) => transactionId === txHash
  );
  const acceptTx = await tlInstance.trustline.prepareAccept(
    collateralRequest.networkAddress,
    gatewayAddress,
    collateralRequest.received.value,
    collateralRequest.given.value
  );
  await tlInstance.transaction.confirm(acceptTx.rawTx);
  await wait();
}

async function registerAllVKs(tlInstance, shieldAddress) {
  const availableVKTypes = ["burn", "mint", "transfer"];

  for (const type of availableVKTypes) {
    const vkJSON = JSON.parse(
      readFileSync(
        `${process.cwd()}/zokrates/iou-${type}/iou-${type}-vk.json`,
        "utf-8"
      )
    );
    const vkDecimalsArray = nightlinesUtils
      .flattenDeep(Object.values(vkJSON))
      .map(value => nightlinesUtils.hexToDec(value));
    const { rawTx } = await tlInstance.shield.prepareRegisterVK(
      shieldAddress,
      vkDecimalsArray,
      type,
      {
        gasLimit: "2000000"
      }
    );
    await tlInstance.transaction.confirm(rawTx);
    console.log(`VK for ${type} registered.`);
  }

  await wait();
}

async function getGasUsedForTx(
  relayApiUrl,
  shieldAddress,
  txHash,
  fromBlock = 0
) {
  const { data: events } = await axios.get(
    `${relayApiUrl}/shields/${shieldAddress}/events?type=GasUsed&fromBlock=${fromBlock}`
  );
  return events.find(({ transactionId }) => transactionId === txHash);
}

async function getLatesBlocknumber(relayApiUrl) {
  const { data: blocknumber } = await axios.get(`${relayApiUrl}/blocknumber`);
  return blocknumber;
}

async function getGasStatsForTx(relayApiUrl, shieldAddress, txHash) {
  const latestBlocknumber = await getLatesBlocknumber(relayApiUrl);

  // Add information on used gas for statistics
  const gasUsed = await getGasUsedForTx(
    relayApiUrl,
    shieldAddress,
    txHash,
    latestBlocknumber
  );
  const totalGas = [
    "byShieldContract",
    "byVerifierContract",
    "byCurrencyNetworkContract"
  ].reduce((sum, key) => {
    return Number(sum) + Number(gasUsed[key]);
  }, 0);

  return {
    totalGas,
    shieldGas: Number(gasUsed.byShieldContract),
    verifierGas: Number(gasUsed.byVerifierContract),
    currencyNetworkGas: Number(gasUsed.byCurrencyNetworkContract)
  };
}

async function getNewLeafEvents(relayApiUrl, shieldAddress, fromBlock = 0) {
  const { data: events } = await axios.get(
    `${relayApiUrl}/shields/${shieldAddress}/events?type=NewLeaf&fromBlock=${fromBlock}`
  );
  return events;
}

async function mint(tlInstance, amount, shieldAddress, zkpPublicKey) {
  const proof = await iou.mint(
    shieldAddress,
    amount.raw,
    zkpPublicKey,
    await nightlinesUtils.randomHex(32)
  );

  const { rawTx } = await tlInstance.shield.prepareMintCommitment(
    shieldAddress,
    proof.proof,
    proof.publicInputs,
    amount.value,
    proof.commitment,
    {
      gasLimit: "2000000"
    }
  );
  const txHash = await tlInstance.transaction.confirm(rawTx);

  await wait();

  const latestBlocknumber = await getLatesBlocknumber(
    tlInstance.provider.relayApiUrl
  );
  const newLeafEvents = await getNewLeafEvents(
    tlInstance.provider.relayApiUrl,
    shieldAddress,
    latestBlocknumber
  );
  const relevantEvent = newLeafEvents.find(
    ({ transactionId }) => transactionId === txHash
  );

  const gasStats = await getGasStatsForTx(
    tlInstance.provider.relayApiUrl,
    shieldAddress,
    txHash
  );

  const note = {
    amount,
    shieldAddress,
    zkpPublicKey,
    commitment: proof.commitment,
    index: relevantEvent.leafIndex
  };

  return {
    method: "mint",
    ...gasStats,
    note
  };
}

export async function benchmarkShield(tlInstances, n = 1) {
  console.log(
    `\nStarting benchmark for ${chalk.green("CurrencyNetworkShield")}...`
  );

  const csvArray = [
    "method,total gas,shield gas,verifier gas,currency network gas"
  ];

  const [A] = tlInstances;

  const networks = await A.currencyNetwork.getAll();
  const shields = await getShields(A.provider.relayApiUrl);
  const gateways = await getGateways(A.provider.relayApiUrl);

  const networkAddress = networks[0].address;
  const networkDecimals = networks[0].decimals;
  const shieldAddress = shields.find(
    shield => shield.networkAddress === networkAddress
  ).address;
  const gatewayAddress = gateways.find(
    ({ gatedNetworkAddress }) => networkAddress === gatedNetworkAddress
  ).address;

  // make sure instances have enough collateral to mint
  await openCollateralizedTrustlines(A, gatewayAddress, networkAddress);

  // make sure all VKs are registered
  await registerAllVKs(A, shieldAddress);

  // create zkp key pair for benchmark
  const zkpPrivateKey = await nightlinesUtils.randomHex(32);
  const zkpPublicKey = await nightlinesUtils.hash(zkpPrivateKey);

  // amount to use for minting, transferring and burning
  const amount = {
    decimals: networkDecimals,
    raw: "1",
    value: 1 / Math.pow(10, networkDecimals)
  };

  const mintedNotes = [];

  // mint n times
  for (const i of Array(n).keys()) {
    const mintData = await mint(A, amount, shieldAddress, zkpPublicKey);
    const { totalGas, shieldGas, verifierGas, currencyNetworkGas } = mintData;
    console.log({
      count: i,
      method: "mint",
      totalGas,
      shieldGas,
      verifierGas,
      currencyNetworkGas
    });
    csvArray.push(
      `mint,${totalGas},${shieldGas},${verifierGas},${currencyNetworkGas}`
    );

    // save minted note for later usage
    mintedNotes.push(mintData.note);
  }

  // transfer n times to self
  for (const i of Array(n).keys()) {
    // TODO
  }

  // burn n times
  for (const i of Array(n).keys()) {
    // TODO
  }

  return csvArray.join("\n");
}
