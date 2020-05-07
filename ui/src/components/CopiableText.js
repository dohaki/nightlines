import React from "react";
import { Text } from "rebass";

import { copyToClipboard } from "../utils";

export default function CopiableText(props) {
  return (
    <Text
      onClick={() => {
        copyToClipboard(props.id);
      }}
      maxWidth={340}
      sx={{
        ":hover": {
          color: "secondary",
          cursor: "pointer"
        },
        overflow: "hidden",
        textOverflow: "ellipsis"
      }}
      {...props}
    />
  );
}
