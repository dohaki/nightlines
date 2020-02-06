import React, { useEffect } from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function OverviewCard({
  username = "",
  userAddress,
  zkpPublicKey
}) {
  const {
    coinBalance,
    fetchCoinBalance,
    overview,
    fetchOverview,
    selectedNetwork
  } = store.useContainer();

  useEffect(() => {
    if (userAddress && get(selectedNetwork, "address")) {
      fetchCoinBalance();
      fetchOverview(selectedNetwork.address, userAddress);
    }
  }, [userAddress, get(selectedNetwork, "address")])

  const available = Number(get(overview, "balance.value", 0)) +
    Number(get(overview, "leftReceived.value", 0))

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        {username.toUpperCase()}
      </Text>
      <Flex justifyContent={"space-between"}>
        <Text>Address:</Text>
        <CopiableText id={"user-address"}>
          {userAddress}
        </CopiableText>
      </Flex>
      <Flex justifyContent={"space-between"} color={"primary"}>
        <Text>ZKP PK:</Text>
        <CopiableText id={"zkp-public-key"}>
          {zkpPublicKey}
        </CopiableText>
      </Flex>
      <Flex justifyContent={"space-between"}>
        <Text>TLC Balance:</Text>
        <Text
          onClick={async () => {
            await tlLib.getCoins();
            setTimeout(() => fetchCoinBalance(), 1000);
          }}
        >
          {coinBalance}
        </Text>
      </Flex>
      <Flex justifyContent={"space-between"} overflowX={"hidden"}>
        <Text>{get(selectedNetwork, "abbreviation")} Balance:</Text>
        <Text>{get(overview, "balance.value", 0)}</Text>
      </Flex>
      <Flex justifyContent={"space-between"} overflowX={"hidden"}>
        <Text>{get(selectedNetwork, "abbreviation")} Available:</Text>
        <Text>{available}</Text>
      </Flex>
    </DashboardCard>
  )
};
