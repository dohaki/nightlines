import React from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";


import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";
import Mint from "./Mint";

import store from "../store";

export default function ShieldCard() {
  const { selectedNetwork } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        SHIELD
      </Text>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
      >
        <Text>Address:</Text>
        <CopiableText id={"shield-address"}>
          {shieldAddress}
        </CopiableText>
      </Flex>
      <Mint />
    </DashboardCard>
  )
};
