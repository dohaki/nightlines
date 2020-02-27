import React, { useEffect } from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
import Commitment from "./Commitment";

import store from "../store";

export default function CommitmentsCard() {
  const {
    commitments,
    fetchCommitments,
    loadedUser,
    selectedNetwork
  } = store.useContainer();

  const username = get(loadedUser, "username");
  const iouAbbreviation = get(selectedNetwork, "abbreviation");

  useEffect(() => {
    if (username) {
      fetchCommitments(username);
    }
    // eslint-disable-next-line
  }, [username]);

  const { unspentCommitments, spentCommitments, sentCommitments } = commitments.reduce((filteredCommitments, commitment) => {
    if (commitment.status === "spent") {
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

  console.log({ unspentCommitments, spentCommitments, sentCommitments })

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
        <Text>
          {spendable}
        </Text>
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
      {unspentCommitments.map((commitment, i) => (
        <Commitment commitment={commitment} key={i} />
      ))}
      <Flex />
      {spentCommitments.map((commitment, i) => (
        <Commitment commitment={commitment} key={i} />
      ))}
      <Flex />
      {sentCommitments.map((commitment, i) => (
        <Commitment commitment={commitment} key={i} />
      ))}
    </DashboardCard>
  )
};
