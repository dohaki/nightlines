import { TLNetwork } from "trustlines-clientlib";
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";
import { get } from "lodash";

import * as nightlines from "./nightlines";

import config from "../config";

const VK_TYPES = ['mint', 'transfer', 'burn'];

const tlNetwork = new TLNetwork({
  port: config.RELAY_PORT,
  path: "/api/v1",
});

function wait(waitingTime = 1000) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, waitingTime);
  })
}

export async function createUser(username) {
  const walletData = await tlNetwork.user.create();
  const zkpKeyPair = await nightlines.getZKPKeyPair();
  return {
    username,
    walletData,
    zkpKeyPair
  }
}

export async function loadUser(walletData) {
  await tlNetwork.user.loadFrom(walletData)
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

export async function getShields() {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/shields`)
  const shields = await response.json()
  return shields
}

export async function getGateways() {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/gateways`)
  const gateways = await response.json()
  return gateways
}

export async function getEnrichedNetworks() {
  const [networks, shields, gateways] = await Promise.all([
    getNetworks(),
    getShields(),
    getGateways()
  ]);
  const merged = networks.map(network => {
    const shield = shields.find(({ networkAddress }) => network.address === networkAddress)
    const gateway = gateways.find(({ gatedNetworkAddress }) => network.address === gatedNetworkAddress)
    return {
      ...network,
      shield,
      gateway
    }
  });
  return merged;
}

export async function getUserOverview(
  networkAddress,
  userAddress
) {
  return tlNetwork.currencyNetwork.getUserOverview(
    networkAddress,
    userAddress
  )
}

export async function getGatewayDeposit(
  gatewayAddress,
  userAddress
) {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/gateways/${gatewayAddress}/deposits/${userAddress}`);
  const deposit = await response.json();
  return tlUtils.formatToAmount(deposit, 18);
}

export async function getGateway(gatewayAddress) {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/gateways/${gatewayAddress}`);
  const gateway = await response.json();
  return gateway;
}

export async function getNewLeafEvents(shieldAddress) {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/events?type=NewLeaf`);
  const events = await response.json();
  return events;
}

export async function getRegisteredVK(
  shieldAddress,
  vkType
) {
  const response = await fetch(`${tlNetwork.provider.relayApiUrl}/shields/${shieldAddress}/vks`);
  const registeredVKs = await response.json();
  const vkTypeIndex = VK_TYPES.indexOf(vkType);
  return registeredVKs[vkTypeIndex];
}

export async function openCollateralized(
  gatewayAddress,
  collateral,
  given
) {
  const openCollateralizedTx = await tlNetwork.trustline.prepareOpenCollateralized(
    gatewayAddress,
    collateral,
    given
  );
  const txHash = await confirmTx(openCollateralizedTx.rawTx);
  // TODO
  await wait();

  const { gatedNetworkAddress } = await getGateway(gatewayAddress);
  const updateRequests = await tlNetwork.trustline.getRequests(
    gatedNetworkAddress
  );

  const collateralRequest = updateRequests.find(({ transactionId }) => transactionId === txHash);
  const acceptTx = await tlNetwork.trustline.prepareAccept(
    collateralRequest.networkAddress,
    gatewayAddress,
    collateralRequest.received.value,
    collateralRequest.given.value
  );
  await confirmTx(acceptTx.rawTx);
  await wait();
}

export async function registerVK(
  shieldAddress,
  vkType
) {
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
  commitment,
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
  const newLeafEvents = await getNewLeafEvents(shieldAddress);
  const relevantEvent = newLeafEvents.find(({ transactionId }) => transactionId === mintTxHash);

  if (!relevantEvent) {
    throw new Error("No NewLeaf event thrown while minting")
  }

  return {
    txHash: mintTxHash,
    type: "mint",
    commitment,
    commitmentIndex: relevantEvent.leafIndex,
  }
}

export async function confirmTx(rawTx) {
  return tlNetwork.transaction.confirm(rawTx);
}

export async function getShieldedNetwork(shieldAddress) {
  return tlNetwork.currencyNetwork.getShieldedNetwork(shieldAddress);
}
