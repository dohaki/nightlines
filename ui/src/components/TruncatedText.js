import React from "react";
import { Text } from "rebass";

export default function TruncatedText(props) {
  return (
    <Text
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        textDecoration: props.lineThrough && "line-through",
        opacity: props.disabled && 0.5
      }}
      {...props}
    />
  );
}
