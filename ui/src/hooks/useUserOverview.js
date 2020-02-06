import { useEffect, useState } from 'react';

import * as tlLib from "../apis/tlLib";

export default function useUserOverview(
  networkAddress,
  userAddress
) {
  const [overview, setOverview] = useState({});

  async function fetchOverview() {
    const overview = await tlLib.getUserOverview(
      networkAddress,
      userAddress
    );
    setOverview(overview);
  }

  useEffect(() => {
    if (networkAddress && userAddress) {
      fetchOverview()
    }
  }, [networkAddress, userAddress]);

  return [overview, fetchOverview];
}

