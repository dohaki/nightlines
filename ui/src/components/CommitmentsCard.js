import React, { useEffect } from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
import CopiableText from "./CopiableText";
import TruncatedText from "./TruncatedText";

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
  }, [username]);

  const { unspentCommitments, spentCommitments } = commitments.reduce((filteredCommitments, commitment) => {
    if (commitment.spent) {
      filteredCommitments.spentCommitments.push(commitment);
    } else {
      filteredCommitments.unspentCommitments.push(commitment);
    }
    return filteredCommitments;
  }, {
    unspentCommitments: [],
    spentCommitments: []
  });

  const spendable = unspentCommitments.reduce((acc, commitment) => {
    return acc + Number(get(commitment, "amount.value", 0))
  }, 0);

  console.log({ unspentCommitments, spentCommitments })

  return (
    <DashboardCard>
      <Text textAlign={"center"} fontWeight={"bold"} mb={2}>
        COMMITMENTS
      </Text>
      <Flex
        justifyContent={"space-between"}
        color={"primary"}
        mb={3}
      >
        <Text>{iouAbbreviation} Spendable:</Text>
        <CopiableText id={"user-address"}>
          {spendable}
        </CopiableText>
      </Flex>
      <Flex>
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
      {commitments.map(commitment => (
        <Flex>
          <TruncatedText width={128} >
            {commitment.commitment}
          </TruncatedText>
          <TruncatedText width={128} color={"primary"}>
            {commitment.salt}
          </TruncatedText>
          <TruncatedText width={64} textAlign={"center"}>
            {commitment.commitmentIndex}
          </TruncatedText>
          <TruncatedText width={64} textAlign={"center"}>
            {commitment.type}
          </TruncatedText>
          <TruncatedText
            width={64}
            textAlign={"center"}
            color={commitment.type === "transfer" && "primary"}
          >
            {commitment.amount.value}
          </TruncatedText>
        </Flex>
      ))}
    </DashboardCard>
  )
};
