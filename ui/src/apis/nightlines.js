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

export async function getVKOf(type) {
  const response = await fetch(`${NIGHTLINES_URL}/vk?type=${type}`);
  const vk = await response.json();
  return vk;
}

export async function getMintProof(
  mintValueRaw,
  zkpPublicKey,
  salt
) {
  // TODO mintValue to raw
  const response = await fetch(`${NIGHTLINES_URL}/mint-iou-commitment`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: mintValueRaw,
      zkpPublicKey,
      salt
    })
  });
  const proof = await response.json();
  return proof;
}

export async function getTransferProof(
  shieldAddress,
  inputCommitments,
  outputCommitments,
  zkpPublicKeyReceiver,
  zkpPrivateKeySender
) {
  const response = await fetch(`${NIGHTLINES_URL}/transfer-iou-commitment`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shieldAddress,
      inputCommitments,
      outputCommitments,
      zkpPublicKeyReceiver,
      zkpPrivateKeySender
    })
  });
  const proof = await response.json();
  return proof;
}

export async function getTransferProofByKey(proofKey) {
  const response = await fetch(`${NIGHTLINES_URL}/transfer-proof/${proofKey}`);
  const key = await response.json();
  return key;
}


export async function getLeafByLeafIndex(
  shieldAddress,
  leafIndex
) {
  const response = await fetch(`${NIGHTLINES_URL}/leaf-by-leaf-index`);
  const keyPair = await response.json();
  return keyPair;
}
