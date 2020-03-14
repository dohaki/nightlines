import React, { useState } from 'react';
import { Text, Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import { get } from "lodash";
import { toast } from 'react-toastify';
import * as tlUtils from "trustlines-clientlib/lib-esm/utils";

import Button from "./Button";

import {
  useMintProofEventListener
} from "../hooks/useProofEventListener";
import store from "../store";

import * as tlLib from "../apis/tlLib";
import * as nightlines from "../apis/nightlines";
import * as localforage from "../apis/localforage";

export default function Mint() {
  const [mintValue, setMintValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    selectedNetwork,
    loadedUser,
    fetchOverview,
    fetchCommitments,
    addMintProofKey,
  } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");
  const username = get(loadedUser, "username");
  const zkpPublicKey = get(loadedUser, "zkpKeyPair.zkpPublicKey");

  const handleClick = async () => {
    try {
      setLoading(true);
      const { decimals } = await tlLib.getShieldedNetwork(shieldAddress);
      const mintValueRaw = tlUtils.calcRaw(mintValue, decimals).toString();
      const randomSalt = await nightlines.getRandomSalt();
      const mintProofOrKey = await nightlines.getMintProof(
        shieldAddress,
        mintValueRaw,
        zkpPublicKey,
        randomSalt
      );

      if (typeof mintProofOrKey === "string") {
        addMintProofKey(mintProofOrKey)
      }

      if (typeof mintProofOrKey === "object") {
        handleMintProof(mintProofOrKey)
      }
    } catch (error) {
      console.log(error);
      toast(error.toString(), { type: "error" });
      setLoading(false);
    }
  }

  const handleMintProof = async mintProof => {
    try {      
      toast(`Mint proof generated`, { type: "info" });
      console.log({ mintProof })
      const { decimals } = await tlLib.getShieldedNetwork(shieldAddress);
  
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
          salt: mintProof.salt,
          amount: {
            value: mintValue,
            raw: mintProof.amount,
            decimals
          },
          type: "mint",
          status: localforage.COMMITMENT_STATUS.UNSPENT,
          gasUsed: mintCommitment.gasUsed
        }
      );
      console.log("stored mint note", storedCommitment);
      toast("Successfully minted note", { type: "success" });
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

  useMintProofEventListener(handleMintProof)

  return (
    <Flex mt={3} justifyContent={"space-between"}>
      <Box>
        <Text>{iouAbbreviation} Mint Value</Text>
        <Input
          disabled={loading}
          width={315}
          type={"number"}
          step={1}
          min={0}
          value={mintValue}
          onChange={event => setMintValue(event.target.value)}
        />
      </Box>
      <Box alignSelf={"end"}>
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
