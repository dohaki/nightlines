import { useState } from 'react';

export default function useSelectedNetwork() {
  const [selectedNetwork, setSelectedNetwork] = useState();

  return { selectedNetwork, setSelectedNetwork };
}

