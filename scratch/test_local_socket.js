const { io } = require("socket.io-client");
const socket = io("http://localhost:3001", {
  transports: ["websocket", "polling"],
  timeout: 3000
});

console.log("Connecting to Local socket on 3001...");

socket.on("connect", () => {
  console.log("Connected successfully to localhost:3001!");
  socket.disconnect();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connection error to localhost:3001:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log("Timeout waiting for localhost:3001");
  process.exit(1);
}, 4000);
