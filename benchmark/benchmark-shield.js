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
  try {
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
    console.log("=> Open collateralized trustline ✔️");
  } catch (error) {
    console.log("=> Open collateralized trustline ✖️");
    throw error;
  }
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
    console.log(`=> Register VK for ${type} ✔️`);
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

export async function getNewLeavesEvents(
  relayApiUrl,
  shieldAddress,
  fromBlock = 0
) {
  const { data: events } = await axios.get(
    `${relayApiUrl}/shields/${shieldAddress}/events?type=NewLeaves&fromBlock=${fromBlock}`
  );
  return events;
}

async function mint({ tlInstance, amount, shieldAddress, zkpPublicKey }) {
  const salt = await nightlinesUtils.randomHex(32);
  const proof = await iou.mint(shieldAddress, amount.raw, zkpPublicKey, salt);

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
    commitmentIndex: relevantEvent.leafIndex,
    salt
  };

  return {
    method: "mint",
    ...gasStats,
    note
  };
}

async function transfer({
  tlInstance,
  shieldAddress,
  noteC,
  noteD,
  zkpPrivateKeyOwner,
  zkpPublicKeyOwner,
  amount
}) {
  const noteE = {
    salt: await nightlinesUtils.randomHex(32),
    amount
  };
  const noteF = {
    salt: await nightlinesUtils.randomHex(32),
    amount
  };
  const proof = await iou.transfer(
    shieldAddress,
    [noteC, noteD],
    [noteE, noteF],
    zkpPublicKeyOwner,
    zkpPrivateKeyOwner
  );
  const commitmentE = proof.outputCommitments[0].commitment;
  const commitmentF = proof.outputCommitments[1].commitment;
  const transferTx = await tlInstance.shield.prepareTransferCommitment(
    shieldAddress,
    proof.proof,
    proof.publicInputs,
    proof.root,
    proof.inputCommitments[0].nullifier,
    proof.inputCommitments[1].nullifier,
    commitmentE,
    commitmentF,
    {
      gasLimit: "2000000"
    }
  );
  const latestBlocknumber = await getLatesBlocknumber(
    tlInstance.provider.relayApiUrl
  );

  const txHash = await tlInstance.transaction.confirm(transferTx.rawTx);

  await wait();

  const gasStats = await getGasStatsForTx(
    tlInstance.provider.relayApiUrl,
    shieldAddress,
    txHash
  );

  const newLeavesEvents = await getNewLeavesEvents(
    tlInstance.provider.relayApiUrl,
    shieldAddress,
    latestBlocknumber
  );
  const relevantEvent = newLeavesEvents.find(
    ({ transactionId }) => transactionId === txHash
  );

  if (!relevantEvent) {
    throw new Error("No NewLeaves event thrown while transferring");
  }

  const { minLeafIndex } = relevantEvent;
  const indexE =
    Number(minLeafIndex) + relevantEvent.leafValues.indexOf(commitmentE);
  const indexF =
    Number(minLeafIndex) + relevantEvent.leafValues.indexOf(commitmentF);

  const outputNotes = [
    {
      ...noteE,
      commitmentIndex: indexE,
      commitment: commitmentE
    },
    {
      ...noteF,
      commitmentIndex: indexF,
      commitment: commitmentF
    }
  ];

  return {
    method: "transfer",
    ...gasStats,
    outputNotes
  };
}

async function burn({ tlInstance, shieldAddress, note, zkpPrivateKeyOwner }) {
  const proof = await iou.burn(
    shieldAddress,
    tlInstance.user.address,
    note,
    zkpPrivateKeyOwner
  );

  const { rawTx } = await tlInstance.shield.prepareBurnCommitment(
    shieldAddress,
    proof.proof,
    proof.publicInputs,
    proof.root,
    proof.nullifier,
    note.amount.value,
    tlInstance.user.address,
    {
      gasLimit: "2000000"
    }
  );
  const txHash = await tlInstance.transaction.confirm(rawTx);

  await wait();

  const gasStats = await getGasStatsForTx(
    tlInstance.provider.relayApiUrl,
    shieldAddress,
    txHash
  );

  return {
    method: "burn",
    ...gasStats,
    note
  };
}

export async function benchmarkShield(tlInstances, n = 2) {
  console.log(
    `\n▶️ Starting benchmark for ${chalk.green("CurrencyNetworkShield")}`
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

  console.log("\n▶️ Setting the scene to run benchmark:\n");
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
    value: String(1 / Math.pow(10, networkDecimals))
  };

  const mintedNotes = [];

  // mint n times
  console.log(
    `\n▶️ Benchmark ${chalk.green("mint")} by running ${chalk.yellow(n)} times:`
  );
  for (const i of Array(n).keys()) {
    const mintData = await mint({
      tlInstance: A,
      amount,
      shieldAddress,
      zkpPublicKey
    });
    const { totalGas, shieldGas, verifierGas, currencyNetworkGas } = mintData;
    csvArray.push(
      `mint,${totalGas},${shieldGas},${verifierGas},${currencyNetworkGas}`
    );
    // save minted note for later usage
    mintedNotes.push(mintData.note);

    console.log(`\n=> ⛏ Gas usage of run ${chalk.yellow(i + 1)}:`, {
      method: "mint",
      totalGas,
      shieldGas,
      verifierGas,
      currencyNetworkGas
    });
  }

  await wait();

  // transfer n times to self
  console.log(
    `\n▶️ Benchmark ${chalk.green("transfer")} by running ${chalk.yellow(
      n
    )} times:`
  );
  for (const i of Array(n).keys()) {
    const noteC = mintedNotes[0];
    const noteD = mintedNotes[1];

    const transferData = await transfer({
      tlInstance: A,
      shieldAddress,
      zkpPrivateKeyOwner: zkpPrivateKey,
      zkpPublicKeyOwner: zkpPublicKey,
      amount,
      noteC,
      noteD
    });
    const {
      totalGas,
      shieldGas,
      verifierGas,
      currencyNetworkGas,
      outputNotes
    } = transferData;
    csvArray.push(
      `transfer,${totalGas},${shieldGas},${verifierGas},${currencyNetworkGas}`
    );

    // replace inplace
    mintedNotes[0] = outputNotes[0];
    mintedNotes[1] = outputNotes[1];

    console.log(`\n=> 💸 Gas usage of run ${chalk.yellow(i + 1)}:`, {
      method: "transfer",
      totalGas,
      shieldGas,
      verifierGas,
      currencyNetworkGas
    });
  }

  // burn n times
  console.log(
    `\n▶️ Benchmark ${chalk.green("burn")} by running ${chalk.yellow(n)} times:`
  );
  for (const i of Array(n).keys()) {
    const note = mintedNotes[i];

    const burnData = await burn({
      tlInstance: A,
      shieldAddress,
      note,
      zkpPrivateKeyOwner: zkpPrivateKey
    });

    const { totalGas, shieldGas, verifierGas, currencyNetworkGas } = burnData;
    csvArray.push(
      `burn,${totalGas},${shieldGas},${verifierGas},${currencyNetworkGas}`
    );

    console.log(`\n=> 🔥 Gas usage of run ${chalk.yellow(i + 1)}:`, {
      method: "burn",
      totalGas,
      shieldGas,
      verifierGas,
      currencyNetworkGas
    });
  }

  console.log(
    `\n▶️ Benchmark for ${chalk.green("CurrencyNetworkShield")} done.`
  );
  return csvArray.join("\n");
}
