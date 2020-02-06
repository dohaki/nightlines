import React, { useState, useEffect } from 'react';
import { get } from "lodash";
import { Select } from "@rebass/forms";
import { Box, Flex } from "rebass";

import NavBar from '../components/NavBar'
import OverviewCard from '../components/OverviewCard'
import GatewayCard from '../components/GatewayCard'

import useLoadedUser from "../hooks/useLoadedUser";
import useNetworks from "../hooks/useNetworks";
import store from "../store";

export default function Dashboard() {
  const [isLoaded, loadedUser] = useLoadedUser();
  const networks = useNetworks(isLoaded);
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState(0);
  const { selectedNetwork, setSelectedNetwork } = store.useContainer();

  useEffect(() => {
    if (networks.length > 0) {
      setSelectedNetwork(networks[selectedNetworkIndex]);
    }
  }, [selectedNetworkIndex, networks])

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
        <Flex justifyContent={"space-between"} flexWrap={"wrap"}>
          <OverviewCard
            iouAbbreviation={get(selectedNetwork, "abbreviation")}
            iouAddress={get(selectedNetwork, "address")}
            username={get(loadedUser, "username")}
            userAddress={get(loadedUser, "walletData.address")}
            zkpPublicKey={get(loadedUser, "zkpKeyPair.zkpPublicKey")}
          />
          <GatewayCard
            gatewayAddress={get(selectedNetwork, "gateway.address")}
            userAddress={get(loadedUser, "walletData.address")}
            iouAbbreviation
            iouAddress={get(selectedNetwork)}
          />
        </Flex>
      ) : null}
    </>
  )
}