import React, { useEffect } from 'react';
import { useHistory } from "react-router-dom";

import NavBar from '../components/NavBar'

import * as localStorage from "../apis/localStorage";
import * as sessionStorage from "../apis/sessionStorage";
import * as tlLib from "../apis/tlLib";

export default function Dashboard() {
  const history = useHistory();

  useEffect(() => {
    const currentUsername = sessionStorage.getCurrentUsername();
    if (!currentUsername) {
      history.replace("/login")
    } else {
      const { walletData } = localStorage.getUserByUsername(currentUsername.toLowerCase());
      tlLib.loadUser(walletData);
    }
  }, [])

  return (
    <>
      <NavBar />
    </>
  )
}