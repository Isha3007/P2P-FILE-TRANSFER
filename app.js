const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// Serve HTML file
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading file");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url.endsWith(".js") || req.url.endsWith(".css")) {
    const filePath = path.join(__dirname, req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }
      const contentType = req.url.endsWith(".js") ? "application/javascript" : "text/css";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Attach WebSocket to the same server
const wss = new WebSocket.Server({ server });

let peers = {};

wss.on("connection", (ws) => {
  let peerId = null;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "register") {
      peerId = data.id;
      peers[peerId] = ws;
      console.log(`✅ Peer registered: ${peerId}`);
      sendPeerList();
    } else if (data.type === "offer" || data.type === "answer" || data.type === "candidate") {
      if (peers[data.to]) {
        peers[data.to].send(JSON.stringify(data));
      } else {
        console.log(`❌ Peer ${data.to} not found.`);
      }
    }
  });

  ws.on("close", () => {
    if (peerId) {
      delete peers[peerId];
      sendPeerList();
    }
  });

  function sendPeerList() {
    const peerList = Object.keys(peers);
    for (let id in peers) {
      peers[id].send(JSON.stringify({ type: "peers", peers: peerList }));
    }
  }
});

// Start server on port 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
