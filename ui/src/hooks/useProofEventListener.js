import { useEffect } from 'react';

import store from "../store";
import useEventListener from "./useEventListener";

export function useMintProofEventListener(proofHandler) {
  const {
    webSocket,
    mintProofKeys,
    removeMintProofKey
  } = store.useContainer()

  console.log({ mintProofKeys })

  const { addListener, destroyListener } = useEventListener(
    "message",
    webSocket
  )

  useEffect(() => {
    if (destroyListener) {
      destroyListener()
    }
  
    addListener(event => {
      const data = JSON.parse(event.data)
      if (mintProofKeys.includes(data.proofKey)) {
        removeMintProofKey(data.proofKey)
        proofHandler(data.proof)
      }
    })
  }, [proofHandler, mintProofKeys]);
}

export function useBurnProofEventListener(proofHandler) {
  const {
    webSocket,
    burnProofKeys,
    removeBurnProofKey
  } = store.useContainer()

  const { addListener, destroyListener } = useEventListener(
    "message",
    webSocket
  )

  useEffect(() => {
    if (destroyListener) {
      destroyListener()
    }
  
    addListener(event => {
      const data = JSON.parse(event.data)
      if (burnProofKeys.includes(data.proofKey)) {
        removeBurnProofKey(data.proofKey)
        proofHandler(data.proof)
      }
    })
  }, [proofHandler, burnProofKeys]);
}


export function useTransferProofEventListener(proofHandler) {
  const {
    webSocket,
    transferProofKeys,
    removeTransferProofKey
  } = store.useContainer()

  const { addListener, destroyListener } = useEventListener(
    "message",
    webSocket
  )

  useEffect(() => {
    if (destroyListener) {
      destroyListener()
    }
  
    addListener(event => {
      const data = JSON.parse(event.data)
      if (transferProofKeys.includes(data.proofKey)) {
        removeTransferProofKey(data.proofKey)
        proofHandler(data.proof)
      }
    })
  }, [proofHandler, transferProofKeys]);
}


