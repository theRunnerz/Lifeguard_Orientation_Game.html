const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// 🔑 REAL canvas resolution
canvas.width = 320;
canvas.height = 480;

// Tile settings (Pokémon vibes)
const TILE = 32;
const MAP_W = 10;
const MAP_H = 15;

// Simple map (pink area = lobby/office)
const map = [
  "##########",
  "#........#",
  "#..K.....#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "#........#",
  "##########"
];

// Player
const player = {
  x: 1,
  y: 1
};

// Input
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Mobile tap = move down (placeholder)
document.getElementById("interactBtn").onclick = () => {
  player.y++;
};

// Game loop
function update() {
  if (keys["ArrowUp"]) player.y--;
  if (keys["ArrowDown"]) player.y++;
  if (keys["ArrowLeft"]) player.x--;
  if (keys["ArrowRight"]) player.x++;

  // collision
  if (map[player.y][player.x] === "#") {
    if (keys["ArrowUp"]) player.y++;
    if (keys["ArrowDown"]) player.y--;
    if (keys["ArrowLeft"]) player.x++;
    if (keys["ArrowRight"]) player.x--;
  }

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw map
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = map[y][x];

      if (tile === "#") ctx.fillStyle = "#444";
      else ctx.fillStyle = "#f2b3c6"; // pink area

      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);

      // Key
      if (tile === "K") {
        ctx.fillStyle = "gold";
        ctx.fillRect(x * TILE + 8, y * TILE + 8, 16, 16);
      }
    }
  }

  // Player
  ctx.fillStyle = "#0077aa";
  ctx.fillRect(player.x * TILE + 6, player.y * TILE + 6, 20, 20);
}

update();
