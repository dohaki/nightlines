import React from 'react';
import { Text  } from "rebass";

import { copyToClipboard } from "../utils";

export default function CopiableText(props) {
  return (
    <Text
      onClick={() => {
        copyToClipboard(props.id);
      }}
      sx={{
      ":hover": {
        color: "secondary",
        cursor: "pointer"
      },
    }} {...props} />
  )
}
