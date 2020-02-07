import { useState } from 'react';

import * as tlLib from "../apis/tlLib";
import * as localforage from "../apis/localforage";

export default function useLoadedUser() {
  const [loadedUser, setLoadedUser] = useState();
  
  async function loadUserByUsername(username) {
    const user = await localforage.getUserByUsername(username);
    await tlLib.loadUser(user.walletData);
    setLoadedUser(user);
  }

  return { loadedUser, loadUserByUsername };
}

