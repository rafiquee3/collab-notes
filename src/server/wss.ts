import { WebSocketServer } from "ws";
import http from "http";
// @ts-expect-error - y-websocket lacks proper ESM declarations for this internal file
import { setupWSConnection } from "y-websocket/bin/utils";

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

server.listen(port, () => {
  console.log(`Collaboration server is running on port: ${port}`);
});
