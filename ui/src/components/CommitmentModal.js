import React from 'react'
import { Flex, Text } from "rebass";
import { PieChart, Pie, Legend, Cell } from 'recharts';

import Modal from "./Modal"
import TruncatedText from "./TruncatedText"
import CopiableText from "./CopiableText"
import Button from "./Button"

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
  return commitment ? (
    <Modal {...props}>
      <Text textAlign={"center"} fontWeight={"bold"} m={2}>
        NOTE
      </Text>
      <CommitmentRow
        title={"Shield"}
        content={commitment.shieldAddress}
      />
      <CommitmentRow
        title={"Commitment"}
        content={commitment.commitment}
      />
      <CommitmentRow
        title={"ZKP PK Owner"}
        content={commitment.zkpPublicKey}
      />
      <CommitmentRow
        title={"Salt"}
        content={commitment.salt}
      />
      <CommitmentRow
        title={"Amount"}
        content={commitment.amount.value}
      />
      <CommitmentRow
        title={"Index"}
        content={commitment.commitmentIndex}
      />
      <CommitmentRow
        title={"Type"}
        content={commitment.type}
      />
      <CommitmentRow
        title={"Status"}
        content={commitment.status}
      />
      <GasUsage gasUsed={commitment.gasUsed} />
      <Flex justifyContent="center" my={3}>
        <Button
          // loading={loading}
          onClick={() => console.log("burn")}
          minWidth={150}
        >
          Burn
        </Button>
      </Flex>
    </Modal>
  ) : null
}