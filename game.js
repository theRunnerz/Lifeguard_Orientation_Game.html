// Lifeguard Orientation Game
// game.js — v1.3.1 (layout/state fixes)
// ===============================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const TILE = 32;
const VERSION = "v1.3.1";

// -------------------------------
// GAME STATE
// -------------------------------
let scene = "office";
let hasKey = false;

// Persist Olaf unlock across refresh
let hasOlaf =
  (typeof localStorage !== "undefined" &&
    localStorage.getItem("olafUnlocked") === "1") ||
  false;

const player = {
  x: 9 * TILE,
  y: 8 * TILE,
  size: 18,
  speed: 2,
};

// -------------------------------
// KEYBOARD (WASD / ARROWS)
// -------------------------------
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function isTypingInInput() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

window.addEventListener("keydown", (e) => {
  // Don't hijack typing in Olaf input
  if (isTypingInInput()) return;

  const k = e.key.toLowerCase();

  // Movement
  if (k === "w" || e.key === "ArrowUp") {
    keys.up = true;
    e.preventDefault();
  }
  if (k === "s" || e.key === "ArrowDown") {
    keys.down = true;
    e.preventDefault();
  }
  if (k === "a" || e.key === "ArrowLeft") {
    keys.left = true;
    e.preventDefault();
  }
  if (k === "d" || e.key === "ArrowRight") {
    keys.right = true;
    e.preventDefault();
  }

  // Interact (optional convenience): Space or E
  if ((k === "e" || e.key === " ") && scene !== "waterTest") {
    const interactBtn = document.getElementById("interact");
    if (interactBtn) interactBtn.click();
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || e.key === "ArrowUp") keys.up = false;
  if (k === "s" || e.key === "ArrowDown") keys.down = false;
  if (k === "a" || e.key === "ArrowLeft") keys.left = false;
  if (k === "d" || e.key === "ArrowRight") keys.right = false;
});

// -------------------------------
// JOYSTICK (touch)
// -------------------------------
let joystick = {
  active: false,
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
};

function getTouchPos(touch) {
  const r = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - r.left,
    y: touch.clientY - r.top,
  };
}

canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const p = getTouchPos(t);
    joystick.active = true;
    joystick.x = p.x;
    joystick.y = p.y;
    joystick.dx = 0;
    joystick.dy = 0;
  },
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!joystick.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const p = getTouchPos(t);
    joystick.dx = p.x - joystick.x;
    joystick.dy = p.y - joystick.y;
  },
  { passive: false }
);

canvas.addEventListener("touchend", () => {
  joystick.active = false;
  joystick.dx = joystick.dy = 0;
});

// -------------------------------
// WATER TEST STATE (Chlorine + pH)
// -------------------------------
let waterTest = {
  active: false,
  mode: "cl", // 'cl' | 'ph'
  // Chlorine sub-state
  cl: {
    step: 0, // 0=not started, 1=after fill, 2=after 0001+0002, 3=done
    filled: false, // vial filled to CL line (¾)
    drops0001: 0,
    drops0002: 0,
    drops0003: 0,
    vialColor: "#9bd7ff",
  },
  // pH sub-state
  ph: {
    filled: false, // full vial to the line
    phenol: false, // phenol red added (0.5 mL)
    vialColor: "#9bd7ff", // water color before reagent
    result: null, // e.g., 7.4
  },
  message: "",
};

// pH comparator swatches (Taylor reagent light stand style approximation)
const PH_SWATCHES = [
  { val: 7.0, color: "#f2e14b" }, // yellow
  { val: 7.2, color: "#f7b844" }, // yellow-orange
  { val: 7.4, color: "#f48b52" }, // orange
  { val: 7.6, color: "#e75a5a" }, // red
  { val: 7.8, color: "#d95483" }, // pink-red
  { val: 8.2, color: "#c14fa3" }, // magenta
];

// -------------------------------
// OLAF (AI WRAPPER) — STATE & UI
// -------------------------------
const olaf = {
  panelOpen: false,
  messages: [],
  isTyping: false,
};

// UI refs
const olafToggleBtn = document.getElementById("olafToggle");
const olafPanel = document.getElementById("olafPanel");
const olafFeed = document.getElementById("olafFeed");
const olafInput = document.getElementById("olafInput");
const olafSend = document.getElementById("olafSend");
const olafClose = document.getElementById("olafClose");

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
      setTimeout(
        () => olafToggleBtn && olafToggleBtn.classList.remove("olaf-cta"),
        1400
      );
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
    mode: waterTest.mode,
    cl: { ...waterTest.cl },
    ph: { ...waterTest.ph },
    player: { x: player.x, y: player.y },
  };
}

// RULE-BASED fallback brain (works offline)
function olafLocalReply(text) {
  const t = (text || "").toLowerCase().trim();
  const ctx2 = getOlafContext();

  if (/hello|hi|hey|what can you do/.test(t)) {
    return "Hi! I’m Olaf ☃️. I can guide you through the orientation, explain the water tests, and give hints. Try: “how do I finish the chlorine test?” or “how do I run the pH test?”.";
  }

  if (/ph|phenol|red|light stand|comparator/.test(t)) {
    if (!ctx2.ph.filled) return "For pH, fill the **full vial to the line** first.";
    if (!ctx2.ph.phenol) return "Add **0.5 mL phenol red**. The color changes; match it against the Taylor comparator to read pH.";
    return `Your demo shows ≈ **${ctx2.ph.result?.toFixed(1) ?? "7.4"} pH**. Match the vial color to the closest swatch under the light stand.`;
  }

  if (/water|test|chlorine|cl2|0001|0002|0003/.test(t)) {
    if (!ctx2.cl.filled) return "For chlorine, fill the **half vial to the CL line (¾ full)** first.";
    if (ctx2.cl.step === 1) {
      const need1 = Math.max(0, 5 - ctx2.cl.drops0001);
      const need2 = Math.max(0, 5 - ctx2.cl.drops0002);
      return `Add **5 drops each** of 0001 and 0002. Remaining: 0001=${need1}, 0002=${need2}.`;
    }
    if (ctx2.cl.step === 2) {
      const need3 = Math.max(0, 5 - ctx2.cl.drops0003);
      return `Good—light pink ≈ 2.0 PPM. Now add **5 drops of 0003** (remaining: ${need3}).`;
    }
    if (ctx2.cl.step >= 3) return "Darker pink ≈ 3.00 PPM. Press **Exit** to finish chlorine test.";
  }

  if (/switch.*ph|ph test/.test(t)) return "Tap **pH Test** in the buttons to switch modes.";
  if (/switch.*chlorine|cl2|chlorine test/.test(t)) return "Tap **Chlorine Test** to switch modes.";

  // Default scene tips
  if (ctx2.scene === "office") {
    return "Look around the office. Try picking up the 🔑 at the front desk, and visit the 💧 station to start the water tests. You can switch between **Chlorine** and **pH**.";
  }
  if (ctx2.scene === "pool") {
    return "Welcome to the pool! More minigames are coming soon. For now, explore or return to the office through the south edge.";
  }

  return "Need a hand? Ask about the **chlorine** or **pH** tests, where to go, or what the key does.";
}

// SERVER-BACKED LLM (Gemini) — falls back to local on error
async function olafLLM(userText) {
  try {
    const res = await fetch("/api/olaf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userText, context: getOlafContext() }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.reply === "string" && data.reply.trim()) {
        return data.reply.trim();
      }
    }
  } catch {}
  return null;
}

async function olafHandleSend() {
  if (!olafInput) return;
  const text = olafInput.value.trim();
  if (!text) return;
  olafInput.value = "";
  olafPush("user", text);
  olaf.isTyping = true;

  const llm = await olafLLM(text);
  const reply = llm || olafLocalReply(text);

  olaf.isTyping = false;
  olafPush("olaf", reply);
}

function olafOnboarding() {
  olafPush(
    "olaf",
    "🔑 You found the AI Key! I’m **Olaf** ☃️—your lifeguard guide. Tap the 💧 station to start **Chlorine** or switch to **pH** anytime."
  );
  setOlafVisibility(true);
}

// Wire Olaf UI
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
// Hotkey to toggle Olaf (H)
window.addEventListener("keydown", (e) => {
  if (isTypingInInput()) return;
  if (e.key.toLowerCase() === "h" && hasOlaf) {
    setOlafVisibility(!olaf.panelOpen);
  }
});

// Initialize Olaf button visibility on load
setOlafUnlocked(hasOlaf);
renderOlafFeed();

// -------------------------------
// DRAW HELPERS
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
// WATER TEST: HELPERS & UI
// -------------------------------
let waterTestInitialized = false;

function startWaterTest() {
  scene = "waterTest";
  waterTest.active = true;

  // Reset both modes when opening the first time in a session
  if (!waterTestInitialized) {
    waterTest.mode = "cl";
    resetCL();
    resetPH();
    waterTestInitialized = true;
  }

  waterTest.message =
    "Fill the half vial to the **CL line (¾ full)**, then add 5 drops each of 0001 and 0002.";
  updateWaterUI();

  if (hasOlaf) {
    olafPush(
      "olaf",
      "Tip: For chlorine, fill to the **¾ line**. For pH, switch mode and fill the **full vial to the line**, then add **0.5 mL phenol red**."
    );
    if (!olaf.panelOpen) setOlafVisibility(true);
  }
}

function exitWaterTest() {
  waterTest.active = false;
  scene = "office";
  waterTest.message = "";
  updateWaterUI();

  if (hasOlaf) {
    olafPush("olaf", "Great work! You can revisit the 💧 station anytime.");
  }
}

function resetCL() {
  waterTest.cl.step = 0;
  waterTest.cl.filled = false;
  waterTest.cl.drops0001 = 0;
  waterTest.cl.drops0002 = 0;
  waterTest.cl.drops0003 = 0;
  waterTest.cl.vialColor = "#9bd7ff";
}

function resetPH() {
  waterTest.ph.filled = false;
  waterTest.ph.phenol = false;
  waterTest.ph.vialColor = "#9bd7ff";
  waterTest.ph.result = null;
}

// Chlorine progression
function checkChlorineStep() {
  // After 5 drops of both 0001 and 0002:
  if (
    waterTest.cl.step === 1 &&
    waterTest.cl.drops0001 >= 5 &&
    waterTest.cl.drops0002 >= 5
  ) {
    waterTest.cl.step = 2;
    waterTest.cl.vialColor = "#f6b3c8"; // light pink ~ 2.0 PPM
    waterTest.message =
      "The vial turns **LIGHT PINK** (≈ 2.0 PPM).\nNow add **5 drops of 0003**.";

    if (hasOlaf) olafPush("olaf", "Good—light pink ≈ 2.0 PPM. Add 5 drops of 0003.");
  }

  // After 5 drops of 0003:
  if (waterTest.cl.step === 2 && waterTest.cl.drops0003 >= 5) {
    waterTest.cl.step = 3;
    waterTest.cl.vialColor = "#e05a89"; // darker pink ~ 3.00 PPM
    waterTest.message =
      "Color changes to **DARKER PINK** (≈ 3.00 PPM).\nTutorial complete! (Press Exit)";

    if (hasOlaf) olafPush("olaf", "All set—darker pink ≈ 3.00 PPM. Press Exit to finish!");
  }
}

// pH actions
function runPhenolReaction() {
  // Demo result: 7.4
  const result = 7.4;
  waterTest.ph.result = result;

  // Find closest swatch to result
  let closest = PH_SWATCHES[0];
  let bestDelta = Math.abs(PH_SWATCHES[0].val - result);
  for (const s of PH_SWATCHES) {
    const d = Math.abs(s.val - result);
    if (d < bestDelta) {
      bestDelta = d;
      closest = s;
    }
  }
  waterTest.ph.vialColor = closest.color;

  waterTest.message = `Added **0.5 mL phenol red**. The vial turns color.\nMatch against the Taylor light stand.\nDemo reading: ≈ **${result.toFixed(
    1
  )} pH**.`;
  if (hasOlaf)
    olafPush("olaf", `Your demo vial matches ≈ **${result.toFixed(1)} pH** on the comparator.`);
}

// Respect \n and wrap long lines within a given width
function wrapText(ctx2, text, x, y, maxWidth, lineHeight) {
  const paragraphs = String(text).split("\n");
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(" ");
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx2.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx2.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx2.fillText(line, x, y);
    y += lineHeight;
  }
}

// -------------------------------
// WATER TEST: DRAW OVERLAY (UPDATED)
// -------------------------------
function drawWaterTest() {
  ctx.save();

  // Ensure consistent text positioning regardless of prior draws (emoji etc.)
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 1;

  // draw office behind it so it feels like a station overlay
  drawOffice();

  // dark overlay
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // responsive panel sizing
  const margin = Math.round(Math.min(canvas.width, canvas.height) * 0.06);
  const px = margin;
  const py = margin;
  const pw = canvas.width - margin * 2;
  const ph = canvas.height - margin * 2;

  // panel with subtle shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  ctx.strokeStyle = "#222";
  ctx.strokeRect(px, py, pw, ph);

  // layout regions
  const headerH = 44;
  const footerH = 28;
  const innerPad = 18;
  const contentX = px + innerPad;
  const contentY = py + headerH;
  const contentW = pw - innerPad * 2;
  const contentH = ph - headerH - footerH;

  // two columns: left text, right vial visuals
  const rightW = Math.min(220, Math.round(contentW * 0.38));
  const leftW = contentW - rightW - 18;
  const leftX = contentX;
  const rightX = contentX + leftW + 18;

  // fonts scale gently with panel width
  const titleSize = Math.max(16, Math.min(22, Math.round(pw * 0.04)));
  const bodySize = Math.max(12, Math.min(16, Math.round(pw * 0.028)));

  // title
  ctx.fillStyle = "#111";
  ctx.font = `bold ${titleSize}px sans-serif`;
  const modeTitle =
    waterTest.mode === "cl" ? "Chlorine (Cl₂) Test" : "pH Test (Phenol Red)";
  ctx.fillText(`💧 Water Test Tutorial — ${modeTitle}`, px + innerPad, py + 30);

  // instructions text (wrap inside left column)
  ctx.font = `${bodySize}px sans-serif`;
  ctx.fillStyle = "#111";
  wrapText(ctx, waterTest.message, leftX, contentY + 8, leftW, Math.round(bodySize * 1.3));

  // right column: vial sizing based on available height
  const vialW = Math.min(90, Math.round(rightW * 0.48));
  const vialH = Math.min(240, Math.round(contentH * 0.62));
  const vx = rightX + Math.round((rightW - vialW) / 2);
  const vy = contentY + 14;

  // vial outline
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  ctx.strokeRect(vx, vy, vialW, vialH);

  // marker line(s)
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (waterTest.mode === "cl") {
    const clLineY = vy + vialH * (1 - 0.75); // ¾ full line
    ctx.moveTo(vx, clLineY);
    ctx.lineTo(vx + vialW, clLineY);
  } else {
    const phLineY = vy + vialH * (1 - 0.9); // full line near top
    ctx.moveTo(vx, phLineY);
    ctx.lineTo(vx + vialW, phLineY);
  }
  ctx.stroke();

  // fill level
  let fillHeight = 0;
  if (waterTest.mode === "cl") {
    if (waterTest.cl.filled) fillHeight = vialH * 0.75;
    ctx.fillStyle = waterTest.cl.vialColor;
  } else {
    if (waterTest.ph.filled) fillHeight = vialH * 0.9;
    ctx.fillStyle = waterTest.ph.vialColor;
  }
  ctx.fillRect(vx + 3, vy + vialH - fillHeight, vialW - 6, fillHeight);

  // vial label
  ctx.fillStyle = "#111";
  ctx.font = `${Math.max(12, bodySize - 2)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Vial", vx + vialW / 2, vy + vialH + 18);
  ctx.textAlign = "left";

  // chlorine counters (kept inside left column)
  if (waterTest.mode === "cl") {
    const counterY = contentY + Math.round(contentH * 0.55);
    ctx.font = `${Math.max(12, bodySize - 2)}px monospace`;
    ctx.fillStyle = "#111";
    ctx.fillText(`0001: ${waterTest.cl.drops0001}/5`, leftX, counterY);
    ctx.fillText(`0002: ${waterTest.cl.drops0002}/5`, leftX, counterY + 22);
    ctx.fillText(`0003: ${waterTest.cl.drops0003}/5`, leftX, counterY + 44);
  }

  // pH comparator swatches (auto-wrap so it ALWAYS fits)
  if (waterTest.mode === "ph") {
    const labelY = contentY + Math.round(contentH * 0.55);
    ctx.font = `${Math.max(12, bodySize - 2)}px sans-serif`;
    ctx.fillStyle = "#111";
    ctx.fillText("Taylor Comparator", leftX, labelY);

    const swTop = labelY + 14;
    const gap = 6;

    // compute swatch width based on leftW and desired rows
    const maxPerRow = Math.max(3, Math.floor((leftW + gap) / (50 + gap)));
    const perRow = Math.min(PH_SWATCHES.length, maxPerRow);
    const swW = Math.min(50, Math.floor((leftW - gap * (perRow - 1)) / perRow));
    const swH = 26;

    // highlight index
    let highlightIndex = -1;
    if (waterTest.ph.result != null) {
      let minDelta = Infinity;
      for (let i = 0; i < PH_SWATCHES.length; i++) {
        const d = Math.abs(PH_SWATCHES[i].val - waterTest.ph.result);
        if (d < minDelta) {
          minDelta = d;
          highlightIndex = i;
        }
      }
    }

    ctx.font = "12px monospace";
    for (let i = 0; i < PH_SWATCHES.length; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;

      const x = leftX + col * (swW + gap);
      const y = swTop + row * (swH + 24);

      const s = PH_SWATCHES[i];
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, swW, swH);

      ctx.strokeStyle = i === highlightIndex ? "#222" : "#777";
      ctx.lineWidth = i === highlightIndex ? 3 : 1;
      ctx.strokeRect(x, y, swW, swH);

      ctx.fillStyle = "#111";
      ctx.fillText(s.val.toFixed(1), x + Math.max(6, Math.floor(swW * 0.22)), y + swH + 14);

      if (i === highlightIndex) {
        ctx.fillText("★", x + swW / 2 - 4, y - 4);
      }
    }
  }

  // footer hint
  ctx.font = `${Math.max(12, bodySize - 2)}px sans-serif`;
  ctx.fillStyle = "#111";
  ctx.fillText(
    "Use the buttons below. Switch between Chlorine and pH tests.",
    px + innerPad,
    py + ph - 10
  );

  ctx.restore();
}

// -------------------------------
// OFFICE SCENE
// -------------------------------
function drawOffice() {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      if (x === 0 || x === 19 || y === 0 || y === 14) {
        // North exit (gap at top between 9 and 10)
        if (!(y === 0 && x >= 9 && x <= 10)) {
          drawWall(x * TILE, y * TILE);
          continue;
        }
      }
      drawFloorTile(x * TILE, y * TILE);
    }
  }

  // Front desk
  ctx.fillStyle = "#3b2a1e";
  ctx.fillRect(4 * TILE, 3 * TILE, 4 * TILE, TILE);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(4 * TILE, 3 * TILE + TILE, 4 * TILE, 6);

  // Key
  if (!hasKey) {
    ctx.font = "20px serif";
    ctx.fillText("🔑", 5.7 * TILE, 3.8 * TILE);
  }

  // Water test station
  ctx.fillStyle = "#555";
  ctx.fillRect(10 * TILE, 3 * TILE, TILE * 1.5, TILE);
  ctx.font = "18px serif";
  ctx.fillText("💧", 10.5 * TILE, 3.8 * TILE);
}

// -------------------------------
// POOL SCENE
// -------------------------------
function drawPool() {
  ctx.fillStyle = "#bfe6ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pool water
  ctx.fillStyle = "#4aa3df";
  ctx.fillRect(2 * TILE, 2 * TILE, 16 * TILE, 8 * TILE);

  // Lane lines
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
// UI BUTTONS (water test tutorial)
// -------------------------------
const waterButtons = document.getElementById("waterTestButtons");

// Mode switchers
const btnModeCL = document.getElementById("modeCL");
const btnModePH = document.getElementById("modePH");

// Chlorine buttons
const btnFill = document.getElementById("fillVial");
const btn0001 = document.getElementById("drop0001");
const btn0002 = document.getElementById("drop0002");
const btn0003 = document.getElementById("drop0003");

// pH buttons
const btnPHFill = document.getElementById("phFillVial");
const btnAddPhenol = document.getElementById("addPhenol");

// Common
const btnExit = document.getElementById("exitTest");

// Show/hide helpers
function show(el, on) {
  if (el) el.style.display = on ? "" : "none";
}

function updateWaterUI() {
  if (!waterButtons) return;

  // show buttons only during minigame
  waterButtons.style.display = scene === "waterTest" ? "flex" : "none";
  if (scene !== "waterTest") return;

  // Mode switchers always visible
  show(btnModeCL, true);
  show(btnModePH, true);

  // Chlorine toggles
  const clOn = waterTest.mode === "cl";
  show(btnFill, clOn);
  show(btn0001, clOn);
  show(btn0002, clOn);
  show(btn0003, clOn);

  if (btnFill) btnFill.disabled = waterTest.cl.filled;

  const canDrop12 = waterTest.cl.filled && waterTest.cl.step >= 1;
  if (btn0001) btn0001.disabled = !canDrop12 || waterTest.cl.drops0001 >= 5;
  if (btn0002) btn0002.disabled = !canDrop12 || waterTest.cl.drops0002 >= 5;

  const canDrop3 = waterTest.cl.filled && waterTest.cl.step >= 2;
  if (btn0003) btn0003.disabled = !canDrop3 || waterTest.cl.drops0003 >= 5;

  // pH toggles
  const phOn = waterTest.mode === "ph";
  show(btnPHFill, phOn);
  show(btnAddPhenol, phOn);

  if (btnPHFill) btnPHFill.disabled = waterTest.ph.filled;
  if (btnAddPhenol) btnAddPhenol.disabled = !waterTest.ph.filled || waterTest.ph.phenol;

  // Exit always visible
  show(btnExit, true);
}

// Wire handlers if elements exist
if (btnModeCL) {
  btnModeCL.onclick = () => {
    if (scene !== "waterTest") return;
    waterTest.mode = "cl";
    if (waterTest.cl.step === 0 && !waterTest.cl.filled) {
      waterTest.message =
        "Fill the half vial to the **CL line (¾ full)**, then add 5 drops each of 0001 and 0002.";
    } else {
      waterTest.message = "Chlorine mode. Continue where you left off.";
    }
    updateWaterUI();
  };
}

if (btnModePH) {
  btnModePH.onclick = () => {
    if (scene !== "waterTest") return;
    waterTest.mode = "ph";
    if (!waterTest.ph.filled && !waterTest.ph.phenol) {
      waterTest.message =
        "For pH: Fill the **full vial to the line**. Then add **0.5 mL phenol red** and compare under the Taylor light stand.";
    } else if (waterTest.ph.filled && !waterTest.ph.phenol) {
      waterTest.message =
        "Add **0.5 mL phenol red** to the full vial, then compare to the color swatches.";
    } else {
      waterTest.message = `Demo reading: ≈ **${waterTest.ph.result?.toFixed(1) ?? "7.4"} pH**.`;
    }
    updateWaterUI();
  };
}

// Chlorine actions
if (btnFill) {
  btnFill.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "cl") return;
    waterTest.cl.filled = true;
    waterTest.cl.step = 1;
    waterTest.message = "Add **5 drops** of 0001 **and** **5 drops** of 0002.";
    updateWaterUI();
  };
}
if (btn0001) {
  btn0001.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "cl" || !waterTest.cl.filled) return;
    waterTest.cl.drops0001 = Math.min(5, waterTest.cl.drops0001 + 1);
    checkChlorineStep();
    updateWaterUI();
  };
}
if (btn0002) {
  btn0002.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "cl" || !waterTest.cl.filled) return;
    waterTest.cl.drops0002 = Math.min(5, waterTest.cl.drops0002 + 1);
    checkChlorineStep();
    updateWaterUI();
  };
}
if (btn0003) {
  btn0003.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "cl" || waterTest.cl.step < 2) return;
    waterTest.cl.drops0003 = Math.min(5, waterTest.cl.drops0003 + 1);
    checkChlorineStep();
    updateWaterUI();
  };
}

// pH actions
if (btnPHFill) {
  btnPHFill.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "ph") return;
    waterTest.ph.filled = true;
    waterTest.message =
      "Now add **0.5 mL phenol red**. Then match the color with the Taylor comparator.";
    updateWaterUI();
  };
}
if (btnAddPhenol) {
  btnAddPhenol.onclick = () => {
    if (scene !== "waterTest" || waterTest.mode !== "ph" || !waterTest.ph.filled) return;
    if (!waterTest.ph.phenol) {
      waterTest.ph.phenol = true;
      runPhenolReaction();
      updateWaterUI();
    }
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
        player.x > 4 * TILE &&
        player.x < 8 * TILE &&
        player.y > 3 * TILE &&
        player.y < 5 * TILE
      ) {
        if (!hasKey) {
          hasKey = true;
          setOlafUnlocked(true);
          olafOnboarding();
        }
      }

      // Water test station
      if (
        player.x > 10 * TILE &&
        player.x < 12 * TILE &&
        player.y > 3 * TILE &&
        player.y < 5 * TILE
      ) {
        startWaterTest();
      }
    }
  };
}

// -------------------------------
// PLAYER MOVEMENT HELPERS
// -------------------------------
function applyDeadzone(v, dz = 10) {
  return Math.abs(v) < dz ? 0 : v;
}

function clampPlayerToCanvas() {
  const r = player.size / 2;
  player.x = Math.max(r, Math.min(canvas.width - r, player.x));
  player.y = Math.max(r, Math.min(canvas.height - r, player.y));
}

function getMoveVector() {
  // Keyboard vector
  let kx = 0,
    ky = 0;
  if (keys.left) kx -= 1;
  if (keys.right) kx += 1;
  if (keys.up) ky -= 1;
  if (keys.down) ky += 1;

  // Joystick vector (normalized)
  const jx = applyDeadzone(joystick.dx);
  const jy = applyDeadzone(joystick.dy);

  // Prefer joystick when active and moved; otherwise keyboard
  if (joystick.active && (jx !== 0 || jy !== 0)) {
    const mag = Math.hypot(jx, jy) || 1;
    return { x: jx / mag, y: jy / mag };
  }

  // Keyboard normalization
  if (kx !== 0 || ky !== 0) {
    const mag = Math.hypot(kx, ky) || 1;
    return { x: kx / mag, y: ky / mag };
  }

  return { x: 0, y: 0 };
}

// -------------------------------
// PLAYER
// -------------------------------
function movePlayer() {
  if (scene === "waterTest") return; // freeze movement during minigame

  const v = getMoveVector();
  player.x += v.x * player.speed;
  player.y += v.y * player.speed;

  // Clamp to screen so you can't wander off canvas
  clampPlayerToCanvas();

  // Scene change
  if (scene === "office" && player.y <= player.size / 2) {
    scene = "pool";
    player.y = canvas.height - 40;
    if (hasOlaf) olafPush("olaf", "You’re at the pool! More activities coming soon.");
  }

  // Return to office from pool (south edge)
  if (scene === "pool" && player.y >= canvas.height - player.size / 2) {
    scene = "office";
    player.y = 40;
    if (hasOlaf) olafPush("olaf", "Back to the office. Find the 💧 station anytime.");
  }
}

function drawPlayer() {
  // IMPORTANT: save/restore so emoji alignment doesn't affect other drawings
  ctx.save();
  ctx.font = "28px serif"; // controls emoji size
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🛟", player.x, player.y);
  ctx.restore();
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

  // Keep player hidden under the overlay during tutorial
  if (scene !== "waterTest") {
    drawPlayer();
  }

  // UI (make sure alignment isn't inherited from emoji drawing)
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(VERSION, 8, 6);
  ctx.restore();

  updateWaterUI();
  requestAnimationFrame(loop);
}

loop();
