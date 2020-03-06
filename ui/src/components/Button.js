import React from 'react';
import { Button as RebassButton  } from "rebass";

import LoadingSpinner from "./LoadingSpinner";

export default function Button({ loading = false, ...props }) {
  return (
    <RebassButton sx={{
      ":hover": loading
        ? {}
        : {
            bg: "secondary",
            cursor: "pointer"
          },
      filter: loading
        ? "grayscale(50%)"
        : "grayscale(0%)"
    }} {...props}>
      {loading ? (
        <LoadingSpinner />
      ) : props.children}
    </RebassButton>
  )
}
