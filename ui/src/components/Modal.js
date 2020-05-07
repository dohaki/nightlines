import React from "react";
import { Box } from "rebass";

export default function Modal(props) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.6)"
      }}
      onClick={props.onClose}
    >
      <Box
        sx={{
          position: "fixed",
          width: "540px",
          height: "auto",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          backgroundColor: "background",
          boxShadow: "dashboardCard",
          padding: 3
        }}
        {...props}
        onClick={e => e.stopPropagation()}
      />
    </Box>
  );
}
