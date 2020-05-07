import { useState } from "react";

import * as tlLib from "../apis/tlLib";

export default function useGatewayDeposit() {
  const [gatewayDeposit, setGatewayDeposit] = useState(0);

  async function fetchGatewayDeposit(gatewayAddress, userAddress) {
    const deposit = await tlLib.getGatewayDeposit(gatewayAddress, userAddress);
    setGatewayDeposit(deposit.value);
  }

  return { gatewayDeposit, fetchGatewayDeposit };
}
