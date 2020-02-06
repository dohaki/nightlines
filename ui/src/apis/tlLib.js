import { TLNetwork } from "trustlines-clientlib";
import { get } from "lodash";

import * as nightlines from "./nightlines";

import config from "../config";

const tlNetwork = new TLNetwork({
  port: config.RELAY_PORT,
  path: "/api/v1",
});

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
