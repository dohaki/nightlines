import React from 'react';
import { Button as RebassButton  } from "rebass";

import LoadingSpinner from "./LoadingSpinner";

export default function Button(props) {
  return (
    <RebassButton sx={{
      ":hover": props.loading
        ? {}
        : {
            bg: "secondary",
            cursor: "pointer"
          },
      filter: props.loading
        ? "grayscale(50%)"
        : "grayscale(0%)"
    }} {...props}>
      {props.loading ? (
        <LoadingSpinner />
      ) : props.children}
    </RebassButton>
  )
}
