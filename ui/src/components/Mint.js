import React, { useState } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { FiLoader } from "react-icons/fi";
import { toast } from 'react-toastify';

import Button from "./Button";

import store from "../store";

import * as nightlines from "../apis/nightlines";
import * as tlLib from "../apis/tlLib";

export default function Mint() {
  const [mintValue, setMintValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { selectedNetwork, zkpPublicKey } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");

  const handleClick = async () => {
    try {      
      setLoading(true);
      const randomSalt = await nightlines.getRandomSalt();
      const mintProof = await nightlines.getMintProof(
        mintValue,
        zkpPublicKey,
        randomSalt
      );
      const { commitmentIndex } = await tlLib.mintCommitment(
        shieldAddress,
        mintProof.proof,
        mintProof.inputs,
        mintProof.mintValue,
        mintProof.commitment
      );

      // TODO store { ...mintProof, commitmentIndex }
    } catch (error) {
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex mt={3} justifyContent={"space-between"}>
      <Box>
        <Text>Mint Value</Text>
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
