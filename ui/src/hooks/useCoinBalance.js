import { useState } from "react";

import * as tlLib from "../apis/tlLib";

export default function useCoinBalance() {
  const [coinBalance, setCoinBalance] = useState(0);

  async function fetchCoinBalance() {
    const balance = await tlLib.getCoinBalance();
    setCoinBalance(balance);
  }

  return { coinBalance, fetchCoinBalance };
}
