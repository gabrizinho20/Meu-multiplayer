const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};
let bullets = [];

// ===== MULTIPLAYER =====
io.on("connection", (socket) => {
  console.log("Jogador entrou:", socket.id);

  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 500,
    y: Math.random() * 300,
    hp: 100,
    color: "#" + Math.floor(Math.random()*16777215).toString(16)
  };

  socket.emit("init", { players, bullets });
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("move", data => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
    }
  });

  socket.on("shoot", data => {
    bullets.push({
      x: data.x,
      y: data.y,
      dx: data.dx,
      dy: data.dy,
      owner: socket.id
    });
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("removePlayer", socket.id);
  });
});

// ===== GAME LOOP SERVER =====
setInterval(() => {
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;

    for (let id in players) {
      if (id !== b.owner) {
        let p = players[id];
        if (Math.abs(p.x - b.x) < 20 && Math.abs(p.y - b.y) < 20) {
          p.hp -= 10;
          bullets.splice(i, 1);
          if (p.hp <= 0) {
            io.emit("playerDied", id);
            players[id].hp = 100;
            players[id].x = Math.random()*500;
            players[id].y = Math.random()*300;
          }
        }
      }
    }
  });

  io.emit("update", { players, bullets });
}, 1000 / 30);

// ===== CLIENTE HTML =====
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Battle Mobile</title>
<style>
body { margin:0; overflow:hidden; background:#111; }
canvas { background:#222; display:block; margin:auto; }
.controls { position:fixed; bottom:20px; left:20px; }
.btn { width:60px; height:60px; margin:5px; font-size:22px; border-radius:50%; border:none; }
.shoot { position:fixed; bottom:40px; right:30px; width:70px; height:70px; background:red; color:white; border:none; border-radius:50%; font-size:18px; }
</style>
</head>
<body>
<canvas id="game" width="800" height="600"></canvas>

<div class="controls">
  <div><button class="btn" id="up">⬆️</button></div>
  <div>
    <button class="btn" id="left">⬅️</button>
    <button class="btn" id="down">⬇️</button>
    <button class="btn" id="right">➡️</button>
  </div>
</div>

<button class="shoot" id="shoot">FIRE</button>

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let players = {};
let bullets = {};
let me = { x: 100, y: 100 };

function move(dx, dy){
  me.x += dx;
  me.y += dy;
  socket.emit("move", me);
}

document.getElementById("up").ontouchstart = () => move(0,-10);
document.getElementById("down").ontouchstart = () => move(0,10);
document.getElementById("left").ontouchstart = () => move(-10,0);
document.getElementById("right").ontouchstart = () => move(10,0);

document.getElementById("shoot").ontouchstart = () => {
  socket.emit("shoot", { x: me.x, y: me.y, dx: 8, dy: 0 });
};

socket.on("init", data => {
  players = data.players;
  bullets = data.bullets;
});

socket.on("newPlayer", p => players[p.id] = p);
socket.on("removePlayer", id => delete players[id]);
socket.on("playerDied", id => console.log("Player morreu:", id));

socket.on("update", data => {
  players = data.players;
  bullets = data.bullets;
});

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let id in players){
    let p = players[id];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 30, 30);

    ctx.fillStyle="red";
    ctx.fillRect(p.x, p.y-10, p.hp/2, 5);
  }

  bullets.forEach(b=>{
    ctx.fillStyle="yellow";
    ctx.fillRect(b.x, b.y, 6, 6);
  });

  requestAnimationFrame(draw);
}
draw();
</script>
</body>
</html>
`);
});

server.listen(3000, () => console.log("🔥 Servidor Battle Mobile rodando!"));
