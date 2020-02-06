import { useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";

import * as tlLib from "../apis/tlLib";
import * as sessionStorage from "../apis/sessionStorage";
import * as localforage from "../apis/localforage";

export default function useLoadedUser() {
  const history = useHistory();
  const [loadedUser, setLoadedUser] = useState();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  
  // check if logged in user in session and load
  useEffect(() => {
    async function loadUserByUsername(username) {
      const user = await localforage.getUserByUsername(username);
      await tlLib.loadUser(user.walletData);
      setIsUserLoaded(true);
      setLoadedUser(user);
    }
  
    const currentUsername = sessionStorage.getCurrentUsername();
    if (!currentUsername) {
      history.replace("/login")
    } else {
      loadUserByUsername(currentUsername);
    }
  }, [isUserLoaded, setIsUserLoaded]);

  return [isUserLoaded, loadedUser];
}

