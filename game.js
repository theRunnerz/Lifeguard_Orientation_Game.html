const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const version = "v1.1.4";
document.getElementById("version").innerText = version;

const TILE = 32;

const SCENES = {
  POOL: "pool",
  OFFICE: "office",
};

let currentScene = SCENES.POOL;
let hasKey = false;

const player = {
  x: 2 * TILE,
  y: 6 * TILE,
  color: "#000",
};

canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;
  movePlayerToTile(x, y);
});

document.getElementById("interactBtn").addEventListener("click", () => {
  interact();
});

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

let waterTest = {
  stage: 0, // 0 = not started, 1=001, 2=002, 3=003
  drops: 0,
  result: "",
};

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const map = currentScene === SCENES.POOL ? poolMap : officeMap;

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      ctx.fillStyle = map[y][x] === 1 ? "#000" : (currentScene === SCENES.POOL ? "#cde7ff" : "#e8e8e8");
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }

  if (currentScene === SCENES.POOL) drawPool();
  else drawOffice();

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, TILE, TILE);

  // show water test result
  if (waterTest.result) {
    ctx.fillStyle = "#000";
    ctx.fillText(waterTest.result, 10, 30);
  }
}

function drawPool() {
  ctx.fillStyle = "#00aaff";
  ctx.fillRect(3 * TILE, 1 * TILE, 14 * TILE, 7 * TILE); // pool

  ctx.fillStyle = "#ffaa00";
  ctx.fillRect(2 * TILE, 1 * TILE, 2 * TILE, 2 * TILE); // hot tub

  ctx.fillStyle = "#800080";
  ctx.fillRect(1 * TILE, 1 * TILE, 2 * TILE, 2 * TILE); // steam room

  ctx.fillStyle = "#00008b";
  ctx.fillRect(16 * TILE, 2 * TILE, 3 * TILE, 3 * TILE); // dive tank

  ctx.fillStyle = "#00ff00";
  ctx.fillRect(5 * TILE, 8 * TILE, TILE, TILE); // water test

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 4 * TILE, TILE, 2 * TILE); // door to office
}

function drawOffice() {
  ctx.fillStyle = "#808080";
  ctx.fillRect(1 * TILE, 1 * TILE, 12 * TILE, 7 * TILE); // office area

  ctx.fillStyle = "#444";
  ctx.fillRect(1 * TILE, 7 * TILE, 12 * TILE, TILE); // desk

  if (!hasKey) {
    ctx.fillStyle = "gold";
    ctx.fillRect(6 * TILE, 3 * TILE, TILE, TILE); // key
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(13 * TILE, 4 * TILE, TILE, 2 * TILE); // door to pool
}

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

function startWaterTest() {
  waterTest.stage = 1;
  waterTest.drops = 0;
  waterTest.result = "Water Test Started: Add 5 drops of 001";

  const interval = setInterval(() => {
    waterTest.drops++;

    if (waterTest.stage === 1 && waterTest.drops === 5) {
      waterTest.stage = 2;
      waterTest.drops = 0;
      waterTest.result = "Add 5 drops of 002 (turns light pink)";
    } else if (waterTest.stage === 2 && waterTest.drops === 5) {
      waterTest.stage = 3;
      waterTest.drops = 0;
      waterTest.result = "Add 5 drops of 003 (turns darker pink)";
    } else if (waterTest.stage === 3 && waterTest.drops === 5) {
      clearInterval(interval);
      waterTest.result = "Water test complete: FREE CL2 + TOTAL CL2 recorded!";
    }
  }, 500);
}

function gameLoop() {
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop();
