console.log("Running version 1.1.5");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 40;
const COLS = 20;
const ROWS = 10;

let player = { x: 2, y: 7, color: "black" };
let currentRoom = "pool";
let hasKey = false;

const KEY_ICON = "🔑";
const WATER_ICON = "💧";

let waterTestStage = 0;
let drops = 0;

const poolMap = [
  "####################",
  "#.............B....#",
  "#.............B....#",
  "#.............B....#",
  "#....SSSSS....BBBB.#",
  "#....SSSSS....BBBB.#",
  "#....SSSSS....BBBB.#",
  "#..P...............#",
  "#.................##",
  "####################"
];

const officeMap = [
  "####################",
  "#..............O...#",
  "#..............O...#",
  "#....OFFICE........#",
  "#....OFFICE........#",
  "#....OFFICE........#",
  "#....OFFICE........#",
  "#....OFFICE....K...#",
  "#..............O...#",
  "####################"
];

function drawMap(map) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let tile = map[y][x];

      ctx.fillStyle = "#bfe7ff";
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);

      if (tile === "#") {
        ctx.fillStyle = "black";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (tile === "B") {
        ctx.fillStyle = "blue";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (tile === "S") {
        ctx.fillStyle = "purple";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (tile === "P") {
        ctx.fillStyle = "orange";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (tile === "O") {
        ctx.fillStyle = "gray";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (tile === "K") {
        ctx.fillStyle = "yellow";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x * TILE, player.y * TILE, TILE, TILE);
}

function drawIcons() {
  ctx.font = "30px Arial";
  if (currentRoom === "pool") {
    ctx.fillText(WATER_ICON, 8 * TILE, 6 * TILE);
  } else if (currentRoom === "office") {
    ctx.fillText(KEY_ICON, 16 * TILE, 7 * TILE);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (currentRoom === "pool") drawMap(poolMap);
  if (currentRoom === "office") drawMap(officeMap);
  drawIcons();
  drawPlayer();
}

function canWalk(x, y) {
  const map = currentRoom === "pool" ? poolMap : officeMap;
  const tile = map[y][x];
  return tile !== "#" && tile !== "B" && tile !== "S";
}

function movePlayer(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if (canWalk(nx, ny)) {
    player.x = nx;
    player.y = ny;
    render();
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") movePlayer(0, -1);
  if (e.key === "ArrowDown") movePlayer(0, 1);
  if (e.key === "ArrowLeft") movePlayer(-1, 0);
  if (e.key === "ArrowRight") movePlayer(1, 0);
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);

  const dx = x - player.x;
  const dy = y - player.y;

  if (Math.abs(dx) + Math.abs(dy) === 1 && canWalk(x, y)) {
    player.x = x;
    player.y = y;
    render();
  }
});

function interact() {
  if (currentRoom === "pool" && player.x === 15 && player.y === 6) {
    currentRoom = "office";
    player.x = 2;
    player.y = 7;
    render();
    return;
  }

  if (currentRoom === "office" && player.x === 2 && player.y === 7) {
    currentRoom = "pool";
    player.x = 15;
    player.y = 6;
    render();
    return;
  }

  if (currentRoom === "office" && player.x === 16 && player.y === 7) {
    hasKey = true;
    alert("You picked up the key! 🔑");
  }

  if (currentRoom === "pool" && player.x === 8 && player.y === 6) {
    waterTest();
  }
}

function waterTest() {
  if (waterTestStage === 0) {
    waterTestStage = 1;
    drops = 0;
    alert("Water test started. Add 5 drops of 001.");
    return;
  }

  drops++;
  if (waterTestStage === 1 && drops === 5) {
    waterTestStage = 2;
    drops = 0;
    alert("First 5 drops complete. Water turns clear. Add 5 drops of 002.");
  } else if (waterTestStage === 2 && drops === 5) {
    waterTestStage = 3;
    drops = 0;
    alert("Second 5 drops complete. Water turns light pink. Add 5 drops of 003.");
  } else if (waterTestStage === 3 && drops === 5) {
    waterTestStage = 0;
    drops = 0;
    alert("Water test complete. Total chlorine measured! 💧");
  }
}

document.getElementById("interactBtn").addEventListener("click", interact);
render();