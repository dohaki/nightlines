import React, { useEffect, useState } from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";
import { Label, Radio } from '@rebass/forms'

import DashboardCard from "./DashboardCard";
import Commitment from "./Commitment";

import * as localforage from "../apis/localforage";

import store from "../store";

export default function CommitmentsCard() {
  const [filter, setFilter] = useState("own")
  const {
    commitments,
    fetchCommitments,
    loadedUser,
    selectedNetwork,
    webSocket
  } = store.useContainer();

  const username = get(loadedUser, "username");
  const zkpPublicKey = get(loadedUser, "zkpKeyPair.zkpPublicKey");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");

  useEffect(() => {
    if (username) {
      fetchCommitments(username);
    }
    // eslint-disable-next-line
  }, [username]);

  useEffect(() => {
    function handleReceiveTransfer(event) {
      const data = JSON.parse(event.data)
      if (
        data.type === "transfer" &&
        data.zkpPublicKey === zkpPublicKey
      ) {
        localforage.setCommitment(
          username,
          {
            ...data,
            status: 'unspent'
          }
        )
        fetchCommitments(username)
      }
    }
    webSocket.addEventListener("message", handleReceiveTransfer)
    return () => webSocket.removeEventListener("message", handleReceiveTransfer)
  }, [webSocket, zkpPublicKey, username, fetchCommitments])

  const { unspentCommitments, spentCommitments, sentCommitments } = commitments.reduce((filteredCommitments, commitment) => {
    if (commitment.status === "spent" || commitment.status === "pending") {
      filteredCommitments.spentCommitments.push(commitment);
    } else if (commitment.status === "unspent") {
      filteredCommitments.unspentCommitments.push(commitment);
    } else if (commitment.status === "sent") {
      filteredCommitments.sentCommitments.push(commitment);
    }
    return filteredCommitments;
  }, {
    unspentCommitments: [],
    spentCommitments: [],
    sentCommitments: []
  });

  const spendable = unspentCommitments.reduce((acc, commitment) => {
    return acc + Number(get(commitment, "amount.value", 0))
  }, 0);

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        NOTES
      </Text>
      <Flex
        justifyContent={"space-between"}
        color={"primary"}
        mb={3}
      >
        <Text>{iouAbbreviation} Spendable:</Text>
        <Text fontWeight={"bold"}>
          {spendable}
        </Text>
      </Flex>
      <Flex mb={3}>
        <Label>
          <Radio
            name='filter'
            id='own'
            value='own'
            checked={filter === 'own'}
            onChange={() => setFilter('own')}
          />
          Own notes
        </Label>
        <Label>
          <Radio
            name='filter'
            id='sent'
            value='sent'
            checked={filter === 'sent'}
            onChange={() => setFilter('sent')}
          />
          Sent notes
        </Label>
      </Flex>
      <Flex justifyContent={"space-between"}>
        <Text width={128} fontWeight={"bold"}>
          Commitment
        </Text>
        <Text width={128} fontWeight={"bold"}>
          Salt
        </Text>
        <Text width={64} textAlign={"center"} fontWeight={"bold"}>
          Index
        </Text>
        <Text width={64} textAlign={"center"} fontWeight={"bold"}>
          Type
        </Text>
        <Text width={64} textAlign={"center"} fontWeight={"bold"}>
          Amount
        </Text>
      </Flex>
      {filter === "own" ? (
        <>
          {unspentCommitments.map((commitment, i) => (
            <Commitment commitment={commitment} key={i} />
          ))}
          <Flex />
          {spentCommitments.map((commitment, i) => (
            <Commitment commitment={commitment} key={i} />
          ))}
        </>
      ) : (
        sentCommitments.map((commitment, i) => (
          <Commitment commitment={commitment} key={i} />
        ))
      )}
    </DashboardCard>
  )
};
