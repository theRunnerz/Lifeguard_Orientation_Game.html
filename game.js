const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const TILE = 32;

let room = "office";

const player = {
  x: 5 * TILE,
  y: 6 * TILE,
  w: 24,
  h: 24,
  vx: 0,
  vy: 0,
  speed: 2,
  facing: "down",
  hasKey: false
};

const officeObjects = [
  { id: "desk", x: 4, y: 4, w: 2, h: 1 },
  { id: "key", x: 5, y: 4, w: 1, h: 1, taken: false },
  { id: "water", x: 7, y: 4, w: 1, h: 1 }
];

let drops = { d1: 0, d2: 0, d3: 0 };

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(x, y, TILE, TILE);
}

function drawOffice() {
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) {
      drawTile(x * TILE, y * TILE, "#2a2a2a");
    }
  }

  officeObjects.forEach(o => {
    ctx.fillStyle = o.id === "desk" ? "#444" :
                    o.id === "water" ? "#335" : "#cc0";
    if (!o.taken)
      ctx.fillRect(o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE);
  });
}

function drawPlayer() {
  ctx.fillStyle = "#4af";
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

function update() {
  player.x += player.vx;
  player.y += player.vy;

  if (player.y < 0) {
    room = "pool";
    player.y = canvas.height - TILE * 2;
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (room === "office") drawOffice();
  if (room === "pool") {
    ctx.fillStyle = "#0a3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillText("POOL AREA (minigame next)", 20, 20);
  }

  drawPlayer();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

document.getElementById("interact").onclick = () => {
  officeObjects.forEach(o => {
    const px = player.x / TILE;
    const py = player.y / TILE;

    if (Math.abs(px - o.x) <= 1 && Math.abs(py - o.y) <= 1) {
      if (o.id === "key" && !o.taken) {
        o.taken = true;
        player.hasKey = true;
        alert("Picked up the key");
      }

      if (o.id === "water") {
        drops.d1 += 5;
        if (drops.d1 === 5) alert("Clear");
        if (drops.d1 === 10) alert("Light Pink (Free Cl₂)");
        if (drops.d1 === 15) alert("Darker Pink (Total Cl₂)");
      }
    }
  });
};

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") player.vy = -player.speed;
  if (e.key === "ArrowDown") player.vy = player.speed;
  if (e.key === "ArrowLeft") player.vx = -player.speed;
  if (e.key === "ArrowRight") player.vx = player.speed;
});

document.addEventListener("keyup", () => {
  player.vx = player.vy = 0;
});

loop();