import config from "../config";

const NIGHTLINES_URL = `${config.NIGHTLINES_HOST}:${config.NIGHTLINES_PORT}`

export async function getZKPKeyPair() {
  const response = await fetch(`${NIGHTLINES_URL}/zkp-key-pair`);
  const keyPair = await response.json();
  return keyPair;
}
