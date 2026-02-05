const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = {};

app.get("/", (req, res) => {
  res.send("Servidor multiplayer online 🚀");
});

io.on("connection", (socket) => {
  console.log("Jogador conectado:", socket.id);

  players[socket.id] = { x: 0, y: 2, z: 0, rot: 0 };

  socket.emit("players", players);

  socket.on("move", (data) => {
    players[socket.id] = data;
    socket.broadcast.emit("playerMoved", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
    console.log("Jogador saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
