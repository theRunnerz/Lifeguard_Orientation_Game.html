const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const version = "v1.1.3";
document.getElementById("version").innerText = version;

const TILE = 32;

const SCENES = {
  POOL: "pool",
  OFFICE: "office",
};

let currentScene = SCENES.POOL;
let hasKey = false;

// player
const player = {
  x: 2 * TILE,
  y: 7 * TILE,
  color: "#000",
};

// touch move
canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;
  movePlayerToTile(x, y);
});

// interact
document.getElementById("interactBtn").addEventListener("click", () => {
  interact();
});

// MAPS (1 = wall, 0 = walkable)
const poolMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const officeMap = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// draw
function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = currentScene === SCENES.POOL ? poolMap : officeMap;

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      ctx.fillStyle = map[y][x] === 1 ? "#000" : (currentScene === SCENES.POOL ? "#cde7ff" : "#e8e8e8");
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // draw pool
  if (currentScene === SCENES.POOL) {
    drawPool();
  } else {
    drawOffice();
  }

  // draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, TILE, TILE);
}

function drawPool() {
  // pool
  ctx.fillStyle = "#00aaff";
  ctx.fillRect(3 * TILE, 1 * TILE, 14 * TILE, 7 * TILE);

  // hot tub
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(2 * TILE, 1 * TILE, 2 * TILE, 2 * TILE);

  // door to office
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 4 * TILE, 1 * TILE, 2 * TILE);

  // water test station
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(5 * TILE, 8 * TILE, TILE, TILE);
}

function drawOffice() {
  // office
  ctx.fillStyle = "#808080";
  ctx.fillRect(1 * TILE, 1 * TILE, 12 * TILE, 7 * TILE);

  // desk
  ctx.fillStyle = "#444";
  ctx.fillRect(1 * TILE, 7 * TILE, 12 * TILE, TILE);

  // key
  if (!hasKey) {
    ctx.fillStyle = "gold";
    ctx.fillRect(6 * TILE, 3 * TILE, TILE, TILE);
  }

  // door to pool
  ctx.fillStyle = "#000";
  ctx.fillRect(13 * TILE, 4 * TILE, TILE, 2 * TILE);
}

// movement
function movePlayerToTile(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);

  const newX = tx * TILE;
  const newY = ty * TILE;

  if (!isColliding(newX, newY)) {
    player.x = newX;
    player.y = newY;
  }
}

function isColliding(x, y) {
  const map = currentScene === SCENES.POOL ? poolMap : officeMap;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);

  if (tx < 0 || ty < 0 || tx >= map[0].length || ty >= map.length) return true;
  return map[ty][tx] === 1;
}

// interaction
function interact() {
  const tx = player.x / TILE;
  const ty = player.y / TILE;

  if (currentScene === SCENES.OFFICE) {
    if (!hasKey && tx === 6 && ty === 3) {
      hasKey = true;
      alert("Key picked up!");
      return;
    }
    if (tx === 13 && ty >= 4 && ty <= 5) {
      currentScene = SCENES.POOL;
      player.x = 1 * TILE;
      player.y = 4 * TILE;
      return;
    }
  }

  if (currentScene === SCENES.POOL) {
    if (tx === 0 && ty >= 4 && ty <= 5) {
      currentScene = SCENES.OFFICE;
      player.x = 12 * TILE;
      player.y = 4 * TILE;
      return;
    }
    if (tx === 5 && ty === 8) {
      startWaterTest();
      return;
    }
  }
}

// water test mini game
let waterTestRunning = false;
let waterTestScore = 0;
let waterTestTimer = null;

function startWaterTest() {
  if (waterTestRunning) return;
  waterTestRunning = true;
  waterTestScore = 0;

  alert("Water Test Started! Tap fast to collect samples!");

  waterTestTimer = setInterval(() => {
    waterTestScore++;
    if (waterTestScore >= 20) {
      clearInterval(waterTestTimer);
      waterTestRunning = false;
      alert("Water test complete! Score: " + waterTestScore);
    }
  }, 200);
}

// game loop
function gameLoop() {
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop();
