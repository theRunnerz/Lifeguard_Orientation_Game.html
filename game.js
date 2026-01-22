// ===============================
// Lifeguard Orientation Game
// game.js — v1.1.6
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const TILE = 32;
const VERSION = "v1.1.6";

// -------------------------------
// GAME STATE
// -------------------------------
let scene = "office";
let hasKey = false;

const player = {
  x: 9 * TILE,
  y: 8 * TILE,
  size: 18,
  speed: 2
};

// -------------------------------
// JOYSTICK
// -------------------------------
let joystick = {
  active: false,
  x: 0,
  y: 0,
  dx: 0,
  dy: 0
};

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  joystick.active = true;
  joystick.x = t.clientX;
  joystick.y = t.clientY;
});

canvas.addEventListener("touchmove", e => {
  if (!joystick.active) return;
  const t = e.touches[0];
  joystick.dx = t.clientX - joystick.x;
  joystick.dy = t.clientY - joystick.y;
});

canvas.addEventListener("touchend", () => {
  joystick.active = false;
  joystick.dx = joystick.dy = 0;
});

// -------------------------------
// INTERACT BUTTON
// -------------------------------
document.getElementById("interact").onclick = () => {
  if (scene === "office") {
    // Key pickup
    if (
      player.x > 4*TILE && player.x < 8*TILE &&
      player.y > 3*TILE && player.y < 5*TILE
    ) {
      hasKey = true;
      alert("🔑 Key obtained!");
    }

    // Water test station
    if (
      player.x > 10*TILE && player.x < 12*TILE &&
      player.y > 3*TILE && player.y < 5*TILE
    ) {
      alert("💧 Water test station (minigame coming)");
    }
  }
};

// -------------------------------
// DRAW HELPERS
// -------------------------------
function floorColor(x, y) {
  const base = 180;
  const noise = (x * 13 + y * 17) % 10;
  return `rgb(${base+noise},${base+noise},${base+noise})`;
}

function drawFloorTile(x, y) {
  ctx.fillStyle = floorColor(x/TILE, y/TILE);
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "#bbb";
  ctx.strokeRect(x, y, TILE, TILE);
}

function drawWall(x, y) {
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#444";
  ctx.fillRect(x, y, TILE, 4);
}

// -------------------------------
// OFFICE SCENE
// -------------------------------
function drawOffice() {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      if (
        x === 0 || x === 19 ||
        y === 0 || y === 14
      ) {
        // North exit
        if (!(y === 0 && x >= 9 && x <= 10)) {
          drawWall(x*TILE, y*TILE);
          continue;
        }
      }
      drawFloorTile(x*TILE, y*TILE);
    }
  }

  // Front desk
  ctx.fillStyle = "#3b2a1e";
  ctx.fillRect(4*TILE, 3*TILE, 4*TILE, TILE);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(4*TILE, 3*TILE + TILE, 4*TILE, 6);

  // Key
  if (!hasKey) {
    ctx.font = "20px serif";
    ctx.fillText("🔑", 5.7*TILE, 3.8*TILE);
  }

  // Water test station
  ctx.fillStyle = "#555";
  ctx.fillRect(10*TILE, 3*TILE, TILE*1.5, TILE);
  ctx.font = "18px serif";
  ctx.fillText("💧", 10.5*TILE, 3.8*TILE);
}

// -------------------------------
// POOL SCENE
// -------------------------------
function drawPool() {
  ctx.fillStyle = "#bfe6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pool water
  ctx.fillStyle = "#4aa3df";
  ctx.fillRect(2*TILE, 2*TILE, 16*TILE, 8*TILE);

  // Lane lines
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(2*TILE, 2*TILE + i*2*TILE);
    ctx.lineTo(18*TILE, 2*TILE + i*2*TILE);
    ctx.stroke();
  }

  ctx.fillStyle = "#000";
  ctx.fillText("Pool Minigame Coming Soon", 200, 440);
}

// -------------------------------
// PLAYER
// -------------------------------
function movePlayer() {
  player.x += Math.sign(joystick.dx) * player.speed;
  player.y += Math.sign(joystick.dy) * player.speed;

  // Scene change
  if (scene === "office" && player.y < 0) {
    scene = "pool";
    player.y = canvas.height - 40;
  }
}

function drawPlayer() {
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size/2, 0, Math.PI*2);
  ctx.fill();
}

// -------------------------------
// GAME LOOP
// -------------------------------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (scene === "office") drawOffice();
  if (scene === "pool") drawPool();

  movePlayer();
  drawPlayer();

  // UI
  ctx.fillStyle = "#000";
  ctx.fillText(VERSION, 10, 20);

  requestAnimationFrame(loop);
}

loop();