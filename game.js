// game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 700;
canvas.height = 500;

// PLAYER
let player = { x: 350, y: 250, size: 10, speed: 4 };

// GAME STATE
let hasKey = false;
let unlocked = false;
let inChemTest = false;

// MAP OBJECTS
const rooms = [
  { name: "Steam Room", x: 500, y: 20, w: 80, h: 60, locked: true },
  { name: "Hot Tub", x: 590, y: 20, w: 80, h: 60, locked: true },
  { name: "Guard Office", x: 40, y: 180, w: 120, h: 80, locked: false, keyHere: true },
  { name: "Dive Tank", x: 560, y: 250, w: 100, h: 120, locked: true },
  { name: "6-Lane Pool", x: 220, y: 120, w: 260, h: 260, locked: false, pool: true }
];

// MOVEMENT
let keysDown = {};
document.addEventListener("keydown", e => (keysDown[e.key] = true));
document.addEventListener("keyup", e => (keysDown[e.key] = false));

// INTERACT BTN
document.getElementById("interactBtn").addEventListener("click", tryInteract);

// GAME LOOP
function gameLoop() {
  ctx.fillStyle = "#cceeff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawMap();
  movePlayer();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

// DRAW MAP
function drawMap() {
  rooms.forEach(r => {
    ctx.strokeStyle = "black";
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.fillText(r.name, r.x + 5, r.y + 15);
  });
}

// DRAW PLAYER
function drawPlayer() {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

// PLAYER MOVEMENT
function movePlayer() {
  if (keysDown["ArrowUp"] || keysDown["w"]) player.y -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) player.y += player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) player.x -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) player.x += player.speed;
}

// INTERACT
document.addEventListener("keydown", e => {
  if (e.key === "e" || e.key === "E") tryInteract();
});

function tryInteract() {
  rooms.forEach(r => {
    if (
      player.x > r.x - 15 &&
      player.x < r.x + r.w + 15 &&
      player.y > r.y - 15 &&
      player.y < r.y + r.h + 15
    ) {
      if (r.keyHere && !hasKey) {
        hasKey = true;
        document.getElementById("status").innerText =
          "Key collected! Hot Tub, Steam Room and Dive Tank unlocked.";
        unlockRooms();
      } else if (r.name === "Guard Office" && hasKey) {
        openChemTest();
      }
    }
  });
}

function unlockRooms() {
  rooms.forEach(r => {
    if (r.locked) r.locked = false;
  });
}

// =======================
// CHEMISTRY MINI-GAME
// =======================
const chemModal = document.getElementById("chemModal");
const chemText = document.getElementById("chemText");
const clReading = document.getElementById("clReading");
const phReading = document.getElementById("phReading");
const reagentBtns = document.querySelectorAll("#reagentRow button");
const choiceRow = document.getElementById("choices");
const closeChem = document.getElementById("closeChem");

let step = 0;
let totalChlorine = 3;
let freeChlorine = 2;
let combinedChlorine = totalChlorine - freeChlorine;
let pH = 7.4;

reagentBtns.forEach(btn =>
  btn.addEventListener("click", () => {
    handleReagent(btn.dataset.reagent);
  })
);

function openChemTest() {
  chemModal.style.display = "block";
  inChemTest = true;
  step = 0;
  chemText.innerText = "Start by adding 5 drops of Solution 001.";
  clReading.innerText = "Chlorine: —";
  phReading.innerText = "pH: —";
  reagentBtns.forEach(b => (b.disabled = b.dataset.reagent !== "001"));
  choiceRow.style.display = "none";
  closeChem.style.display = "none";
}

function handleReagent(reagent) {
  if (step === 0 && reagent === "001") {
    clReading.innerText = `Total Chlorine: ${totalChlorine} ppm`;
    chemText.innerText = "Now add 5 drops of Solution 002.";
    reagentBtns.forEach(b => (b.disabled = b.dataset.reagent !== "002"));
    step++;
  } else if (step === 1 && reagent === "002") {
    clReading.innerText += ` | Free Chlorine: ${freeChlorine} ppm`;
    chemText.innerText =
      "Now add 5 drops of Solution 003 to calculate Combined Chlorine.";
    reagentBtns.forEach(b => (b.disabled = b.dataset.reagent !== "003"));
    step++;
  } else if (step === 2 && reagent === "003") {
    chemText.innerText =
      "Combined Chlorine is Total - Free. What’s the value?";
    choiceRow.style.display = "flex";
    choiceRow.innerHTML = `
      <button class="btn" onclick="checkAnswer(0)">0 ppm</button>
      <button class="btn" onclick="checkAnswer(1)">1 ppm</button>
      <button class="btn" onclick="checkAnswer(2)">2 ppm</button>
    `;
    reagentBtns.forEach(b => (b.disabled = true));
    step++;
  } else if (step === 3 && reagent === "PR") {
    phReading.innerText = `pH: ${pH}`;
  }
}

window.checkAnswer = function (val) {
  if (val === combinedChlorine) {
    chemText.innerText = `Correct! Combined Chlorine = ${combinedChlorine} ppm. Now test pH with Phenol Red.`;
    reagentBtns.forEach(b => (b.disabled = b.dataset.reagent !== "PR"));
    choiceRow.style.display = "none";
    step++;
  } else {
    chemText.innerText = "Not quite — try again.";
  }
};

closeChem.addEventListener("click", () => {
  chemModal.style.display = "none";
  inChemTest = false;
});

// After pH test, allow closing
reagentBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (step === 4 && btn.dataset.reagent === "PR") {
      chemText.innerText = "Good work! Chemistry test complete.";
      closeChem.style.display = "inline-block";
    }
  });
});

// START GAME
gameLoop();
