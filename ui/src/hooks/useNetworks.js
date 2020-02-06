import { useEffect, useState } from 'react';

import * as tlLib from "../apis/tlLib";

export default function useNetworks(isUserLoaded = false) {
  const [networks, setNetworks] = useState([]);

  useEffect(() => {
    async function getEnrichedNetworks() {
      const enrichedNetworks = await tlLib.getEnrichedNetworks();
      setNetworks(enrichedNetworks);
    }
   
    // only fetch networks if user in session is loaded
    if (isUserLoaded) {
      getEnrichedNetworks();
    }
  }, [isUserLoaded, setNetworks]);

  return networks;
}

