import React from 'react';
import { Box } from "rebass";

export default function Container(props) {
  return (
    <Box
      sx={{
        maxWidth: 512,
        mx: 'auto',
        p: 3,
        pt: 6,
      }}
      {...props}
    />
  )
}