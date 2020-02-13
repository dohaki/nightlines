import React from 'react';
import { Button as RebassButton  } from "rebass";

export default function Button(props) {
  return (
    <RebassButton sx={{
      ":hover": props.disabled
        ? {}
        : {
            bg: "secondary",
            cursor: "pointer"
          },
      filter: props.disabled
        ? "grayscale(50%)"
        : "grayscale(0%)"
    }} {...props} />
  )
}
