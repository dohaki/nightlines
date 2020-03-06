import React, { useState, useEffect } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { toast } from 'react-toastify';
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";

import Button from "./Button";

import store from "../store";

import * as tlLib from "../apis/tlLib";
import * as nightlines from "../apis/nightlines";
import * as localforage from "../apis/localforage";

export default function Mint() {
  const [mintValue, setMintValue] = useState(0);
  const [isVKRegistered, setVKRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    selectedNetwork,
    loadedUser,
    fetchOverview,
    fetchCommitments
  } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");
  const username = get(loadedUser, "username");
  const zkpPublicKey = get(loadedUser, "zkpKeyPair.zkpPublicKey");

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
        zkpPublicKey,
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
          zkpPublicKey, 
          commitmentIndex: mintCommitment.commitmentIndex,
          commitment: mintProof.commitment,
          salt: randomSalt,
          amount: {
            value: mintValue,
            raw: mintValueRaw,
            decimals
          },
          type: "mint",
          status: localforage.COMMITMENT_STATUS.UNSPENT,
          gasUsed: mintCommitment.gasUsed
        }
      );
      console.log("Stored commitment: ", storedCommitment);
      toast("Successfully minted commitment", { type: "success" });
      fetchOverview(iouAddress, userAddress);
      fetchCommitments(username);
      setMintValue(0);
    } catch (error) {
      console.error(error);
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
      setVKRegistered(true);
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
          loading={loading}
          onClick={handleClick}
          minWidth={150}
        >
          Mint
        </Button>
      </Box>
    </Flex>
  )
};
