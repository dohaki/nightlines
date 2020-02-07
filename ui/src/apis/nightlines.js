import config from "../config";

const NIGHTLINES_URL = `${config.NIGHTLINES_HOST}:${config.NIGHTLINES_PORT}`

export async function getZKPKeyPair() {
  const response = await fetch(`${NIGHTLINES_URL}/zkp-key-pair`);
  const keyPair = await response.json();
  return keyPair;
}

export async function getRandomSalt() {
  const response = await fetch(`${NIGHTLINES_URL}/random-salt`);
  const { salt } = await response.json();
  return salt;
}

export async function getMintProof(
  mintValue,
  zkpPublicKey,
  salt
) {
  const response = await fetch(`${NIGHTLINES_URL}/mint-iou-commitment`);
  const proof = await response.json();
  return proof;
}
