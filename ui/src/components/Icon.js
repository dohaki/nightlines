import React from 'react';
import { Box } from "rebass";
import * as FeatherIcons from "react-icons/fi";

export default function Icon(props) {
  return (
    <Box sx={{ color: props.color || "text" }}>
      {FeatherIcons[props.name]}
    </Box>
  )
}
