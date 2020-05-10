import React, { useState } from "react";
import { Text, Flex, Box } from "rebass";
import { get } from "lodash";
import { toast } from "react-toastify";

import Button from "../components/Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function CloseCTL() {
  const {
    fetchGatewayDeposit,
    fetchOverview,
    selectedNetwork,
    loadedUser,
    overview,
    fetchCoinBalance
  } = store.useContainer();
  const [loading, setLoading] = useState(false);

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");
  const iouBalance = get(overview, "balance.value", 0);

  const handleClick = async () => {
    try {
      setLoading(true);

      if (Number(iouBalance) !== 0) {
        throw new Error("Closing not possible. Settle your trustline.");
      }

      await tlLib.closeCollateralizedTrustline(gatewayAddress);
      fetchOverview(iouAddress, userAddress);
      fetchGatewayDeposit(gatewayAddress, userAddress);
      fetchCoinBalance();
      toast("Close success", { type: "success" });
    } catch (error) {
      console.log(error);
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex mt={3} justifyContent={"flex-end"}>
      <Box>
        <Text color={"background"}>{"invisible"}</Text>
        <Button loading={loading} onClick={handleClick} minWidth={150}>
          Close
        </Button>
      </Box>
    </Flex>
  );
}
