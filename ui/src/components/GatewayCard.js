import React, { useState, useEffect } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { FiLoader } from "react-icons/fi";
import { toast } from 'react-toastify';

import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";
import Button from "../components/Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function GatewayCard({ userAddress }) {
  const {
    gatewayDeposit,
    fetchGatewayDeposit,
    fetchOverview,
    selectedNetwork
  } = store.useContainer();
  const [collateral, setCollateral] = useState(0);
  const [iouGiven, setIOUGiven] = useState(0);
  const [loading, setLoading] = useState(false);

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const iouAddress = get(selectedNetwork, "address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");

  useEffect(() => {
    if (gatewayAddress && userAddress) {
      fetchGatewayDeposit(
        gatewayAddress,
        userAddress
      );
    }
  }, [gatewayAddress, userAddress]);

  const handleClick = async () => {
    try {      
      setLoading(true);
      await tlLib.openCollateralized(
        gatewayAddress,
        collateral,
        iouGiven
      );
      fetchOverview(iouAddress, userAddress);
      fetchGatewayDeposit(gatewayAddress, userAddress);
      setCollateral(0);
      setIOUGiven(0);
      toast("Deposit success", { type: "success" });
    } catch (error) {
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        GATEWAY
      </Text>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
      >
        <Text>Address:</Text>
        <CopiableText id={"gateway-address"}>
          {gatewayAddress}
        </CopiableText>
      </Flex>
      <Flex
        justifyContent={"space-between"}
        overflowX={"hidden"}
      >
        <Text>TLC Deposit:</Text>
        <Text>{gatewayDeposit}</Text>
      </Flex>
      <Flex mt={3} justifyContent={"space-between"}>
        <Box>
          <Text>TLC Collateral</Text>
          <Input
            width={150}
            type={"number"}
            step={0.0000000001}
            min={0}
            value={collateral}
            onChange={event => setCollateral(event.target.value)}
          />
        </Box>
        <Box>
          <Text>{iouAbbreviation} Given</Text>
          <Input
            width={150}
            type={"number"}
            step={1}
            min={0}
            value={iouGiven}
            onChange={event => setIOUGiven(event.target.value)}
          />
        </Box>
        <Box>
          <Text color={"background"}>{"invisible"}</Text>
          <Button
            disabled={loading}
            onClick={handleClick}
            minWidth={150}
          >
            {loading ? (
              <FiLoader size={15} />
            ) : "Deposit"}
          </Button>
        </Box>
      </Flex>
    </DashboardCard>
  )
};
