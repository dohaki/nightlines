import { useState } from "react";

import * as localforage from "../apis/localforage";

export default function useCommitments() {
  const [commitments, setCommitments] = useState([]);

  async function fetchCommitments(username) {
    const commitments = await localforage.getCommitmentsByUsername(username);
    setCommitments(commitments);
  }

  return { commitments, fetchCommitments };
}
