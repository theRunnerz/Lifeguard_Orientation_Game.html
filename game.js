// === Game State ===
let currentRoom = null;
let stepsCompleted = [];
let waterTestActive = false;

// Correct step order for water test
const correctSteps = [
  "Rinse the test vial",
  "Fill to the mark with pool water",
  "Add reagent drops",
  "Cap and shake gently",
  "Compare color with chart"
];

// === Room Data ===
const rooms = {
  lobby: {
    description: "You are in the lobby. You see doors leading to the Guard Office and the 6-lane Pool.",
    exits: { office: "office", pool: "pool" }
  },
  office: {
    description: "This is the Guard Office. There is a water test kit here.",
    exits: { lobby: "lobby" },
    actions: {
      "test water": () => startWaterTest()
    }
  },
  pool: {
    description: "You are at the 6-lane pool. The shallow end is here. The deep end is further north.",
    exits: { lobby: "lobby", deep: "deep", dive: "dive" }
  },
  deep: {
    description: "You are at the deep end of the pool. You see a ladder and a lifeguard chair.",
    exits: { pool: "pool" }
  },
  dive: {
    description: "You are at the dive tank. The springboard is here.",
    exits: { pool: "pool" }
  }
};

// === Water Test Mini-Game ===
function startWaterTest() {
  waterTestActive = true;
  stepsCompleted = [];
  display(`Water Test started! Perform the correct steps in order:`);
  displaySteps();
}

function displaySteps() {
  let stepList = correctSteps.map((step, i) => `${i + 1}. ${step}`).join("\n");
  display("Choose a step (type: do [step number]):\n" + stepList);
}

function doStep(stepNumber) {
  if (!waterTestActive) {
    display("There’s no water test in progress.");
    return;
  }

  const expectedStep = correctSteps[stepsCompleted.length];
  const chosenStep = correctSteps[stepNumber - 1];

  if (chosenStep === expectedStep) {
    stepsCompleted.push(chosenStep);
    display(`✅ Correct: ${chosenStep}`);
  } else {
    display(`❌ Wrong step. Try again.`);
    return;
  }

  if (stepsCompleted.length === correctSteps.length) {
    display("🎉 Water test complete! The chlorine and pH levels look perfect.");
    waterTestActive = false;
  } else {
    displaySteps();
  }
}

// === Game Engine ===
function move(direction) {
  if (waterTestActive) {
    display("Finish the water test before moving.");
    return;
  }

  if (currentRoom.exits[direction]) {
    currentRoom = rooms[currentRoom.exits[direction]];
    look();
  } else {
    display("You can’t go that way.");
  }
}

function look() {
  display(currentRoom.description);
  let exits = Object.keys(currentRoom.exits).join(", ");
  display("Exits: " + exits);

  if (currentRoom.actions) {
    let actions = Object.keys(currentRoom.actions).join(", ");
    display("Actions: " + actions);
  }
}

function doAction(action) {
  if (currentRoom.actions && currentRoom.actions[action]) {
    currentRoom.actions[action]();
  } else {
    display("You can’t do that here.");
  }
}

// === Display ===
function display(msg) {
  const output = document.getElementById("output");
  output.textContent += msg + "\n";
  output.scrollTop = output.scrollHeight;
}

// === Command Parser ===
function handleCommand(input) {
  const parts = input.trim().toLowerCase().split(" ");
  const command = parts[0];
  const arg = parts[1];

  if (command === "go") {
    move(arg);
  } else if (command === "look") {
    look();
  } else if (command === "do") {
    if (waterTestActive && !isNaN(arg)) {
      doStep(parseInt(arg));
    } else {
      doAction(parts.slice(1).join(" "));
    }
  } else {
    display("Unknown command.");
  }
}

// === Init ===
window.onload = () => {
  currentRoom = rooms.lobby;
  look();

  const form = document.getElementById("commandForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("command");
    const value = input.value;
    display("> " + value);
    handleCommand(value);
    input.value = "";
  });
};
