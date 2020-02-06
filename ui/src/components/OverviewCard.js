import React from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";

import useCoinBalance from "../hooks/useCoinBalance";
import useUserOverview from "../hooks/useUserOverview";

import * as tlLib from "../apis/tlLib";

export default function OverviewCard({
  iouAbbreviation = "IOU",
  iouAddress,
  username = "",
  userAddress,
  zkpPublicKey
}) {
  const [coinBalance, fetchCoinBalance] = useCoinBalance();
  const [overview] = useUserOverview(
    iouAddress,
    userAddress
  );

  const available = Number(get(overview, "balance.value", 0)) +
    Number(get(overview, "leftReceived.value", 0))

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        {username.toUpperCase()}
      </Text>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
      >
        <Text>Address:</Text>
        <CopiableText
          maxWidth={350}
          id={"user-address"}
        >
          {userAddress}
        </CopiableText>
      </Flex>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
        color={"primary"}
      >
        <Text>ZKP Public Key:</Text>
        <CopiableText
          id={"zkp-public-key"}
          maxWidth={350}
        >
          {zkpPublicKey}
        </CopiableText>
      </Flex>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
      >
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
        <Text>{iouAbbreviation} Balance:</Text>
        <Text>{get(overview, "balance.value", 0)}</Text>
      </Flex>
      <Flex justifyContent={"space-between"} overflowX={"hidden"}>
        <Text>{iouAbbreviation} Available:</Text>
        <Text>{available}</Text>
      </Flex>
    </DashboardCard>
  )
};
