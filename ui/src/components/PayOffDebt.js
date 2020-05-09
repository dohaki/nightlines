import React, { useState } from "react";
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { toast } from "react-toastify";

import Button from "../components/Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function PayOffDebt() {
  const {
    fetchGatewayDeposit,
    fetchOverview,
    selectedNetwork,
    loadedUser,
    overview
  } = store.useContainer();
  const [payOffValue, setPayOffValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const iouAddress = get(selectedNetwork, "address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const userAddress = get(loadedUser, "walletData.address");
  const iouBalance = get(overview, "balance.value", 0);

  const handleClick = async () => {
    try {
      setLoading(true);

      if (iouBalance >= 0) {
        throw new Error("Pay off not possible because there is no debt.");
      }

      if (payOffValue > -iouBalance) {
        throw new Error(
          "Entered value to pay off is higher than the existing debt."
        );
      }

      await tlLib.payOffDebt(gatewayAddress, payOffValue);
      fetchOverview(iouAddress, userAddress);
      fetchGatewayDeposit(gatewayAddress, userAddress);
      setPayOffValue(0);
      toast("Pay off success", { type: "success" });
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
        <Text>{iouAbbreviation} Pay Off Value</Text>
        <Input
          width={315}
          type={"number"}
          step={1}
          min={0}
          max={-iouBalance}
          value={payOffValue}
          onChange={event => setPayOffValue(event.target.value)}
        />
      </Box>
      <Box>
        <Text color={"background"}>{"invisible"}</Text>
        <Button loading={loading} onClick={handleClick} minWidth={150}>
          Pay Off
        </Button>
      </Box>
    </Flex>
  );
}
