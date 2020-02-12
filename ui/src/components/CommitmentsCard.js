import React, { useEffect } from 'react';
import { Text, Flex } from "rebass";
import { get } from "lodash";

import DashboardCard from "./DashboardCard";
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
    // eslint-disable-next-line
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
      {commitments.map((commitment, i) => (
        <Flex key={i} justifyContent={"space-between"}>
          <TruncatedText
            width={128}
            lineThrough={commitment.spent}
          >
            {commitment.commitment}
          </TruncatedText>
          <TruncatedText
            width={128}
            color={"primary"}
            lineThrough={commitment.spent}
          >
            {commitment.salt}
          </TruncatedText>
          <TruncatedText
            width={64}
            textAlign={"center"}
            lineThrough={commitment.spent}
          >
            {commitment.commitmentIndex}
          </TruncatedText>
          <TruncatedText
            width={64}
            textAlign={"center"}
            lineThrough={commitment.spent}
          >
            {commitment.type}
          </TruncatedText>
          <TruncatedText
            width={64}
            textAlign={"center"}
            color={commitment.type === "transfer" && "primary"}
            lineThrough={commitment.spent}
          >
            {commitment.amount.value}
          </TruncatedText>
        </Flex>
      ))}
    </DashboardCard>
  )
};
