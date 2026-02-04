// ===============================
// Lifeguard Orientation Game
// game.js — v1.2.0  <-- bumped
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const TILE = 32;
const VERSION = "v1.2.0"; // <-- bumped

// -------------------------------
// GAME STATE
// -------------------------------
let scene = "office";
let hasKey = false;

// NEW: Persisted Olaf unlock (survives refresh)
let hasOlaf = (typeof localStorage !== "undefined" && localStorage.getItem("olafUnlocked") === "1") || false;

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

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  joystick.active = true;
  joystick.x = t.clientX;
  joystick.y = t.clientY;
});

canvas.addEventListener("touchmove", (e) => {
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
// WATER TEST MINIGAME STATE
// -------------------------------
let waterTest = {
  active: false,
  step: 0,
  filled: false,
  drops0001: 0,
  drops0002: 0,
  drops0003: 0,
  vialColor: "#9bd7ff",
  message: ""
};

// -------------------------------
// OLAF (AI WRAPPER) — STATE & UI
// -------------------------------
const olaf = {
  panelOpen: false,     // UI panel visibility
  messages: [],         // {role:'user'|'olaf', text:string}
  isTyping: false,
};

// UI refs (these exist after index.html changes)
const olafToggleBtn = document.getElementById("olafToggle");
const olafPanel = document.getElementById("olafPanel");
const olafFeed = document.getElementById("olafFeed");
const olafInput = document.getElementById("olafInput");
const olafSend = document.getElementById("olafSend");
const olafClose = document.getElementById("olafClose");

// Safe guards (site might not have injected HTML yet)
function setOlafVisibility(visible) {
  if (!olafPanel || !olafToggleBtn) return;
  olaf.panelOpen = visible;
  olafPanel.classList.toggle("hidden", !visible);
}

function setOlafUnlocked(unlocked) {
  hasOlaf = unlocked;
  if (olafToggleBtn) {
    olafToggleBtn.classList.toggle("hidden", !unlocked);
    if (unlocked) {
      olafToggleBtn.classList.add("olaf-cta");
      setTimeout(() => olafToggleBtn && olafToggleBtn.classList.remove("olaf-cta"), 1400);
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("olafUnlocked", unlocked ? "1" : "0");
  }
}

function olafPush(role, text) {
  olaf.messages.push({ role, text });
  renderOlafFeed();
}

function renderOlafFeed() {
  if (!olafFeed) return;
  olafFeed.innerHTML = "";
  for (const m of olaf.messages) {
    const div = document.createElement("div");
    div.className = `olaf-bubble ${m.role === "user" ? "user" : "bot"}`;
    div.textContent = m.text;
    olafFeed.appendChild(div);
  }
  olafFeed.scrollTop = olafFeed.scrollHeight;
}

function getOlafContext() {
  return {
    version: VERSION,
    scene,
    hasKey,
    hasOlaf,
    waterTest: {
      active: waterTest.active,
      step: waterTest.step,
      filled: waterTest.filled,
      drops0001: waterTest.drops0001,
      drops0002: waterTest.drops0002,
      drops0003: waterTest.drops0003,
    },
    player: { x: player.x, y: player.y }
  };
}

// RULE-BASED fallback brain (works offline)
function olafLocalReply(text) {
  const t = (text || "").toLowerCase().trim();
  const ctx = getOlafContext();

  // Short intents
  if (/hello|hi|hey|what can you do/.test(t)) {
    return "Hi! I’m Olaf 🧊. I can guide you through the orientation, explain minigames, and give hints. Try: “how do I complete the chlorine test?”";
  }

  if (/water|test|chlorine|0001|0002|0003/.test(t)) {
    if (!ctx.waterTest.active) {
      return "Head to the 💧 station in the office and press INTERACT to start the Water Test tutorial.";
    }
    if (!ctx.waterTest.filled) {
      return "Fill the vial halfway to the line first, then add drops.";
    }
    if (ctx.waterTest.step === 1) {
      const need1 = Math.max(0, 5 - ctx.waterTest.drops0001);
      const need2 = Math.max(0, 5 - ctx.waterTest.drops0002);
      return `Add 5 drops each of 0001 and 0002. You still need ${need1} of 0001 and ${need2} of 0002.`;
    }
    if (ctx.waterTest.step === 2) {
      const need3 = Math.max(0, 5 - ctx.waterTest.drops0003);
      return `Great! It's light pink ≈ 2.0 PPM. Now add 5 drops of 0003 to reach ≈ 3.00 PPM. You still need ${need3}.`;
    }
    if (ctx.waterTest.step >= 3) {
      return "You’re done! Darker pink ≈ 3.00 PPM. Press Exit to finish the tutorial.";
    }
  }

  if (/where.*pool|go.*pool|how.*pool/.test(t)) {
    return "From the office, walk north through the top gap to enter the pool scene.";
  }

  if (/key|olaf|help|guide/.test(t)) {
    if (!hasOlaf) return "Find the 🔑 on the front desk and press INTERACT to unlock me.";
    return "I’m unlocked! Ask me about the water test, controls, or where to go next.";
  }

  // Default generic help by scene
  if (ctx.scene === "office") {
    return "Look around the office. Try picking up the 🔑 at the front desk, and visit the 💧 station to start the water test.";
  }
  if (ctx.scene === "pool") {
    return "Welcome to the pool! More minigames are coming soon. For now, explore or return to the office through the south edge.";
  }

  return "Need a hand? Ask me about the water test, where to go, or what the key does.";
}

// OPTIONAL: server-backed LLM brain (plug your endpoint here)
async function olafLLM(userText) {
  try {
    const res = await fetch("/api/olaf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userText, context: getOlafContext() })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.reply === "string" && data.reply.trim()) {
        return data.reply.trim();
      }
    }
  } catch (e) {
    // silent failover to local brain
  }
  return null;
}

async function olafHandleSend() {
  if (!olafInput) return;
  const text = olafInput.value.trim();
  if (!text) return;
  olafInput.value = "";
  olafPush("user", text);
  olaf.isTyping = true;

  // Try LLM, fallback to local
  const llm = await olafLLM(text);
  const reply = llm || olafLocalReply(text);

  olaf.isTyping = false;
  olafPush("olaf", reply);
}

function olafOnboarding() {
  olafPush("olaf", "🔑 You found the AI Key! I’m **Olaf** 🧊—your lifeguard guide. Ask me anything or press the 💧 station to start the water test.");
  setOlafVisibility(true);
}

// Wire Olaf UI (if elements are present)
if (olafToggleBtn) {
  olafToggleBtn.onclick = () => setOlafVisibility(!olaf.panelOpen);
}
if (olafClose) {
  olafClose.onclick = () => setOlafVisibility(false);
}
if (olafSend) {
  olafSend.onclick = olafHandleSend;
}
if (olafInput) {
  olafInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") olafHandleSend();
  });
}
// Hotkey to toggle Olaf
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "h" && hasOlaf) {
    setOlafVisibility(!olaf.panelOpen);
  }
});

// Initialize Olaf button visibility on load
setOlafUnlocked(hasOlaf);
renderOlafFeed();

// -------------------------------
// DRAW HELPERS (unchanged)
// -------------------------------
function floorColor(x, y) {
  const base = 180;
  const noise = (x * 13 + y * 17) % 10;
  return `rgb(${base + noise},${base + noise},${base + noise})`;
}

function drawFloorTile(x, y) {
  ctx.fillStyle = floorColor(x / TILE, y / TILE);
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
// WATER TEST: HELPERS & UI (unchanged core)
// -------------------------------
function startWaterTest() {
  scene = "waterTest";
  waterTest.active = true;

  waterTest.step = 0;
  waterTest.filled = false;
  waterTest.drops0001 = 0;
  waterTest.drops0002 = 0;
  waterTest.drops0003 = 0;
  waterTest.vialColor = "#9bd7ff";
  waterTest.message = "Fill the vial HALF WAY to the line with water.";
  updateWaterUI();

  // Olaf context tip
  if (hasOlaf) {
    olafPush("olaf", "Tip: Fill the vial halfway, then add 5 drops each of 0001 and 0002.");
    if (!olaf.panelOpen) setOlafVisibility(true);
  }
}

function exitWaterTest() {
  waterTest.active = false;
  scene = "office";
  waterTest.message = "";
  updateWaterUI();

  if (hasOlaf) {
    olafPush("olaf", "Great work! You can revisit the 💧 station anytime for a refresher.");
  }
}

function checkChlorineStep() {
  if (waterTest.step === 1 && waterTest.drops0001 >= 5 && waterTest.drops0002 >= 5) {
    waterTest.step = 2;
    waterTest.vialColor = "#f6b3c8";
    waterTest.message =
      "The vial turns LIGHT PINK.\nPink color matches 2.0 PPM.\nNow add 5 drops of 0003 solution.";

    if (hasOlaf) olafPush("olaf", "Good—light pink ≈ 2.0 PPM. Now add 5 drops of 0003.");
  }

  if (waterTest.step === 2 && waterTest.drops0003 >= 5) {
    waterTest.step = 3;
    waterTest.vialColor = "#e05a89";
    waterTest.message =
      "Color changes to DARKER PINK.\nIt matches 3.00 PPM.\nTutorial complete! (Press Exit)";

    if (hasOlaf) olafPush("olaf", "All set—darker pink ≈ 3.00 PPM. Press Exit to finish!");
  }
}

// wrapText unchanged…
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = String(text).split("\n");
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(" ");
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
    y += lineHeight;
  }
}

// -------------------------------
// WATER TEST: DRAW OVERLAY (unchanged visual)
// -------------------------------
function drawWaterTest() {
  drawOffice();

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const px = 70, py = 60, pw = 500, ph = 360;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = "#222";
  ctx.strokeRect(px, py, pw, ph);

  ctx.fillStyle = "#111";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("💧 Water Test Tutorial (Chlorine)", px + 20, py + 35);

  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#111";
  wrapText(ctx, waterTest.message, px + 20, py + 70, 320, 20);

  const vx = px + 370, vy = py + 90, vw = 70, vh = 200;
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(vx, vy, vw, vh);

  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(vx, vy + vh / 2);
  ctx.lineTo(vx + vw, vy + vh / 2);
  ctx.stroke();

  let fillHeight = 0;
  if (waterTest.filled) fillHeight = vh / 2;

  ctx.fillStyle = waterTest.vialColor;
  ctx.fillRect(vx + 3, vy + vh - fillHeight, vw - 6, fillHeight);

  ctx.fillStyle = "#111";
  ctx.font = "14px sans-serif";
  ctx.fillText("Vial", vx + 18, vy + vh + 20);

  ctx.font = "14px monospace";
  ctx.fillText(`0001: ${waterTest.drops0001}/5`, px + 20, py + 230);
  ctx.fillText(`0002: ${waterTest.drops0002}/5`, px + 20, py + 255);
  ctx.fillText(`0003: ${waterTest.drops0003}/5`, px + 20, py + 280);

  ctx.font = "14px sans-serif";
  ctx.fillText("Use the buttons below.", px + 20, py + ph - 20);
}

// -------------------------------
// OFFICE SCENE (unchanged visual)
// -------------------------------
function drawOffice() {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      if (x === 0 || x === 19 || y === 0 || y === 14) {
        if (!(y === 0 && x >= 9 && x <= 10)) {
          drawWall(x * TILE, y * TILE);
          continue;
        }
      }
      drawFloorTile(x * TILE, y * TILE);
    }
  }

  ctx.fillStyle = "#3b2a1e";
  ctx.fillRect(4 * TILE, 3 * TILE, 4 * TILE, TILE);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(4 * TILE, 3 * TILE + TILE, 4 * TILE, 6);

  if (!hasKey) {
    ctx.font = "20px serif";
    ctx.fillText("🔑", 5.7 * TILE, 3.8 * TILE);
  }

  ctx.fillStyle = "#555";
  ctx.fillRect(10 * TILE, 3 * TILE, TILE * 1.5, TILE);
  ctx.font = "18px serif";
  ctx.fillText("💧", 10.5 * TILE, 3.8 * TILE);
}

// -------------------------------
// POOL SCENE (unchanged)
// -------------------------------
function drawPool() {
  ctx.fillStyle = "#bfe6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#4aa3df";
  ctx.fillRect(2 * TILE, 2 * TILE, 16 * TILE, 8 * TILE);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(2 * TILE, 2 * TILE + i * 2 * TILE);
    ctx.lineTo(18 * TILE, 2 * TILE + i * 2 * TILE);
    ctx.stroke();
  }

  ctx.fillStyle = "#000";
  ctx.fillText("Pool Minigame Coming Soon", 200, 440);
}

// -------------------------------
// UI BUTTONS (water test tutorial) (unchanged wiring)
// -------------------------------
const waterButtons = document.getElementById("waterTestButtons");
const btnFill = document.getElementById("fillVial");
const btn0001 = document.getElementById("drop0001");
const btn0002 = document.getElementById("drop0002");
const btn0003 = document.getElementById("drop0003");
const btnExit = document.getElementById("exitTest");

function updateWaterUI() {
  if (!waterButtons) return;

  waterButtons.style.display = (scene === "waterTest") ? "flex" : "none";
  if (scene !== "waterTest") return;

  if (btnFill) btnFill.disabled = waterTest.filled;

  const canDrop12 = waterTest.filled && waterTest.step >= 1;
  if (btn0001) btn0001.disabled = !canDrop12 || waterTest.drops0001 >= 5;
  if (btn0002) btn0002.disabled = !canDrop12 || waterTest.drops0002 >= 5;

  const canDrop3 = waterTest.filled && waterTest.step >= 2;
  if (btn0003) btn0003.disabled = !canDrop3 || waterTest.drops0003 >= 5;
}

if (btnFill) {
  btnFill.onclick = () => {
    if (scene !== "waterTest") return;
    waterTest.filled = true;
    waterTest.step = 1;
    waterTest.message =
      "Add 5 drops of 0001 solution AND 5 drops of 0002 solution.";
    updateWaterUI();
  };
}

if (btn0001) {
  btn0001.onclick = () => {
    if (scene !== "waterTest" || !waterTest.filled) return;
    waterTest.drops0001++;
    checkChlorineStep();
    updateWaterUI();
  };
}

if (btn0002) {
  btn0002.onclick = () => {
    if (scene !== "waterTest" || !waterTest.filled) return;
    waterTest.drops0002++;
    checkChlorineStep();
    updateWaterUI();
  };
}

if (btn0003) {
  btn0003.onclick = () => {
    if (scene !== "waterTest" || waterTest.step < 2) return;
    waterTest.drops0003++;
    checkChlorineStep();
    updateWaterUI();
  };
}

if (btnExit) {
  btnExit.onclick = () => {
    exitWaterTest();
    updateWaterUI();
  };
}

// -------------------------------
// INTERACT BUTTON (pickup + water test)
// -------------------------------
const interactBtn = document.getElementById("interact");
if (interactBtn) {
  interactBtn.onclick = () => {
    if (scene === "office") {
      // Key pickup -> unlock Olaf
      if (
        player.x > 4 * TILE && player.x < 8 * TILE &&
        player.y > 3 * TILE && player.y < 5 * TILE
      ) {
        if (!hasKey) {
          hasKey = true;
          setOlafUnlocked(true);
          olafOnboarding();
        }
      }

      // Water test station
      if (
        player.x > 10 * TILE && player.x < 12 * TILE &&
        player.y > 3 * TILE && player.y < 5 * TILE
      ) {
        startWaterTest();
      }
    }
  };
}

// -------------------------------
// PLAYER
// -------------------------------
function movePlayer() {
  if (scene === "waterTest") return;

  player.x += Math.sign(joystick.dx) * player.speed;
  player.y += Math.sign(joystick.dy) * player.speed;

  if (scene === "office" && player.y < 0) {
    scene = "pool";
    player.y = canvas.height - 40;
    if (hasOlaf) olafPush("olaf", "You’re at the pool! More activities coming soon.");
  }
}

function drawPlayer() {
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
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

  if (scene !== "waterTest") {
    drawPlayer();
  }

  ctx.fillStyle = "#000";
  ctx.fillText(VERSION, 10, 20);

  updateWaterUI();
  requestAnimationFrame(loop);
}

loop();
``
