const WebSocket = require('ws');
const http = require('http');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const port = 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server is running');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
  console.log('New connection to room:', req.url);
});

server.listen(port, () => {
  console.log(`Collaboration server is running on port: ${port}`);
});
