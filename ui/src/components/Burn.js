import React, { useState } from "react";
import { Flex } from "rebass";
import { get } from "lodash";
import { toast } from "react-toastify";

import Button from "./Button";

import { useBurnProofEventListener } from "../hooks/useProofEventListener";
import store from "../store";

import * as tlLib from "../apis/tlLib";
import * as nightlines from "../apis/nightlines";
import * as localforage from "../apis/localforage";

export default function Burn({ note }) {
  const [loading, setLoading] = useState(false);
  const {
    addBurnProofKey,
    selectedNetwork,
    loadedUser,
    fetchCommitments,
    fetchOverview
  } = store.useContainer();

  const shieldAddress = get(selectedNetwork, "shield.address");
  const iouAddress = get(selectedNetwork, "address");
  const zkpPrivateKey = get(loadedUser, "zkpKeyPair.zkpPrivateKey");
  const userAddress = get(loadedUser, "walletData.address");
  const username = get(loadedUser, "username");

  const handleClick = async () => {
    try {
      setLoading(true);
      const burnProofOrKey = await nightlines.getBurnProof(
        shieldAddress,
        userAddress,
        note,
        zkpPrivateKey
      );

      if (typeof burnProofOrKey === "string") {
        addBurnProofKey(burnProofOrKey);
      }

      if (typeof burnProofOrKey === "object") {
        handleBurnProof(burnProofOrKey);
      }
    } catch (error) {
      console.error(error);
      toast(error.toString(), { type: "error" });
      setLoading(false);
    }
  };

  const handleBurnProof = async burnProof => {
    try {
      toast(`Burn proof generated`, { type: "info" });
      console.log({ burnProof });

      const burnNote = await tlLib.burnCommitment(
        shieldAddress,
        burnProof.proof,
        burnProof.publicInputs,
        burnProof.root,
        burnProof.nullifier,
        note.amount.value,
        userAddress
      );

      const storedNote = await localforage.setCommitment(username, {
        ...note,
        ...burnNote
      });
      console.log("stored burn note: ", storedNote);
      toast("Successfully burned note", { type: "success" });
      fetchCommitments(username);
      fetchOverview(iouAddress, userAddress);
    } catch (error) {
      console.error(error);
      toast(error.toString(), { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useBurnProofEventListener(handleBurnProof);

  return (
    <Flex justifyContent="center" my={3}>
      <Button loading={loading} onClick={handleClick} minWidth={150}>
        Burn
      </Button>
    </Flex>
  );
}
