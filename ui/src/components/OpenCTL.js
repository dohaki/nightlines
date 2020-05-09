import React, { useState } from "react";
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { toast } from "react-toastify";

import Button from "../components/Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function OpenCTL() {
  const {
    fetchGatewayDeposit,
    fetchOverview,
    fetchCoinBalance,
    selectedNetwork,
    loadedUser
  } = store.useContainer();
  const [collateral, setCollateral] = useState(0);
  const [loading, setLoading] = useState(false);

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");

  const handleClick = async () => {
    try {
      setLoading(true);
      await tlLib.openCollateralized(gatewayAddress, collateral);
      fetchOverview(iouAddress, userAddress);
      fetchGatewayDeposit(gatewayAddress, userAddress);
      fetchCoinBalance();
      setCollateral(0);
      toast("Deposit success", { type: "success" });
    } catch (error) {
      console.log(error);
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex mt={3} justifyContent={"space-between"}>
      <Box>
        <Text>TLC Collateral</Text>
        <Input
          width={315}
          type={"number"}
          step={0.0000000001}
          min={0}
          value={collateral}
          onChange={event => setCollateral(event.target.value)}
        />
      </Box>
      <Box>
        <Text color={"background"}>{"invisible"}</Text>
        <Button loading={loading} onClick={handleClick} minWidth={150}>
          Deposit
        </Button>
      </Box>
    </Flex>
  );
}
