import React from "react";
import { Box } from "rebass";

export default function Badge(props) {
  return (
    <Box
      sx={{
        display: "inline-block",
        color: "white",
        bg: "primary",
        px: 1,
        py: 1,
        borderRadius: 9999
      }}
      {...props}
    />
  );
}
