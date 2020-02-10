import React, { useState, useEffect } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { FiLoader } from "react-icons/fi";
import { toast } from 'react-toastify';
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";

import Button from "./Button";
import Badge from "./Badge";

import store from "../store";

import * as tlLib from "../apis/tlLib";
import * as nightlines from "../apis/nightlines";
import * as localforage from "../apis/localforage";

export default function Mint() {
  const [mintValue, setMintValue] = useState(0);
  const [isVKRegistered, setVKRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectedNetwork, loadedUser, fetchOverview } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");
  const username = get(loadedUser, "username");

  useEffect(() => {
    async function getRegisteredMintVK() {
      const registeredMintVK = await tlLib.getRegisteredVK(
        shieldAddress,
        "mint"
      );
      setVKRegistered(registeredMintVK.length > 0);
    }

    if (shieldAddress) {
      getRegisteredMintVK();
    }
  }, [shieldAddress, setVKRegistered]);

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

      const storedCommitment = await localforage.setCommitment(
        username,
        {
          shieldAddress,
          commitmentIndex: mintCommitment.commitmentIndex,
          commitment: mintCommitment.commitment,
          amount: {
            value: mintValue,
            raw: mintValueRaw,
            decimals
          },
          type: "mint"
        }
      );
      console.log("Stored commitment: ", storedCommitment);
      toast("Successfully minted commitment", { type: "success" });
      fetchOverview(iouAddress, userAddress);
    } catch (error) {
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const handleRegisterVK = async () => {
    if (!isVKRegistered) {
      await tlLib.registerVK(
        shieldAddress,
        "mint"
      );
      toast(`Mint VK successfully registered`, { type: "success" });
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
        <Text
          onClick={handleRegisterVK}
          color={isVKRegistered && "background"}
          textAlign={"center"}
        >
          Register VK
        </Text>
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
