import { WebSocketServer } from "ws";
import http from "http";
const { setupWSConnection } = require("y-websocket/bin/utils");

// Railway automatycznie poda port w process.env.PORT
const port = process.env.PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Yjs WebSocket Server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req);
  console.log("New connection to room:", req.url);
});

// Ważne: Słuchamy na 0.0.0.0, aby serwer był widoczny z zewnątrz
server.listen(port, "0.0.0.0", () => {
  console.log(`Collaboration server is running on port: ${port}`);
});
