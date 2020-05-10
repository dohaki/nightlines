import React, { useState } from "react";
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { toast } from "react-toastify";

import Button from "../components/Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";

export default function ClaimCredit() {
  const {
    fetchGatewayDeposit,
    fetchOverview,
    selectedNetwork,
    loadedUser,
    overview
  } = store.useContainer();
  const [claimValue, setClaimValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const gatewayAddress = get(selectedNetwork, "gateway.address");
  const iouAddress = get(selectedNetwork, "address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const userAddress = get(loadedUser, "walletData.address");
  const iouBalance = get(overview, "balance.value", 0);

  const handleClick = async () => {
    try {
      setLoading(true);

      if (iouBalance <= 0) {
        throw new Error("Claim not possible because there is no credit.");
      }

      if (claimValue > iouBalance) {
        throw new Error(
          "Entered value to claim is higher than the existing credit."
        );
      }

      await tlLib.claimCredit(gatewayAddress, claimValue);
      fetchOverview(iouAddress, userAddress);
      fetchGatewayDeposit(gatewayAddress, userAddress);
      setClaimValue(0);
      toast("Claim success", { type: "success" });
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
        <Text>{iouAbbreviation} Claim Value</Text>
        <Input
          width={315}
          type={"number"}
          step={1}
          min={0}
          max={iouBalance}
          value={claimValue}
          onChange={event => setClaimValue(event.target.value)}
        />
      </Box>
      <Box>
        <Text color={"background"}>{"invisible"}</Text>
        <Button loading={loading} onClick={handleClick} minWidth={150}>
          Claim
        </Button>
      </Box>
    </Flex>
  );
}
