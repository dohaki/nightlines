import localforage from "localforage";

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
    salt
  }
) {
  const instance = createInstance(username);
  return instance.setItem(commitment, {
    commitmentIndex,
    shieldAddress,
    amount,
    type,
    salt
  });
}
