import { useEffect, useState } from 'react';
import { get } from "lodash";

export default function useSelectedNetwork(
  networks = [],
  index = 0
) {
  const [selectedNetwork, setSelectedNetwork] = useState();

  useEffect(() => {
    const network = get(networks, `[${index}]`);
    setSelectedNetwork(network);
  }, [index, networks]);

  return selectedNetwork;
}

