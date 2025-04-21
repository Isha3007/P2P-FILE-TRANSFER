const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

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
            peers[id].send(JSON.stringify({ type: "peerList", peers: peerList }));
        }
    }
});

console.log("✅ WebSocket signaling server running on ws://localhost:8080");
