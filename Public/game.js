const socket = io();

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

let players = {};

socket.on("currentPlayers", (serverPlayers) => {
  players = serverPlayers;
});

socket.on("newPlayer", (player) => {
  players[player.id] = { x: 100, y: 100 };
});

socket.on("playerMoved", (data) => {
  if (players[data.id]) {
    players[data.id].x = data.x;
    players[data.id].y = data.y;
  }
});

socket.on("playerDisconnected", (id) => {
  delete players[id];
});

function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const p = players[id];
    ctx.fillStyle = id === socket.id ? "blue" : "red";
    ctx.fillRect(p.x, p.y, 40, 40);
  }

  requestAnimationFrame(drawPlayers);
}

drawPlayers();

document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  socket.emit("move", { x: touch.clientX, y: touch.clientY });
});

document.addEventListener("mousemove", (e) => {
  socket.emit("move", { x: e.clientX, y: e.clientY });
});
