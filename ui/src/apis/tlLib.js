import { TLNetwork } from "trustlines-clientlib";

import config from "../config";

const tlNetwork = new TLNetwork({
  host: config.RELAY_HOST,
  port: config.RELAY_PORT,
  walletType: "ethers"
});

export async function createUser(username) {
  const walletData = await tlNetwork.user.create();
  return {
    username,
    walletData
  }
}

export async function loadUser(walletData) {
  await tlNetwork.user.loadFrom(walletData)
}
