import React from 'react'
import { Box, Flex, Text } from "rebass";
import { PieChart, Pie, Legend, Cell } from 'recharts';

import Modal from "./Modal"
import TruncatedText from "./TruncatedText"
import CopiableText from "./CopiableText"
import Burn from "./Burn"

import store from "../store";

import { COMMITMENT_STATUS } from '../apis/localforage'

function CommitmentRow({ title, content }) {
  return (
    <Flex
      dir="row"
      justifyContent="space-between"
      paddingY={2}
    >
      <div>{title}:</div>
      <TruncatedText>
        <CopiableText id={`commitment-modal-${title}`}>
          {content}
        </CopiableText>
      </TruncatedText>
    </Flex>
  )
}

function GasUsage({ gasUsed }) {
  const {
    byVerifierContract,
    byShieldContract,
    byCurrencyNetworkContract
  } = gasUsed

  const total = Number(byVerifierContract) +
    Number(byShieldContract) +
    Number(byCurrencyNetworkContract)
  
  const pieChartData = [
    {
      name: "Verifier",
      value: Number(byVerifierContract)
    },
    {
      name: "Shield",
      value: Number(byShieldContract)
    },
    {
      name: "CurrencyNetwork",
      value: Number(byCurrencyNetworkContract)
    }
  ]

  const colors = [
    "#bb99ff",
    'hsl(290, 100%, 80%)',
    'hsl(260, 20%, 40%)',
  ]

  return (
    <>
      <CommitmentRow title={"Total gas"} content={total} />
      <PieChart width={500} height={175}>
        <Pie
          dataKey="value"
          startAngle={180}
          endAngle={0}
          data={pieChartData}
          cy={120}
          outerRadius={80}
          fill="#bb99ff"
          stroke="#222639"
          label
          paddingAngle={1}
        >
          {
            pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))
          }
        </Pie>
        <Legend verticalAlign="bottom" />
      </PieChart>
    </>
  )
}

export default function CommitmentModal({ commitment, ...props }) {
  const {
    commitments: notes
  } = store.useContainer();

  const note = notes.find(n => n.commitment === commitment)

  return note ? (
    <Modal {...props}>
      <Text textAlign={"center"} fontWeight={"bold"} m={2}>
        NOTE
      </Text>
      <CommitmentRow
        title={"Shield"}
        content={note.shieldAddress}
      />
      <CommitmentRow
        title={"Commitment"}
        content={note.commitment}
      />
      <CommitmentRow
        title={"ZKP PK Owner"}
        content={note.zkpPublicKey}
      />
      <CommitmentRow
        title={"Salt"}
        content={note.salt}
      />
      <CommitmentRow
        title={"Amount"}
        content={note.amount.value}
      />
      <CommitmentRow
        title={"Index"}
        content={note.commitmentIndex}
      />
      <CommitmentRow
        title={"Type"}
        content={note.type}
      />
      <CommitmentRow
        title={"Status"}
        content={note.status}
      />
      <GasUsage gasUsed={note.gasUsed} />
      {note.status === COMMITMENT_STATUS.UNSPENT ? (
        <Burn note={note} />
      ) : note.status === COMMITMENT_STATUS.SENT ? (
        <Box>SEND ON SECURE OFF</Box>
      ) : (
        <Box />
      )}
    </Modal>
  ) : null
}