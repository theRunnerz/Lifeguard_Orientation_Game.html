// ===============================
// Lifeguard Orientation Game
// game.js — v1.1.7
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
  startWaterTest();
}

  }
};
// -------------------------------
// WATER TEST MINIGAME STATE
// -------------------------------
let waterTest = {
  active: false,
  step: 0,           // tutorial step index
  filled: false,     // vial filled to half line
  drops0001: 0,
  drops0002: 0,
  drops0003: 0,
  vialColor: "#9bd7ff",  // default "water" color
  message: ""
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
function startWaterTest() {
  scene = "waterTest";
  waterTest.active = true;
function drawWaterTest() {
  // draw office behind it so it feels like a station overlay
  drawOffice();

  // dark overlay
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // panel
  const px = 70, py = 60, pw = 500, ph = 360;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = "#222";
  ctx.strokeRect(px, py, pw, ph);

  // title
  ctx.fillStyle = "#111";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("💧 Water Test Tutorial (Chlorine)", px + 20, py + 35);

  // instructions text
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#111";
  wrapText(ctx, waterTest.message, px + 20, py + 70, 320, 20);

  // draw vial
  const vx = px + 370, vy = py + 90, vw = 70, vh = 200;

  // vial outline
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(vx, vy, vw, vh);

  // "half line" marker
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(vx, vy + vh / 2);
  ctx.lineTo(vx + vw, vy + vh / 2);
  ctx.stroke();

  // fill level
  let fillHeight = 0;
  if (waterTest.filled) fillHeight = vh / 2;

  ctx.fillStyle = waterTest.vialColor;
  ctx.fillRect(vx + 3, vy + vh - fillHeight, vw - 6, fillHeight);

  // vial label text
  ctx.fillStyle = "#111";
  ctx.font = "14px sans-serif";
  ctx.fillText("Vial", vx + 18, vy + vh + 20);

  // drop counters
  ctx.font = "14px monospace";
  ctx.fillText(`0001: ${waterTest.drops0001}/5`, px + 20, py + 230);
  ctx.fillText(`0002: ${waterTest.drops0002}/5`, px + 20, py + 255);
  ctx.fillText(`0003: ${waterTest.drops0003}/5`, px + 20, py + 280);

  // footer hint
  ctx.font = "14px sans-serif";
  ctx.fillText("Use buttons below (we'll add them next step).", px + 20, py + ph - 20);
}

// simple text wrapper helper
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
  // reset minigame each time you start it
  waterTest.step = 0;
  waterTest.filled = false;
  waterTest.drops0001 = 0;
  waterTest.drops0002 = 0;
  waterTest.drops0003 = 0;
  waterTest.vialColor = "#9bd7ff";
  waterTest.message = "Fill the vial HALF WAY to the line with water.";
}

function exitWaterTest() {
  waterTest.active = false;
  scene = "office";
  waterTest.message = "";
}
``
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
const waterButtons = document.getElementById("waterTestButtons");
const btnFill = document.getElementById("fillVial");
const btn0001 = document.getElementById("drop0001");
const btn0002 = document.getElementById("drop0002");
const btn0003 = document.getElementById("drop0003");
const btnExit = document.getElementById("exitTest");

function updateWaterUI() {
  // show buttons only during minigame
  waterButtons.style.display = (scene === "waterTest") ? "flex" : "none";

  // enable/disable based on tutorial step
  btnFill.disabled = waterTest.filled;

  // must fill first
  const canDrop12 = waterTest.filled && waterTest.step >= 1;
  btn0001.disabled = !canDrop12 || waterTest.drops0001 >= 5;
  btn0002.disabled = !canDrop12 || waterTest.drops0002 >= 5;

  // 0003 only after step 2 achieved
  const canDrop3 = waterTest.filled && waterTest.step >= 2;
  btn0003.disabled = !canDrop3 || waterTest.drops0003 >= 5;
}

btnFill.onclick = () => {
  if (scene !== "waterTest") return;

  waterTest.filled = true;
  waterTest.step = 1;
  waterTest.message =
    "Add 5 drops of 0001 solution AND 5 drops of 0002 solution.";
  updateWaterUI();
};

btn0001.onclick = () => {
  if (scene !== "waterTest") return;
  if (!waterTest.filled) return;

  waterTest.drops0001++;
  checkChlorineStep();
  updateWaterUI();
};

btn0002.onclick = () => {
  if (scene !== "waterTest") return;
  if (!waterTest.filled) return;

  waterTest.drops0002++;
  checkChlorineStep();
  updateWaterUI();
};

btn0003.onclick = () => {
  if (scene !== "waterTest") return;
  if (waterTest.step < 2) return;

  waterTest.drops0003++;
  checkChlorineStep();
  updateWaterUI();
};

btnExit.onclick = () => {
  exitWaterTest();
  updateWaterUI();
};
function movePlayer() {
  if (scene === "waterTest") return; // freeze movement during minigame

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
  if (scene === "waterTest") drawWaterTest();

  movePlayer();
  drawPlayer();

  // UI
  ctx.fillStyle = "#000";
  ctx.fillText(VERSION, 10, 20);

  requestAnimationFrame(loop);
}

loop();
