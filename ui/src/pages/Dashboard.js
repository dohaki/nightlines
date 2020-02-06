import React, { useState, useEffect } from 'react';
import { get } from "lodash";
import { Select } from "@rebass/forms";
import { Box } from "rebass";

import NavBar from '../components/NavBar'
import OverviewCard from '../components/OverviewCard'

import useLoadedUser from "../hooks/useLoadedUser";
import useNetworks from "../hooks/useNetworks";
import useSelectedNetwork from "../hooks/useSelectedNetwork";

export default function Dashboard() {
  const [isLoaded, loadedUser] = useLoadedUser();
  const networks = useNetworks(isLoaded);
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState(0);
  const selectedNetwork = useSelectedNetwork(networks, selectedNetworkIndex);

  console.log({ selectedNetwork, loadedUser })

  return (
    <>
      <NavBar />
      <Box p={4} pb={0}>
        <Select
          id='network'
          name='network'
          onChange={event => setSelectedNetworkIndex(event.target.selectedIndex)}
        >
          {networks.map((network, i) => (
            <option
              key={i}>
              {network.name} ({network.address})
            </option>
          ))}
        </Select>
      </Box>
      <Box mx='auto' />
      {isLoaded ? (
        <OverviewCard
          iouAbbreviation={get(selectedNetwork, "abbreviation")}
          iouAddress={get(selectedNetwork, "address")}
          username={get(loadedUser, "username")}
          userAddress={get(loadedUser, "walletData.address")}
          zkpPublicKey={get(loadedUser, "zkpKeyPair.zkpPublicKey")}
        />
      ) : null}
    </>
  )
}