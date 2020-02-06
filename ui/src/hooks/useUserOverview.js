import { useState } from 'react';

import * as tlLib from "../apis/tlLib";

export default function useUserOverview() {
  const [overview, setOverview] = useState({});

  async function fetchOverview(
    networkAddress,
    userAddress
  ) {
    const overview = await tlLib.getUserOverview(
      networkAddress,
      userAddress
    );
    setOverview(overview);
  }

  return { overview, fetchOverview };
}

