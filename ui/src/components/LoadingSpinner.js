/** @jsx jsx */
import { css, keyframes, jsx } from "@emotion/core";
import { FiLoader } from "react-icons/fi";

const rotate = keyframes`
  0% {
    -webkit-transform: rotate(0);
            transform: rotate(0);
  }
  100% {
    -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
  }
`;

export default function LoadingSpinner(props) {
  return (
    <FiLoader
      css={css`
        animation: ${rotate} 1s linear infinite both;
      `}
      {...props}
    />
  );
}
