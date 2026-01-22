const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 240;

/* =====================
   GAME STATE
===================== */
let currentScene = "lobby";
let hasKey = false;

const player = {
  x: 170,
  y: 180,
  size: 12,
  speed: 2
};

/* =====================
   INPUT
===================== */
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/* =====================
   MAIN LOOP
===================== */
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

/* =====================
   UPDATE
===================== */
function update() {
  if (keys["ArrowUp"]) player.y -= player.speed;
  if (keys["ArrowDown"]) player.y += player.speed;
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // Keep player in bounds
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Scene transitions
  if (currentScene === "lobby" && player.y < 5) {
    currentScene = "pool";
    player.y = canvas.height - 30;
  }

  if (currentScene === "pool" && player.y > canvas.height - 5) {
    currentScene = "lobby";
    player.y = 20;
  }
}

/* =====================
   DRAW
===================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentScene === "lobby") drawLobby();
  if (currentScene === "pool") drawPool();

  drawPlayer();
}

/* =====================
   PLAYER
===================== */
function drawPlayer() {
  ctx.fillStyle = "black";
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

/* =====================
   LOBBY / ADMIN SCENE
===================== */
function drawLobby() {
  ctx.fillStyle = "#ffc0cb"; // Pink admin zone
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Guard Office
  drawZone(20, 60, 120, 80, "Guard Office");

  // Key
  if (!hasKey) {
    ctx.fillStyle = "gold";
    ctx.fillRect(60, 90, 10, 10);
    if (isNear(60, 90)) {
      hasKey = true;
      alert("🔑 Key collected! Pool access unlocked.");
    }
  }

  // Water Test Station
  drawZone(160, 60, 160, 60, "Water Test");

  // Front Desk
  drawZone(80, 160, 200, 50, "Front Desk");

  // Exit label
  drawText("↑ Pool Deck", 140, 20);
}

/* =====================
   POOL DECK SCENE
===================== */
function drawPool() {
  ctx.fillStyle = "#87cefa"; // Pool blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!hasKey) {
    drawText("🔒 Pool Locked - Get the Key", 70, 120);
    return;
  }

  // Hot Tub
  drawZone(20, 20, 100, 40, "Hot Tub");

  // Steam Room
  drawZone(140, 20, 100, 40, "Steam");

  // 6-Lane Pool (Shallow → Deep)
  ctx.fillStyle = "#1e90ff";
  ctx.fillRect(40, 80, 280, 70);
  drawText("6-Lane Pool", 140, 120);
  drawText("Shallow → Deep", 130, 140);

  // Dive Tank (separate basin)
  drawZone(240, 160, 80, 60, "Dive Tank");

  // Exit label
  drawText("↓ Lobby", 150, 230);
}

/* =====================
   HELPERS
===================== */
function drawZone(x, y, w, h, label) {
  ctx.strokeStyle = "black";
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "black";
  ctx.fillText(label, x + 10, y + 25);
}

function drawText(text, x, y) {
  ctx.fillStyle = "black";
  ctx.font = "12px Arial";
  ctx.fillText(text, x, y);
}

function isNear(x, y) {
  return (
    player.x > x - 15 &&
    player.x < x + 15 &&
    player.y > y - 15 &&
    player.y < y + 15
  );
}

/* =====================
   INTERACT BUTTON
===================== */
document.getElementById("interactBtn").onclick = () => {
  if (currentScene === "lobby") {
    alert("🧪 Water Test Station coming next!");
  } else {
    alert("🏊 Pool supervision mode coming soon!");
  }
};
