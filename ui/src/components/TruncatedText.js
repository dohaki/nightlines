import React from 'react';
import { Text  } from "rebass";


export default function TruncatedText(props) {
  return (
    <Text
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
      }} {...props} />
  )
}
