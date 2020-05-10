import React, { useEffect } from "react";
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";
import OpenCTL from "./OpenCTL";
import PayOffDebt from "./PayOffDebt";
import ClaimCredit from "./ClaimCredit";
import CloseCTL from "./CloseCTL";

import store from "../store";

export default function GatewayCard() {
  const {
    gatewayDeposit,
    fetchGatewayDeposit,
    selectedNetwork,
    loadedUser,
    overview
  } = store.useContainer();

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const userAddress = get(loadedUser, "walletData.address");
  const iouBalance = Number(get(overview, "balance.value", 0));
  const iouAvailable = Number(get(overview, "leftReceived.value", 0));

  useEffect(() => {
    if (gatewayAddress && userAddress) {
      fetchGatewayDeposit(gatewayAddress, userAddress);
    }
    // eslint-disable-next-line
  }, [gatewayAddress, userAddress]);

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        GATEWAY
      </Text>
      <Flex justifyContent={"space-between"} overflowX={"hidden"}>
        <Text>Address:</Text>
        <CopiableText id={"gateway-address"}>{gatewayAddress}</CopiableText>
      </Flex>
      <Flex justifyContent={"space-between"} overflowX={"hidden"}>
        <Text>TLC Deposit:</Text>
        <Text>{gatewayDeposit}</Text>
      </Flex>
      <OpenCTL />
      {iouBalance < 0 ? (
        <PayOffDebt />
      ) : iouBalance > 0 ? (
        <ClaimCredit />
      ) : iouAvailable > 0 ? (
        <CloseCTL />
      ) : null}
    </DashboardCard>
  );
}
