/* ======================
   Lifeguard Orientation
   Version 1.2.0
====================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 12;
const COLS = 16;

let currentRoom = "office";
let hasKey = false;

/* ======================
   PLAYER
====================== */
const player = {
  x: 7,
  y: 9,
  color: "red"
};

/* ======================
   MAPS
====================== */
const officeMap = [
  "################",
  "#..............#",
  "#..DESK..TEST...#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#......P.......#",
  "#..............#",
  "################"
];

const poolMap = [
  "################",
  "#~~~~~~POOL~~~~#",
  "#~~~~~~POOL~~~~#",
  "#~~~~~~POOL~~~~#",
  "#~~~~~~POOL~~~~#",
  "#~~~~~~POOL~~~~#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#..............#",
  "#......P.......#",
  "################"
];

/* ======================
   INPUT
====================== */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
});

document.querySelectorAll("#joystick button").forEach(btn => {
  btn.addEventListener("click", () => {
    const d = btn.dataset.dir;
    if (d === "up") move(0, -1);
    if (d === "down") move(0, 1);
    if (d === "left") move(-1, 0);
    if (d === "right") move(1, 0);
  });
});

document.getElementById("interactBtn").addEventListener("click", interact);

/* ======================
   MOVE
====================== */
function move(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const map = currentRoom === "office" ? officeMap : poolMap;

  if (map[ny][nx] !== "#") {
    player.x = nx;
    player.y = ny;

    // Transition north to pool
    if (currentRoom === "office" && ny === 1) {
      currentRoom = "pool";
      player.x = 7;
      player.y = 9;
      document.getElementById("objective").innerText =
        "Objective: Explore the pool area.";
    }

    // Return south to office
    if (currentRoom === "pool" && ny === 10) {
      currentRoom = "office";
      player.x = 7;
      player.y = 2;
    }
  }
}

/* ======================
   INTERACT
====================== */
function interact() {
  const map = currentRoom === "office" ? officeMap : poolMap;
  const tile = map[player.y][player.x];

  // Front Desk
  if (currentRoom === "office" && tile === "D") {
    hasKey = true;
    alert("You picked up the KEY!");
    document.getElementById("objective").innerText =
      "Objective: Go north to the pool.";
  }

  // Water Test Station
  if (currentRoom === "office" && tile === "T") {
    startWaterTest();
  }

  // Pool mini-game placeholder
  if (currentRoom === "pool" && tile === "~") {
    alert("Pool mini-game coming next!");
  }
}

/* ======================
   WATER TEST MINI-GAME
====================== */
function startWaterTest() {
  alert(
    "Water Test:\n" +
    "1) Add 5 drops of 001 (turns clear)\n" +
    "2) Add 5 drops of 002 (light pink)\n" +
    "3) Add 5 drops of 003 (darker pink)\n\n" +
    "Results displayed next update!"
  );
}

/* ======================
   DRAW
====================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = currentRoom === "office" ? officeMap : poolMap;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = map[y][x];

      if (t === "#") ctx.fillStyle = "#555";
      else if (t === "D") ctx.fillStyle = "#c2a14d";
      else if (t === "T") ctx.fillStyle = "#9ad0ec";
      else if (t === "~") ctx.fillStyle = "#4da6ff";
      else ctx.fillStyle = "#e6e6e6";

      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * TILE + 4, player.y * TILE + 4, 24, 24);

  requestAnimationFrame(draw);
}

draw();