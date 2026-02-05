const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let players = {};
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
});

socket.on("currentPlayers", (serverPlayers) => {
  players = serverPlayers;
});

socket.on("newPlayer", (data) => {
  players[data.id] = data.player;
});

socket.on("updatePlayers", (serverPlayers) => {
  players = serverPlayers;
});

document.addEventListener("keydown", (e) => {
  if (!players[myId]) return;

  let p = players[myId];

  if (e.key === "ArrowUp") p.y -= 5;
  if (e.key === "ArrowDown") p.y += 5;
  if (e.key === "ArrowLeft") p.x -= 5;
  if (e.key === "ArrowRight") p.x += 5;

  socket.emit("move", p);
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = id === myId ? "lime" : "red";
    ctx.fillRect(p.x, p.y, 30, 30);
  }

  requestAnimationFrame(draw);
}

draw();
