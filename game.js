const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const interactBtn = document.getElementById("interactBtn");
const objectiveText = document.getElementById("objective");

/* ---------------- PLAYER ---------------- */
const player = {
  x: 80,
  y: 250,
  size: 18,
  speed: 5,
  hasKey: false
};

/* ---------------- ROOMS ---------------- */
const rooms = [
  {
    name: "Guard Office",
    x: 40,
    y: 180,
    w: 160,
    h: 140,
    interact: () => {
      if (!player.hasKey) {
        player.hasKey = true;
        alert("✅ You picked up the MASTER KEY!");
        objectiveText.textContent =
          "Objective: Explore the facility.";
      }
    }
  },
  {
    name: "Water Test Station",
    x: 40,
    y: 120,
    w: 160,
    h: 40,
    interact: () => {
      alert(
        "🧪 Water Test Complete:\n\n" +
        "• Chlorine: OK\n" +
        "• pH: OK\n" +
        "• Alkalinity: OK"
      );
    }
  },
  {
    name: "6-Lane Pool\nShallow → Deep",
    x: 260,
    y: 180,
    w: 360,
    h: 140
  },
  {
    name: "Hot Tub",
    x: 260,
    y: 80,
    w: 120,
    h: 60
  },
  {
    name: "Steam Room",
    x: 400,
    y: 80,
    w: 120,
    h: 60
  },
  {
    name: "Dive Tank",
    x: 660,
    y: 200,
    w: 140,
    h: 120
  }
];

/* ---------------- DRAW ---------------- */
function drawRoom(room) {
  ctx.fillStyle = "#cfe8ff";
  ctx.fillRect(room.x, room.y, room.w, room.h);
  ctx.strokeRect(room.x, room.y, room.w, room.h);

  ctx.fillStyle = "#000";
  ctx.font = "12px Arial";
  ctx.fillText(room.name, room.x + 5, room.y + 15);
}

function drawPlayer() {
  ctx.fillStyle = player.hasKey ? "#2ecc71" : "#e74c3c";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  rooms.forEach(drawRoom);
  drawPlayer();

  requestAnimationFrame(draw);
}

/* ---------------- INPUT ---------------- */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") player.y -= player.speed;
  if (e.key === "ArrowDown") player.y += player.speed;
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
});

interactBtn.addEventListener("click", () => {
  for (const room of rooms) {
    if (
      player.x > room.x &&
      player.x < room.x + room.w &&
      player.y > room.y &&
      player.y < room.y + room.h &&
      room.interact
    ) {
      room.interact();
      return;
    }
  }
  alert("❌ Nothing to interact with here.");
});

/* ---------------- START GAME ---------------- */
draw();
