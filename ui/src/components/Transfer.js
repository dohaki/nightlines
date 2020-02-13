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

const getJoinSplitInputs = (commitments, valueRaw) => {
  for (const [i, commitment] of commitments.entries()) {
    const delta = Number(valueRaw) - Number(commitment.amount.raw);

    const secondInput = commitments
      .slice(i + 1, commitments.length)
      .find(({ amount }) => Number(amount.raw) >= delta);

    if (secondInput) {
      return [commitment, secondInput];
    }
  }
  return [];
}

export default function Transfer() {
  const [receiverPK, setReceiverPK] = useState("");
  const [transferValue, setTransferValue] = useState(0);
  const [isVKRegistered, setVKRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    selectedNetwork,
    loadedUser,
    fetchOverview,
    fetchCommitments,
    commitments
  } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const iouAddress = get(selectedNetwork, "address");
  const userAddress = get(loadedUser, "walletData.address");
  const username = get(loadedUser, "username");

  useEffect(() => {
    async function getRegisteredTransferVK() {
      const registeredTransferVK = await tlLib.getRegisteredVK(
        shieldAddress,
        "transfer"
      );
      setVKRegistered(registeredTransferVK.length > 0);
    }

    if (shieldAddress) {
      getRegisteredTransferVK();
    }
  }, [shieldAddress, setVKRegistered]);

  const handleClick = async () => {
    try {
      setLoading(true);
      const { decimals } = await tlLib.getShieldedNetwork(shieldAddress);
      const transferValueRaw = tlUtils.calcRaw(transferValue, decimals).toString();

      const joinSplitInputs = getJoinSplitInputs(commitments, transferValueRaw);

      console.log({ joinSplitInputs });

      if (joinSplitInputs.length === 0) {
        throw new Error("Insufficient commitment minted");
      }
      // const randomSalt = await nightlines.getRandomSalt();
      // const mintProof = await nightlines.getMintProof(
      //   transferValueRaw,
      //   get(loadedUser, "zkpKeyPair.zkpPublicKey"),
      //   randomSalt
      // );
      // toast(`Proof generated for commitment: ${mintProof.commitment}`, { type: "info" });
      // console.log(mintProof)

      // const mintCommitment = await tlLib.mintCommitment(
      //   shieldAddress,
      //   mintProof.proof,
      //   mintProof.publicInputs,
      //   mintValue,
      //   mintProof.commitment
      // );

      // const storedCommitment = await localforage.setCommitment(
      //   username,
      //   {
      //     shieldAddress,
      //     commitmentIndex: mintCommitment.commitmentIndex,
      //     commitment: mintProof.commitment,
      //     salt: randomSalt,
      //     amount: {
      //       value: mintValue,
      //       raw: transferValueRaw,
      //       decimals
      //     },
      //     type: "mint",
      //     gasUsed: mintCommitment.gasUsed
      //   }
      // );
      // console.log("Stored commitment: ", storedCommitment);
      // toast("Successfully minted commitment", { type: "success" });
      // fetchOverview(iouAddress, userAddress);
      // fetchCommitments(username);
      setTransferValue(0);
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
        "transfer"
      );
      toast(`Transfer VK successfully registered`, { type: "success" });
      setVKRegistered(true);
    }
  }

  return (
    <Box mt={4}>
      <Text color={"primary"}>ZKP PubKey Receiver</Text>
      <Input
        color={"primary"}
        width={474}
        value={receiverPK}
        onChange={event => setReceiverPK(event.target.value)}
      />
      <Flex mt={1} justifyContent={"space-between"}>
        <Box>
          <Text color={"primary"}>
            {iouAbbreviation} Transfer Value
          </Text>
          <Input
            color={"primary"}
            width={315}
            type={"number"}
            step={1}
            min={0}
            value={transferValue}
            onChange={event => setTransferValue(event.target.value)}
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
              "Transferring"
            ) : "Transfer"}
          </Button>
        </Box>
      </Flex>
    </Box>
  )
};
