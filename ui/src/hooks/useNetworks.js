import { useState } from "react";

import * as tlLib from "../apis/tlLib";

export default function useNetworks() {
  const [networks, setNetworks] = useState([]);

  async function fetchNetworks() {
    const enrichedNetworks = await tlLib.getEnrichedNetworks();
    setNetworks(enrichedNetworks);
  }

  return { networks, fetchNetworks };
}
