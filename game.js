const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const version = "v1.1.2";
document.getElementById("version").innerText = version;

// TILE SIZE
const TILE = 32;

// SCENES
const SCENES = {
  POOL: "pool",
  OFFICE: "office",
};

let currentScene = SCENES.POOL;
let hasKey = false;

// PLAYER
const player = {
  x: 4 * TILE,
  y: 6 * TILE,
  speed: TILE,
  color: "#000",
};

// TOUCH CONTROLS
let touchX = null;
let touchY = null;

canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  touchX = e.touches[0].clientX - rect.left;
  touchY = e.touches[0].clientY - rect.top;
  movePlayerToTile(touchX, touchY);
});

// KEYBOARD CONTROLS
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") player.y -= player.speed;
  if (e.key === "ArrowDown") player.y += player.speed;
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
});

// INTERACT BUTTON
document.getElementById("interactBtn").addEventListener("click", () => {
  interact();
});

// UTILS
function movePlayerToTile(px, py) {
  const tileX = Math.floor(px / TILE);
  const tileY = Math.floor(py / TILE);

  player.x = tileX * TILE;
  player.y = tileY * TILE;
}

function isColliding(x, y, map) {
  const tileX = Math.floor(x / TILE);
  const tileY = Math.floor(y / TILE);

  // Check map boundaries
  if (tileX < 0 || tileY < 0 || tileX >= map[0].length || tileY >= map.length) {
    return true;
  }

  return map[tileY][tileX] === 1;
}

// MAPS
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

// DRAW
function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = currentScene === SCENES.POOL ? poolMap : officeMap;

  // draw floor
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === 1) {
        ctx.fillStyle = "#000";
      } else {
        ctx.fillStyle = currentScene === SCENES.POOL ? "#cde7ff" : "#e8e8e8";
      }
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  // draw key
  if (!hasKey && currentScene === SCENES.OFFICE) {
    ctx.fillStyle = "gold";
    ctx.fillRect(2 * TILE, 2 * TILE, TILE, TILE);
  }

  // draw player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, TILE, TILE);

  // draw scene objects
  if (currentScene === SCENES.POOL) {
    drawPoolObjects();
  } else {
    drawOfficeObjects();
  }
}

function drawPoolObjects() {
  // Pool outline
  ctx.fillStyle = "#00aaff";
  ctx.fillRect(6 * TILE, 1 * TILE, 12 * TILE, 8 * TILE);

  // Hot tub + steam
  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(6 * TILE, 0 * TILE, 3 * TILE, 1 * TILE);
  ctx.fillStyle = "#ff7700";
  ctx.fillRect(9 * TILE, 0 * TILE, 3 * TILE, 1 * TILE);

  // Dive tank (small square)
  ctx.fillStyle = "#0033aa";
  ctx.fillRect(17 * TILE, 3 * TILE, 3 * TILE, 3 * TILE);
}

function drawOfficeObjects() {
  // Guard office
  ctx.fillStyle = "#808080";
  ctx.fillRect(2 * TILE, 2 * TILE, 10 * TILE, 6 * TILE);

  // Front desk
  ctx.fillStyle = "#444";
  ctx.fillRect(2 * TILE, 8 * TILE, 10 * TILE, 1 * TILE);

  // Water test station
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(3 * TILE, 3 * TILE, 1 * TILE, 1 * TILE);
}

// INTERACTION
let waterTestSolved = false;
let waterTestStage = 0;

function interact() {
  if (currentScene === SCENES.OFFICE) {
    const px = player.x / TILE;
    const py = player.y / TILE;

    // pick up key
    if (!hasKey && px === 2 && py === 2) {
      hasKey = true;
      alert("You picked up the key!");
      return;
    }

    // water test station
    if (px === 3 && py === 3) {
      waterTest();
      return;
    }
  }

  // Door between office and pool
  if (currentScene === SCENES.OFFICE && player.x === 11 * TILE && player.y === 4 * TILE) {
    currentScene = SCENES.POOL;
    player.x = 5 * TILE;
    player.y = 5 * TILE;
    return;
  }

  if (currentScene === SCENES.POOL && player.x === 5 * TILE && player.y === 5 * TILE && hasKey) {
    currentScene = SCENES.OFFICE;
    player.x = 10 * TILE;
    player.y = 4 * TILE;
    return;
  }
}

function waterTest() {
  if (waterTestSolved) {
    alert("Water test already completed!");
    return;
  }

  waterTestStage++;

  if (waterTestStage === 1) {
    alert("Step 1: Collect sample");
  } else if (waterTestStage === 2) {
    alert("Step 2: Test chlorine");
  } else if (waterTestStage === 3) {
    alert("Step 3: Test pH");
  } else if (waterTestStage === 4) {
    alert("Step 4: Record results");
    waterTestSolved = true;
    alert("Water test complete! (Answers shown)");
  }
}

// GAME LOOP
function gameLoop() {
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop();
