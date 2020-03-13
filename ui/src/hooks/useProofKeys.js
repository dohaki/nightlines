import { useState } from 'react';

function useProofKeys() {
  const [proofKeys, setProofKeys] = useState([]);

  function addProofKey(proofKey) {
    if (proofKeys.indexOf(proofKey) === -1) {
      setProofKeys([...proofKeys, proofKey]);
    }
  }

  function removeProofKey(proofKey) {
    setProofKeys(proofKeys.filter(key => key !== proofKey))
  }

  return { proofKeys, addProofKey, removeProofKey }
}

export function useBurnProofKeys() {
  const {
    proofKeys,
    addProofKey,
    removeProofKey
  } = useProofKeys()

  return {
    burnProofKeys: proofKeys,
    addBurnProofKey: addProofKey,
    removeBurnProofKey: removeProofKey
  }
}

export function useTransferProofKeys() {
  const {
    proofKeys,
    addProofKey,
    removeProofKey
  } = useProofKeys()

  return {
    transferProofKeys: proofKeys,
    addTransferProofKey: addProofKey,
    removeTransferProofKey: removeProofKey
  }
}

export function useMintProofKeys() {
  const {
    proofKeys,
    addProofKey,
    removeProofKey
  } = useProofKeys()

  return {
    mintProofKeys: proofKeys,
    addMintProofKey: addProofKey,
    removeMintProofKey: removeProofKey
  }
}
