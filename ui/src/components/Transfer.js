import React, { useState, useEffect, useRef } from 'react';
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
  const unspentCommitments = commitments.filter(({ status }) => status === "unspent");
  for (const [i, commitment] of unspentCommitments.entries()) {
    const delta = Number(valueRaw) - Number(commitment.amount.raw);

    const secondInput = unspentCommitments
      .slice(i + 1, unspentCommitments.length)
      .find(({ amount }) => Number(amount.raw) >= delta);

    if (secondInput) {
      return [commitment, secondInput];
    }
  }
  return [];
}

const getJoinSplitOutputs = async (inputCommitments, transferValueRaw, decimals) => {
  const salts = await Promise.all([
    nightlines.getRandomSalt(),
    nightlines.getRandomSalt()
  ]);
  const totalInputValuesRaw = Number(inputCommitments[0].amount.raw) + Number(inputCommitments[1].amount.raw);

  return [
    {
      salt: salts[0],
      amount: tlUtils.formatToAmount(transferValueRaw, decimals)
    },
    {
      salt: salts[1],
      amount: tlUtils.formatToAmount(
        totalInputValuesRaw - Number(transferValueRaw),
        decimals
      )
    }
  ]
}

export default function Transfer() {
  const [receiverPK, setReceiverPK] = useState("");
  const [transferValue, setTransferValue] = useState(0);
  const [isVKRegistered, setVKRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    selectedNetwork,
    loadedUser,
    fetchCommitments,
    commitments,
    webSocket
  } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");
  const username = get(loadedUser, "username");
  const zkpPublicKey = get(loadedUser, "zkpKeyPair.zkpPublicKey");
  const zkpPrivateKey = get(loadedUser, "zkpKeyPair.zkpPrivateKey");

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

      if (joinSplitInputs.length === 0) {
        throw new Error("Insufficient commitments minted");
      }

      // set status of used input commitments to PENDING
      await Promise.all(
        joinSplitInputs.map(input =>
          localforage.setCommitmentStatus(
            username,
            input.commitment,
            localforage.COMMITMENT_STATUS.PENDING
          )
        )
      )

      const joinSplitOutputs = await getJoinSplitOutputs(
        joinSplitInputs,
        transferValueRaw,
        decimals
      );

      const transferProofOrKey = await nightlines.getTransferProof(
        shieldAddress,
        joinSplitInputs,
        joinSplitOutputs,
        receiverPK,
        zkpPrivateKey
      );
      
      if (typeof transferProofOrKey === "string") {
        webSocket.addEventListener("message", event => {
          const { data } = event;
          const dataJson = JSON.parse(data);
          if (dataJson.proofKey === transferProofOrKey && dataJson.proof) {
            sendTransferProof(dataJson.proof);
          }
        })
      } else {
        sendTransferProof(transferProofOrKey);
      }
    } catch (error) {
      console.error(error);
      toast(error.toString(), { type: "error" });
    }
  }

  const sendTransferProof = async proof => {
    const { noteE, noteF } = await tlLib.transferCommitment(
      shieldAddress,
      proof.proof,
      proof.publicInputs,
      proof.root,
      proof.inputCommitments[0].nullifier,
      proof.inputCommitments[1].nullifier,
      proof.outputCommitments[0].commitment,
      proof.outputCommitments[1].commitment,
    );
    await Promise.all([
      localforage.setCommitmentStatus(
        username,
        proof.inputCommitments[0].commitment,
        "spent"
      ),
      localforage.setCommitmentStatus(
        username,
        proof.inputCommitments[1].commitment,
        "spent"
      ),
      // commitment E
      localforage.setCommitment(
        username,
        {
          shieldAddress,
          zkpPublicKey: receiverPK,
          commitment: noteE.commitment,
          commitmentIndex: noteE.commitmentIndex,
          salt: proof.outputCommitments[0].salt,
          amount: proof.outputCommitments[0].amount,
          type: "transfer",
          gasUsed: noteE.gasUsed,
          status: "sent",
        }
      ),
      // commitment F
      localforage.setCommitment(
        username,
        {
          shieldAddress,
          zkpPublicKey,
          commitment: noteF.commitment,
          commitmentIndex: noteF.commitmentIndex,
          salt: proof.outputCommitments[1].salt,
          amount: proof.outputCommitments[1].amount,
          type: "transfer",
          gasUsed: noteF.gasUsed,
          status: "unspent",
        }
      )
    ]);
    fetchCommitments(username);
    setReceiverPK("");
    setTransferValue(0);
    setLoading(false);
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
            loading={loading}
            onClick={handleClick}
            minWidth={150}
          >
            Transfer
          </Button>
        </Box>
      </Flex>
    </Box>
  )
};
