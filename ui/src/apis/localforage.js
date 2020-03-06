import localforage from "localforage";

export const COMMITMENT_STATUS = {
  UNSPENT: "unspent",
  SPENT: "spent",
  PENDING: "pending",
  SENT: "sent",
}

/**
 * 
 * @param {string} name 
 */
export function createInstance(name) {
  if (!name) {
    throw new Error("Instance name has to be set");
  }
  return localforage.createInstance({
    name: name.toLowerCase()
  })
}

/**
 * 
 * @param {*} username 
 * @returns {Promise<{
 *  username: string,
 *  walletData: any,
 *  zkpKeyPair: {
 *    publicKey: string,
 *    privateKey: string,
 * }}>}
 */
export async function getUserByUsername(username = "") {
  const instance = createInstance(username);
  return instance.getItem("user");
}


export async function setUser({ username, walletData, zkpKeyPair }) {
  const instance = createInstance(username);
  return instance.setItem("user", { username, walletData, zkpKeyPair });
}

export async function setCommitment(
  username,
  {
    commitment,
    commitmentIndex,
    shieldAddress,
    amount,
    type,
    salt,
    gasUsed,
    status = COMMITMENT_STATUS.PENDING,
    zkpPublicKey
  }
) {
  const instance = createInstance(username);
  return instance.setItem(commitment, {
    commitment,
    commitmentIndex,
    shieldAddress,
    amount,
    type,
    salt,
    gasUsed,
    status,
    zkpPublicKey
  });
}

export async function getCommitmentsByUsername(username) {
  const instance = createInstance(username);
  let commitments = [];
  await instance.iterate((value, key) => {
    if (value.commitment) {
      commitments.push(value);
    }
  });
  return commitments;
}

export async function setCommitmentStatus(username, commitment, status) {
  const instance = createInstance(username);
  const note = await instance.getItem(commitment);
  return instance.setItem(commitment, {
    ...note,
    status
  });
}
