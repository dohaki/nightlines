import React from 'react';
import { Card } from "rebass";

export default function DashboardCard(props) {
  return (
    <Card
      m={4}
      p={3}
      sx={{
        maxWidth: 512,
        boxShadow: 'dashboardCard'
      }}
      {...props}
    />
  )
};
