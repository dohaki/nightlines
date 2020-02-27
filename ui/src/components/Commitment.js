import React from 'react';
import { Flex } from "rebass";

import TruncatedText from "./TruncatedText";
import CopiableText from "./CopiableText";

export default function Commitment({ commitment, key }) {
  return (
    <Flex key={key} justifyContent={"space-between"}>
      <TruncatedText
        width={128}
        lineThrough={commitment.spent}
      >
        <CopiableText id={`unspent-commitment-${key}`}>
          {commitment.commitment}
        </CopiableText>
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
  )
}