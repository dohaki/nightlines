import React from 'react';
import { Flex } from "rebass";

import TruncatedText from "./TruncatedText";
import CopiableText from "./CopiableText";

import store from "../store";

export default function Commitment({ commitment, key }) {
  const { webSocket } = store.useContainer();

  return (
    <Flex
      key={key}
      justifyContent={"space-between"}
      onClick={() => {
        if (commitment.status === 'sent') {
          webSocket.send(JSON.stringify(commitment))
        }
      }}
    >
      <TruncatedText
        width={128}
        lineThrough={commitment.status === 'spent'}
        disabled={commitment.status === 'pending'}
      >
        <CopiableText id={`unspent-commitment-${key}`}>
          {commitment.commitment}
        </CopiableText>
      </TruncatedText>
      <TruncatedText
        width={128}
        color={"primary"}
        lineThrough={commitment.status === 'spent'}
        disabled={commitment.status === 'pending'}
      >
        {commitment.salt}
      </TruncatedText>
      <TruncatedText
        width={64}
        textAlign={"center"}
        lineThrough={commitment.status === 'spent'}
        disabled={commitment.status === 'pending'}
      >
        {commitment.commitmentIndex}
      </TruncatedText>
      <TruncatedText
        width={64}
        textAlign={"center"}
        lineThrough={commitment.status === 'spent'}
        disabled={commitment.status === 'pending'}
      >
        {commitment.type}
      </TruncatedText>
      <TruncatedText
        width={64}
        textAlign={"center"}
        color={commitment.type === "transfer" && "primary"}
        lineThrough={commitment.status === 'spent'}
        disabled={commitment.status === 'pending'}
      >
        {commitment.amount.value}
      </TruncatedText>
    </Flex>
  )
}