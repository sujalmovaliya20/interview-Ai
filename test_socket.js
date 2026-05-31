const { io } = require("socket.io-client");
const socket = io("http://localhost:3001", { transports: ["websocket"] });

// We need a valid session id to join. Let's pass it as a CLI arg.
const sessionId = process.argv[2];

socket.on("connect", () => {
  console.log("Connected to socket");
  if (sessionId) {
    console.log("Joining session", sessionId);
    socket.emit("join_session", { sessionId });
  }
});

socket.on("session_joined", () => {
  console.log("Session joined! Sending chunk...");
  socket.emit("audio_chunk", Buffer.alloc(1024)); // Mock 1KB chunk
});

socket.on("transcript_delta", (payload) => {
  console.log("Received transcript:", payload);
  process.exit(0);
});

socket.on("session_error", (err) => {
  console.error("Session error:", err);
  process.exit(1);
});

socket.on("connect_error", (err) => {
  console.error("Connect error:", err);
  process.exit(1);
});
