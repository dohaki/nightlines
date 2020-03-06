import chalk from "chalk";
import WebSocket from "ws";

function log(msg) {
  console.log(`${chalk.blue("WS")} ${msg}`);
}

export async function initWebSocketServer(wss) {
  wss.on("connection", ws => {
    log("Client connected");

    ws.on("close", () => {
      log("Client disconnected");
    });

    ws.on("message", data => {
      log("Message");
      broadcastMessage(wss, data);
    });
  });
}

export async function broadcastMessage(wss, data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      if (typeof data === "string") {
        client.send(data);
      } else {
        client.send(JSON.stringify(data));
      }
    }
  });
}
