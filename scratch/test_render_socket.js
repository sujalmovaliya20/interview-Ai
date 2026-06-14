const { io } = require("socket.io-client");
const socket = io("https://interview-ai-server.onrender.com", {
  transports: ["polling", "websocket"],
  timeout: 60000 // 60 seconds timeout
});

console.log("Connecting to Render socket via polling first with 60s timeout...");

socket.on("connect", () => {
  console.log("Connected successfully via polling with 60s timeout!");
  socket.disconnect();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log("Timeout waiting for connection");
  process.exit(1);
}, 65000);
