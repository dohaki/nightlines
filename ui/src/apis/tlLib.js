import { TLNetwork } from "trustlines-clientlib";
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";
import { get } from "lodash";

import * as nightlines from "./nightlines";

import config from "../config";

export const VK_TYPES = ["mint", "transfer", "burn"];

const tlNetwork = new TLNetwork({
  port: config.RELAY_PORT,
  path: "/api/v1"
});

function wait(waitingTime = 1000) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, waitingTime);
  });
}

export async function createUser(username) {
  const walletData = await tlNetwork.user.create();
  const zkpKeyPair = await nightlines.getZKPKeyPair();
  return {
    username,
    walletData,
    zkpKeyPair
  };
}

export async function loadUser(walletData) {
  await tlNetwork.user.loadFrom(walletData);
}

export async function getCoinBalance() {
  const balance = await tlNetwork.user.getBalance();
  return get(balance, "value");
}

export async function getCoins() {
  const txHash = await tlNetwork.user.requestEth();
  return txHash;
}

export async function getNetworks() {
  return tlNetwork.currencyNetwork.getAll();
}

export async function getLatestBlocknumber() {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/blocknumber`);
  const blocknumber = await response.json();
  return blocknumber;
}

export async function getShields() {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/shields`);
  const shields = await response.json();
  return shields;
}

export async function getGateways() {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/gateways`);
  const gateways = await response.json();
  return gateways;
}

export async function getGasUsedForTx(shieldAddress, txHash, fromBlock = 0) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/events?type=GasUsed&fromBlock=${fromBlock}`
  );
  const events = await response.json();
  return events.find(({ transactionId }) => transactionId === txHash);
}

export async function getEnrichedNetworks() {
  const [networks, shields, gateways] = await Promise.all([
    getNetworks(),
    getShields(),
    getGateways()
  ]);
  const merged = networks.map(network => {
    const shield = shields.find(
      ({ networkAddress }) => network.address === networkAddress
    );
    const gateway = gateways.find(
      ({ gatedNetworkAddress }) => network.address === gatedNetworkAddress
    );
    return {
      ...network,
      shield,
      gateway
    };
  });
  return merged;
}

export async function getUserOverview(networkAddress, userAddress) {
  return tlNetwork.currencyNetwork.getUserOverview(networkAddress, userAddress);
}

export async function getGatewayDeposit(gatewayAddress, userAddress) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/gateways/${gatewayAddress}/deposits/${userAddress}`
  );
  const deposit = await response.json();
  return tlUtils.formatToAmount(deposit, 18);
}

export async function getGateway(gatewayAddress) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/gateways/${gatewayAddress}`
  );
  const gateway = await response.json();
  return gateway;
}

export async function getNewLeafEvents(shieldAddress, fromBlock = 0) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/events?type=NewLeaf&fromBlock=${fromBlock}`
  );
  const events = await response.json();
  return events;
}

export async function getNewLeavesEvents(shieldAddress, fromBlock = 0) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/events?type=NewLeaves&fromBlock=${fromBlock}`
  );
  const events = await response.json();
  return events;
}

export async function getRegisteredVK(shieldAddress, vkType) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/vks`
  );
  const registeredVKs = await response.json();
  const vkTypeIndex = VK_TYPES.indexOf(vkType);
  return registeredVKs[vkTypeIndex];
}

export async function getAllRegisteredVKs(shieldAddress) {
  const response = await fetch(
    `${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/vks`
  );
  const registeredVKs = await response.json();
  return registeredVKs;
}

export async function openCollateralized(gatewayAddress, collateral) {
  const openCollateralizedTx = await tlNetwork.trustline.prepareOpenCollateralized(
    gatewayAddress,
    collateral
  );
  const txHash = await confirmTx(openCollateralizedTx.rawTx);
  // TODO
  await wait();

  const { gatedNetworkAddress } = await getGateway(gatewayAddress);
  const updateRequests = await tlNetwork.trustline.getRequests(
    gatedNetworkAddress
  );

  const collateralRequest = updateRequests.find(
    ({ transactionId }) => transactionId === txHash
  );
  const acceptTx = await tlNetwork.trustline.prepareAccept(
    collateralRequest.networkAddress,
    gatewayAddress,
    collateralRequest.received.value,
    collateralRequest.given.value
  );
  await confirmTx(acceptTx.rawTx);
  await wait();
}

export async function registerVK(shieldAddress, vkType) {
  const vk = await nightlines.getVKOf(vkType);
  const registerVKTx = await tlNetwork.shield.prepareRegisterVK(
    shieldAddress,
    vk.vkDecimalsArray,
    vkType,
    {
      gasLimit: "2000000"
    }
  );
  const registerVKTxHash = await confirmTx(registerVKTx.rawTx);
  await wait();
  return registerVKTxHash;
}

export async function mintCommitment(
  shieldAddress,
  proof,
  inputs,
  mintValue,
  commitment
) {
  const mintTx = await tlNetwork.shield.prepareMintCommitment(
    shieldAddress,
    proof,
    inputs,
    mintValue,
    commitment,
    {
      gasLimit: "2000000"
    }
  );
  const mintTxHash = await confirmTx(mintTx.rawTx);

  await wait();

  const latestBlocknumber = await getLatestBlocknumber();

  // Add information on used gas for statistics
  const gasUsed = await getGasUsedForTx(
    shieldAddress,
    mintTxHash,
    latestBlocknumber
  );

  const newLeafEvents = await getNewLeafEvents(
    shieldAddress,
    latestBlocknumber
  );
  const relevantEvent = newLeafEvents.find(
    ({ transactionId }) => transactionId === mintTxHash
  );

  if (!relevantEvent) {
    throw new Error("No NewLeaf event thrown while minting");
  }

  return {
    txHash: mintTxHash,
    type: "mint",
    commitment,
    commitmentIndex: relevantEvent.leafIndex,
    gasUsed: {
      byVerifierContract: get(gasUsed, "byVerifierContract"),
      byShieldContract: get(gasUsed, "byShieldContract"),
      byCurrencyNetworkContract: get(gasUsed, "byCurrencyNetworkContract")
    }
  };
}

export async function burnCommitment(
  shieldAddress,
  proof,
  inputs,
  root,
  nullifier,
  value,
  payTo
) {
  const burnTx = await tlNetwork.shield.prepareBurnCommitment(
    shieldAddress,
    proof,
    inputs,
    root,
    nullifier,
    value,
    payTo,
    {
      gasLimit: "2000000"
    }
  );
  const burnTxHash = await confirmTx(burnTx.rawTx);

  await wait();

  const latestBlocknumber = await getLatestBlocknumber();

  // Add information on used gas for statistics
  const gasUsed = await getGasUsedForTx(
    shieldAddress,
    burnTxHash,
    latestBlocknumber
  );

  return {
    txHash: burnTxHash,
    type: "burn",
    gasUsed: {
      byVerifierContract: get(gasUsed, "byVerifierContract"),
      byShieldContract: get(gasUsed, "byShieldContract"),
      byCurrencyNetworkContract: get(gasUsed, "byCurrencyNetworkContract")
    },
    status: "spent"
  };
}

export async function transferCommitment(
  shieldAddress,
  proof,
  inputs,
  root,
  nullifierC,
  nullifierD,
  commitmentE,
  commitmentF
) {
  const transferTx = await tlNetwork.shield.prepareTransferCommitment(
    shieldAddress,
    proof,
    inputs,
    root,
    nullifierC,
    nullifierD,
    commitmentE,
    commitmentF,
    {
      gasLimit: "2000000"
    }
  );
  const latestBlocknumber = await getLatestBlocknumber();

  const transferTxHash = await confirmTx(transferTx.rawTx);

  await wait();

  // Add information on used gas for statistics
  const gasUsed = await getGasUsedForTx(
    shieldAddress,
    transferTxHash,
    latestBlocknumber
  );

  const newLeavesEvents = await getNewLeavesEvents(
    shieldAddress,
    latestBlocknumber
  );
  const relevantEvent = newLeavesEvents.find(
    ({ transactionId }) => transactionId === transferTxHash
  );

  if (!relevantEvent) {
    throw new Error("No NewLeaves event thrown while transferring");
  }

  const { minLeafIndex } = relevantEvent;
  const indexE =
    Number(minLeafIndex) + relevantEvent.leafValues.indexOf(commitmentE);
  const indexF =
    Number(minLeafIndex) + relevantEvent.leafValues.indexOf(commitmentF);

  const noteE = {
    txHash: transferTxHash,
    type: "transfer",
    commitment: commitmentE,
    commitmentIndex: indexE,
    gasUsed: {
      byVerifierContract: get(gasUsed, "byVerifierContract"),
      byShieldContract: get(gasUsed, "byShieldContract"),
      byCurrencyNetworkContract: get(gasUsed, "byCurrencyNetworkContract")
    },
    status: "sent"
  };

  const noteF = {
    txHash: transferTxHash,
    type: "transfer",
    commitment: commitmentF,
    commitmentIndex: indexF,
    gasUsed: {
      byVerifierContract: get(gasUsed, "byVerifierContract"),
      byShieldContract: get(gasUsed, "byShieldContract"),
      byCurrencyNetworkContract: get(gasUsed, "byCurrencyNetworkContract")
    },
    status: "unspent"
  };

  return {
    noteE,
    noteF
  };
}

export async function confirmTx(rawTx) {
  return tlNetwork.transaction.confirm(rawTx);
}

export async function getShieldedNetwork(shieldAddress) {
  return tlNetwork.currencyNetwork.getShieldedNetwork(shieldAddress);
}
