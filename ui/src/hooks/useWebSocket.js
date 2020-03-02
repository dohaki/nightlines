import { useState } from 'react';

export default function useWebSocket() {
  const [webSocket, setWebSocket] = useState();

  function createWebSocket() {
    const ws = new WebSocket("http://localhost:3002");
    setWebSocket(ws);
  }

  function closeWebSocket() {
    if (webSocket) {
      webSocket.close();
      setWebSocket();
    }
  }

  return { webSocket, createWebSocket, closeWebSocket };
}

ws