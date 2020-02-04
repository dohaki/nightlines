import React from 'react';
import { Button as RebassButton  } from "rebass";

export default function Button(props) {
  return (
    <RebassButton sx={{
      ":hover": {
        bg: "secondary",
        cursor: "pointer"
      },
    }} {...props} />
  )
}
