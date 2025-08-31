/* Lifeguard Orientation Game — canvas map + fixed chemistry mini-game
   Works with your existing HTML (gameCanvas, chemModal, interactBtn, etc.)
*/

(() => {
  // ---------- Canvas & responsive sizing ----------
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const instructionsEl = document.getElementById("instructions");
  const interactBtn = document.getElementById("interactBtn");

  // Base design size; we scale to fit container
  const BASE_W = 960;
  const BASE_H = 600;
  let sx = 1, sy = 1, dpr = window.devicePixelRatio || 1;

  function fitCanvas() {
    const wrap = document.getElementById("game-wrap") || canvas.parentElement;
    const maxW = Math.min(980, wrap.clientWidth - 32);
    const w = Math.max(320, maxW);
    const h = Math.round(w * (BASE_H / BASE_W));

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    sx = canvas.width / BASE_W;
    sy = canvas.height / BASE_H;
    draw();
  }
  window.addEventListener("resize", fitCanvas);

  // ---------- World layout ----------
  const rooms = {
    frontDesk: { x: 40, y: 60, w: 170, h: 110, label: "Front Desk (Admissions)" },
    hotTub: { x: 720, y: 70, w: 140, h: 90, label: "Hot Tub", locked: true },
    steam: { x: 560, y: 70, w: 140, h: 90, label: "Steam Room", locked: true },
    office: { x: 40, y: 250, w: 180, h: 200, label: "Guard Office" },
    pool: { x: 290, y: 200, w: 420, h: 300, label: "Shallow / Deep End" },
    dive: { x: 770, y: 270, w: 130, h: 130, label: "Dive Tank", locked: true }
  };

  const hotspots = {
    key: { x: 58, y: 270, w: 80, h: 60, label: "Key", picked: false },
    incident: { x: 58, y: 350, w: 140, h: 60, label: "Incident Report" },
    waterTest: { x: 58, y: 420, w: 140, h: 60, label: "Water Test" },
    deskPC: { x: 60, y: 90, w: 120, h: 60, label: "Admissions PC" }
  };

  // pool lanes layout helper
  function drawLanes() {
    const { x, y, w, h } = rooms.pool;
    ctx.fillStyle = rgba("#87CEFA", 0.55);
    r(x, y, w, h, true);

    // 6 vertical lanes
    const lanes = 6;
    const gap = w / lanes;
    ctx.lineWidth = 2 * sx;
    ctx.strokeStyle = "#6bb3e8";
    for (let i = 1; i < lanes; i++) {
      const lx = x + i * gap;
      line(lx, y + 8, lx, y + h - 8);
    }

    // Shallow/Deep text
    ctx.fillStyle = "#2b3a42";
    smallText("Shallow End", x + w * 0.38, y + h * 0.40);
    smallText("Deep End", x + w * 0.41, y + h * 0.80);

    // A small diving board marker at bottom edge of main pool
    box(x + w * 0.44, y + h - 36, 60, 28);
    tinyText("Diving Board", x + w * 0.44 + 8, y + h - 18);
  }

  // ---------- Player ----------
  const player = {
    x: 260,
    y: 160,
    speed: 4, // logical pixels per tick
  };

  // simple bounds to keep player on canvas
  function clampPlayer() {
    player.x = Math.max(20, Math.min(BASE_W - 20, player.x));
    player.y = Math.max(40, Math.min(BASE_H - 20, player.y));
  }

  // ---------- Input ----------
  const keys = {};
  document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "e") interact();
  });
  document.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
  interactBtn.addEventListener("click", interact);

  // Swipe-to-move (simple)
  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  });
  canvas.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const len = Math.max(ax, ay);
    if (len > 24) {
      if (ax > ay) player.x += dx > 0 ? 40 : -40;
      else player.y += dy > 0 ? 40 : -40;
      clampPlayer();
      draw();
    }
    touchStart = null;
  });

  function moveTick() {
    const s = player.speed;
    if (keys["arrowup"] || keys["w"]) player.y -= s;
    if (keys["arrowdown"] || keys["s"]) player.y += s;
    if (keys["arrowleft"] || keys["a"]) player.x -= s;
    if (keys["arrowright"] || keys["d"]) player.x += s;
    clampPlayer();
  }

  // ---------- Utility draw helpers ----------
  function rgba(hex, alpha) {
    // supports #rrggbb
    const v = hex.replace("#", "");
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function r(x, y, w, h, fill) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    if (fill) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function box(x, y, w, h) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = rgba("#ffffff", 0.85);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function label(text, x, y) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = "#2b3a42";
    ctx.font = "14px system-ui, Arial";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function smallText(text, x, y) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = "#243238";
    ctx.font = "16px system-ui, Arial";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function tinyText(text, x, y) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = "#2b3a42";
    ctx.font = "12px system-ui, Arial";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function line(x1, y1, x2, y2) {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // ---------- Game state ----------
  let hasKey = false;
  let chemistryDone = false;

  function updateStatus() {
    if (!hasKey) {
      statusEl.textContent = "Objective: Pick up the key in the Guard Office (middle-left).";
    } else if (!chemistryDone) {
      statusEl.textContent = "Key collected! Do the Water Test in the Guard Office.";
    } else {
      statusEl.textContent = "Great! Explore the Hot Tub, Steam Room, and Dive Tank.";
    }
    instructionsEl.textContent = "Move: arrow keys / WASD or swipe. Interact: E or TAP the INTERACT button.";
  }

  // ---------- Interaction helpers ----------
  function pointInRect(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  function interact() {
    const p = { x: player.x, y: player.y };

    // Key
    if (!hasKey && !hotspots.key.picked && pointInRect(p.x, p.y, hotspots.key)) {
      hotspots.key.picked = true;
      hasKey = true;
      rooms.hotTub.locked = rooms.steam.locked = rooms.dive.locked = false;
      updateStatus();
      toast("🔑 Key collected! Hot Tub, Steam Room and Dive Tank unlocked.");
      draw();
      return;
    }

    // Water Test (inside office)
    if (pointInRect(p.x, p.y, hotspots.waterTest)) {
      openChemistryMiniGame();
      return;
    }

    // Incident Report placeholder
    if (pointInRect(p.x, p.y, hotspots.incident)) {
      toast("📝 Incident Report: (placeholder for future mini-game)");
      return;
    }

    // Admissions PC
    if (pointInRect(p.x, p.y, hotspots.deskPC)) {
      toast("💻 Sold an admission! (placeholder interaction)");
      return;
    }

    // Locked areas
    if (rooms.hotTub.locked && pointInRect(p.x, p.y, rooms.hotTub)) {
      toast("🔒 Hot Tub is locked. Grab the key in the Guard Office.");
      return;
    }
    if (rooms.steam.locked && pointInRect(p.x, p.y, rooms.steam)) {
      toast("🔒 Steam Room is locked. Grab the key in the Guard Office.");
      return;
    }
    if (rooms.dive.locked && pointInRect(p.x, p.y, rooms.dive)) {
      toast("🔒 Dive Tank is locked. Grab the key in the Guard Office.");
      return;
    }

    // Otherwise show a generic hint if near something recognizable
    toast("Nothing to interact with here.");
  }

  // simple toast
  let toastTimer = null;
  function toast(msg) {
    statusEl.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(updateStatus, 2500);
  }

  // ---------- Draw loop ----------
  function drawBackground() {
    // deck
    ctx.fillStyle = rgba("#cfefff", 0.8);
    ctx.save();
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.roundRect(20, 40, BASE_W - 40, BASE_H - 80, 18);
    ctx.fill();
    ctx.restore();
  }

  function drawRooms() {
    // generic room style
    ctx.lineWidth = 2 * sx;
    ctx.strokeStyle = "#606c76";
    ctx.fillStyle = rgba("#ffffff", 0.9);

    // Rooms
    Object.values(rooms).forEach((rm) => {
      ctx.fillStyle = rgba("#ffffff", 0.92);
      r(rm.x, rm.y, rm.w, rm.h, true);
      label(rm.label, rm.x + 10, rm.y + 18);
    });

    // Pool (custom)
    ctx.strokeStyle = "#5f6d7a";
    ctx.fillStyle = rgba("#bfe6ff", 0.8);
    r(rooms.pool.x, rooms.pool.y, rooms.pool.w, rooms.pool.h, true);
    drawLanes();

    // Hot tub water fill
    ctx.fillStyle = rgba("#b8e2ff", 0.9);
    r(rooms.hotTub.x + 8, rooms.hotTub.y + 28, rooms.hotTub.w - 16, rooms.hotTub.h - 40, true);

    // Steam room hatch fill
    ctx.fillStyle = rgba("#eaeaea", 0.9);
    r(rooms.steam.x + 8, rooms.steam.y + 28, rooms.steam.w - 16, rooms.steam.h - 40, true);

    // Dive tank water
    ctx.fillStyle = rgba("#a9dcff", 0.9);
    r(rooms.dive.x + 8, rooms.dive.y + 20, rooms.dive.w - 16, rooms.dive.h - 32, true);

    // Hotspot panels inside office & front desk
    box(hotspots.key.x, hotspots.key.y, hotspots.key.w, hotspots.key.h);
    tinyText(hotspots.key.picked ? "Key (Collected)" : "Key", hotspots.key.x + 10, hotspots.key.y + 24);

    box(hotspots.incident.x, hotspots.incident.y, hotspots.incident.w, hotspots.incident.h);
    tinyText("Incident Report", hotspots.incident.x + 10, hotspots.incident.y + 24);

    box(hotspots.waterTest.x, hotspots.waterTest.y, hotspots.waterTest.w, hotspots.waterTest.h);
    tinyText("Water Test", hotspots.waterTest.x + 10, hotspots.waterTest.y + 24);

    box(hotspots.deskPC.x, hotspots.deskPC.y, hotspots.deskPC.w, hotspots.deskPC.h);
    tinyText("Admissions PC", hotspots.deskPC.x + 8, hotspots.deskPC.y + 24);

    // lock tags
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = "#b23b3b";
    ctx.font = "bold 12px system-ui";
    if (rooms.hotTub.locked) ctx.fillText("LOCKED", rooms.hotTub.x + 10, rooms.hotTub.y + 18);
    if (rooms.steam.locked) ctx.fillText("LOCKED", rooms.steam.x + 10, rooms.steam.y + 18);
    if (rooms.dive.locked) ctx.fillText("LOCKED", rooms.dive.x + 10, rooms.dive.y + 18);
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.scale(sx, sy);
    ctx.fillStyle = "#1e91ff";
    ctx.strokeStyle = "#123c66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    moveTick();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawRooms();
    drawPlayer();
    requestAnimationFrame(draw);
  }

  // ---------- Chemistry mini-game (A/B/C answers, fixed flow) ----------
  const chemModal = document.getElementById("chemModal");
  const chemText = document.getElementById("chemText");
  const clFill = document.getElementById("clFill");
  const phFill = document.getElementById("phFill");
  const clReading = document.getElementById("clReading");
  const phReading = document.getElementById("phReading");
  const reagentRow = document.getElementById("reagentRow");
  const choices = document.getElementById("choices");
  const closeChem = document.getElementById("closeChem");

  const state = {
    added001: false,
    added002: false,
    added003: false,
    addedPR: false,
    free: null,
    total: null,
    combined: null,
    ph: null
  };

  function openChemistryMiniGame() {
    // reset state/UI every time it's opened
    Object.keys(state).forEach(k => (state[k] = (typeof state[k] === "boolean") ? false : null));
    chemText.textContent = "Start by adding 5 drops of Solution 001.";
    clFill.style.height = "0%";
    clFill.style.background = "#f7e26b";
    phFill.style.height = "0%";
    phFill.style.background = "#ffd28a";
    clReading.textContent = "Chlorine: —";
    phReading.textContent = "pH: —";
    choices.style.display = "none";
    closeChem.style.display = "none";
    chemModal.setAttribute("aria-hidden", "false");
    chemModal.style.display = "grid";
    setupReagentButtons();
  }

  function setupReagentButtons() {
    const btns = reagentRow.querySelectorAll("button");
    btns.forEach(btn => {
      const r = btn.dataset.reagent;
      btn.disabled = !(
        (r === "001" && !state.added001) ||
        (r === "002" && state.added001 && !state.added002) ||
        (r === "003" && state.added002 && !state.added003) ||
        (r === "PR"  && state.added003 && state.combined === 1 && !state.addedPR)
      );
      btn.onclick = () => addReagent(r);
    });
  }

  function addReagent(r) {
    switch (r) {
      case "001":
        state.added001 = true;
        clFill.style.height = "30%";
        chemText.textContent = "Good. Now add 5 drops of Solution 002.";
        break;

      case "002":
        if (!state.added001) return;
        state.added002 = true;
        clFill.style.height = "55%";
        // Ask FREE chlorine
        askChoices(
          "What is the Free Chlorine reading?",
          ["A) 1 ppm", "B) 2 ppm", "C) 5 ppm"],
          1,
          () => {
            state.free = 2;
            clReading.textContent = "Chlorine: Free = 2 ppm";
            chemText.textContent = "Great. Now add 5 drops of Solution 003.";
          }
        );
        break;

      case "003":
        if (!state.added002) return;
        state.added003 = true;
        clFill.style.height = "80%";
        // Ask TOTAL chlorine
        askChoices(
          "After 003, what's the Total Chlorine?",
          ["A) 2 ppm", "B) 3 ppm", "C) 6 ppm"],
          1,
          () => {
            state.total = 3;
            clReading.textContent = "Chlorine: Total = 3 ppm";
            // Ask COMBINED
            askChoices(
              "Combined Chlorine is Total − Free. What's the value?",
              ["A) 0 ppm", "B) 1 ppm", "C) 5 ppm"],
              1,
              () => {
                state.combined = 1;
                chemText.textContent = "Correct! Now add 0.5 ml Phenol Red for pH.";
              }
            );
          }
        );
        break;

      case "PR":
        if (!(state.added003 && state.combined === 1)) return;
        state.addedPR = true;
        phFill.style.height = "60%";
        phFill.style.background = "#ffb65c";
        // Ask pH
        askChoices(
          "What is the pH reading?",
          ["A) 6.8", "B) 7.2", "C) 8.0"],
          1,
          () => {
            state.ph = 7.2;
            phReading.textContent = "pH: 7.2";
            showChemSummary();
            chemistryDone = true;
            updateStatus();
          }
        );
        break;
    }
    setupReagentButtons();
  }

  function askChoices(question, labels, correctIndex, onCorrect) {
    chemText.textContent = question;
    choices.innerHTML = "";
    labels.forEach((label, i) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = label;
      btn.onclick = () => {
        if (i === correctIndex) {
          btn.classList.add("ok");
          setTimeout(() => btn.classList.remove("ok"), 250);
          onCorrect && onCorrect();
          choices.style.display = "none";
          setupReagentButtons(); // ensure next button unlocks
        } else {
          btn.classList.add("bad");
          setTimeout(() => btn.classList.remove("bad"), 300);
          chemText.textContent = "Not quite. Try again.";
        }
      };
      choices.appendChild(btn);
    });
    choices.style.display = "flex";
  }

  function showChemSummary() {
    chemText.innerHTML = `
      ✅ Test complete!<br>
      <strong>Results</strong><br>
      • Free Chlorine = ${state.free} ppm<br>
      • Total Chlorine = ${state.total} ppm<br>
      • Combined Chlorine = ${state.combined} ppm<br>
      • pH = ${state.ph}
    `;
    closeChem.style.display = "inline-block";
  }

  closeChem.addEventListener("click", () => {
    chemModal.style.display = "none";
    chemModal.setAttribute("aria-hidden", "true");
  });

  // Escape closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chemModal.style.display === "grid") {
      chemModal.style.display = "none";
      chemModal.setAttribute("aria-hidden", "true");
    }
  });

  // ---------- Boot ----------
  updateStatus();
  fitCanvas();
})();
