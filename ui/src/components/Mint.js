import React, { useState } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { FiLoader } from "react-icons/fi";
import { toast } from 'react-toastify';
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";

import Button from "./Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";
import * as nightlines from "../apis/nightlines";

export default function Mint() {
  const [mintValue, setMintValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { selectedNetwork, loadedUser } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");

  const handleClick = async () => {
    try {
      setLoading(true);
      const { decimals } = await tlLib.getShieldedNetwork(shieldAddress);
      const mintValueRaw = tlUtils.calcRaw(mintValue, decimals).toString();
      const randomSalt = await nightlines.getRandomSalt();
      const mintProof = await nightlines.getMintProof(
        mintValueRaw,
        get(loadedUser, "zkpKeyPair.zkpPublicKey"),
        randomSalt
      );
      toast(`Proof generated for commitment: ${mintProof.commitment}`, { type: "info" });
      console.log(mintProof)

      const mintCommitment = await tlLib.mintCommitment(
        shieldAddress,
        mintProof.proof,
        mintProof.publicInputs,
        mintValue,
        mintProof.commitment
      );

      // TODO store { ...mintProof, commitmentIndex }
      console.log({
        ...mintProof,
        ...mintCommitment,
        type: "mint"
      });
    } catch (error) {
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex mt={3} justifyContent={"space-between"}>
      <Box>
        <Text>{iouAbbreviation} Mint Value</Text>
        <Input
          width={315}
          type={"number"}
          step={1}
          min={0}
          value={mintValue}
          onChange={event => setMintValue(event.target.value)}
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
          ) : "Mint"}
        </Button>
      </Box>
    </Flex>
  )
};
