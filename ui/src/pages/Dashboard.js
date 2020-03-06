import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import { Select } from "@rebass/forms";
import { Box, Flex } from "rebass";

import NavBar from '../components/NavBar'
import OverviewCard from '../components/OverviewCard'
import GatewayCard from '../components/GatewayCard'
import ShieldCard from '../components/ShieldCard'
import CommitmentsCard from '../components/CommitmentsCard'

import store from "../store";
import * as sessionStorage from "../apis/sessionStorage";

export default function Dashboard() {
  const history = useHistory();
  const [selectedNetworkIndex, setSelectedNetworkIndex] = useState(0);
  const {
    setSelectedNetwork,
    loadUserByUsername,
    loadedUser,
    networks,
    fetchNetworks,
    createWebSocket,
    closeWebSocket
  } = store.useContainer();

  useEffect(() => {
    // check if logged in user in session and load
    const currentUsername = sessionStorage.getCurrentUsername();
    if (!currentUsername) {
      history.replace("/login")
    } else {
      loadUserByUsername(currentUsername);
      fetchNetworks();
    }
    // eslint-disable-next-line
  }, [history]);

  useEffect(() => {
    if (networks.length > 0) {
      setSelectedNetwork(networks[selectedNetworkIndex]);
    }
  }, [selectedNetworkIndex, networks, setSelectedNetwork])

  useEffect(() => {
    createWebSocket();
    return () => closeWebSocket();
  }, [])

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
      {loadedUser ? (
        <Flex justifyContent={"space-between"} flexWrap={"wrap"}>
          <OverviewCard />
          <GatewayCard />
          <ShieldCard />
          <CommitmentsCard />
        </Flex>
      ) : null}
    </>
  )
}