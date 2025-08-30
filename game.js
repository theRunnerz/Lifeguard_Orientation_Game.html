/* Responsive canvas map + interactions
   - map is drawn procedurally so you don't need an external PNG
   - guard office (middle-left) contains key, incident report, and water-test
   - front desk top-left with computer
   - pool centered-right with 6 lanes; shallow & deep ends labelled
   - hot tub & steam room at the top (locked until key)
   - separate dive tank middle-right (locked until key)
   - chemistry mini-game integrated (same flow as before)
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const interactBtn = document.getElementById('interactBtn');

// modal elements (chemistry)
const chemModal = document.getElementById('chemModal');
const chemText = document.getElementById('chemText');
const clFill = document.getElementById('clFill');
const phFill = document.getElementById('phFill');
const clReading = document.getElementById('clReading');
const phReading = document.getElementById('phReading');
const reagentRow = document.getElementById('reagentRow');
const choices = document.getElementById('choices');
const closeChem = document.getElementById('closeChem');

// map layout variables (computed each resize)
let layout = {};

// player
let player = { x: 60, y: 60, r: 10, speed: 3 };

// state
let keys = {}, keyCollected = false;
let chemistryTaskComplete = false;
let admissionSold = false;

// chemistry mini-state (reused)
const chemState = {
  added001:false, added002:false, askedFree:false,
  added003:false, askedTotal:false, askedCombined:false,
  addedPR:false, askedPH:false
};

// handle resize to keep canvas full of container
function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  computeLayout();
  draw();
}
window.addEventListener('resize', resize);
resize(); // initial

// compute layout rectangles (based on canvas size)
function computeLayout(){
  const W = canvas.width, H = canvas.height;
  const margin = Math.max(16, Math.round(W*0.03));

  // big pool on center-right
  const poolW = Math.round(W*0.48);
  const poolH = Math.round(H*0.62);
  const poolX = Math.round(W*0.42);
  const poolY = Math.round(H*0.16);

  // top-left front desk
  const deskW = Math.round(W*0.22);
  const deskH = Math.round(H*0.14);
  const deskX = margin;
  const deskY = margin;

  // middle-left guard office
  const officeW = Math.round(W*0.22);
  const officeH = Math.round(H*0.28);
  const officeX = margin;
  const officeY = Math.round(H*0.28);

  // subdivisions in office: key, incident report, water test
  const subH = Math.round(officeH/3);

  // hot tub & steam at TOP (above pool, top area)
  const hotW = Math.min( Math.round(W*0.12), 120);
  const hotH = Math.round(H*0.10);
  const hotX = Math.round(poolX + poolW - hotW - 8);
  const hotY = Math.round(margin);

  const steamW = hotW;
  const steamH = hotH;
  const steamX = hotX - steamW - 12;
  const steamY = hotY;

  // dive tank middle-right (separate square)
  const diveW = Math.round(W*0.12);
  const diveH = Math.round(H*0.16);
  const diveX = Math.round(poolX + poolW + 8);
  const diveY = Math.round(poolY + poolH*0.28);

  // diving board location near pool bottom center-right
  const boardX = poolX + Math.round(poolW*0.06);
  const boardY = poolY + poolH - Math.round(poolH*0.06);

  layout = {
    W, H, margin,
    pool: { x:poolX, y:poolY, w:poolW, h:poolH },
    desk: { x:deskX, y:deskY, w:deskW, h:deskH },
    office: { x:officeX, y:officeY, w:officeW, h:officeH },
    office_subs: {
      key: { x: officeX + 8, y: officeY + 8, w: officeW - 16, h: subH - 12 },
      incident: { x: officeX + 8, y: officeY + 8 + subH, w: officeW - 16, h: subH - 12 },
      water: { x: officeX + 8, y: officeY + 8 + 2*subH, w: officeW - 16, h: subH - 12 }
    },
    hotTub: { x: hotX, y: hotY, w: hotW, h: hotH },
    steamRoom: { x: steamX, y: steamY, w: steamW, h: steamH },
    diveTank: { x: diveX, y: diveY, w: diveW, h: diveH },
    divingBoard: { x: boardX, y: boardY, w: Math.round(W*0.08), h: Math.round(H*0.06) }
  };

  // if player is off-canvas after resize, clamp
  player.x = Math.max(12, Math.min(canvas.width-12, player.x));
  player.y = Math.max(12, Math.min(canvas.height-12, player.y));
}

// draw helper
function rect(r, color, stroke='#000', radius=6){
  ctx.fillStyle = color; ctx.strokeStyle = stroke;
  roundRect(ctx, r.x, r.y, r.w, r.h, radius, true, true);
}
function label(text, x, y, size=14, align='center'){
  ctx.fillStyle = '#111'; ctx.font = `${size}px Arial`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// main draw
function draw(){
  // background (pool deck)
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#f6fbff';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Draw pool area
  const p = layout.pool;
  ctx.fillStyle = '#d6f0ff';
  roundRect(ctx, p.x, p.y, p.w, p.h, 12, true, true);
  // lane lines (6 lanes)
  ctx.strokeStyle = '#7ab6db'; ctx.lineWidth = 3;
  const laneW = p.w / 6;
  for(let i=1;i<6;i++){
    const lx = p.x + i*laneW;
    ctx.beginPath(); ctx.moveTo(lx, p.y+8); ctx.lineTo(lx, p.y+p.h-8); ctx.stroke();
  }
  // shallow / deep division (horizontal)
  ctx.fillStyle = 'rgba(255,255,255,0.0)';
  // label shallow/deep inside the pool
  label('Shallow End', p.x + p.w*0.5, p.y + p.h*0.25, 16);
  label('Deep End', p.x + p.w*0.5, p.y + p.h*0.75, 16);

  // Front desk (top-left)
  rect(layout.desk, '#fff', '#333');
  label('Front Desk\n(Admissions)', layout.desk.x + layout.desk.w/2, layout.desk.y + layout.desk.h/2, 14);

  // Guard office (middle-left)
  rect(layout.office, '#fff', '#333');
  label('Guard Office', layout.office.x + layout.office.w/2, layout.office.y + 14, 14);
  // office subsections
  const k = layout.office_subs.key;
  rect(k, '#fef9e6', '#333'); label('Key', k.x + k.w/2, k.y + k.h/2, 13);
  const inc = layout.office_subs.incident;
  rect(inc, '#fff', '#333'); label('Incident\nReport', inc.x + inc.w/2, inc.y + inc.h/2, 13);
  const wat = layout.office_subs.water;
  rect(wat, '#fff', '#333'); label('Water\nTest Station', wat.x + wat.w/2, wat.y + wat.h/2, 13);

  // Hot tub & Steam at TOP
  rect(layout.hotTub, '#cdefff', '#333'); label('Hot Tub', layout.hotTub.x + layout.hotTub.w/2, layout.hotTub.y + layout.hotTub.h/2, 12);
  rect(layout.steamRoom, '#fff', '#333'); label('Steam Room', layout.steamRoom.x + layout.steamRoom.w/2, layout.steamRoom.y + layout.steamRoom.h/2, 12);

  // Dive tank separate basin (middle-right)
  rect(layout.diveTank, '#cdefff', '#333'); label('Dive Tank', layout.diveTank.x + layout.diveTank.w/2, layout.diveTank.y + layout.diveTank.h/2, 13);
  // diving board near pool bottom
  rect(layout.divingBoard, '#eee', '#333'); label('Diving\nBoard', layout.divingBoard.x + layout.divingBoard.w/2, layout.divingBoard.y + layout.divingBoard.h/2, 12);

  // lock overlays if not keyCollected: tint locked zones
  if(!keyCollected){
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    // hot tub, steam, dive
    ctx.fillRect(layout.hotTub.x, layout.hotTub.y, layout.hotTub.w, layout.hotTub.h);
    ctx.fillRect(layout.steamRoom.x, layout.steamRoom.y, layout.steamRoom.w, layout.steamRoom.h);
    ctx.fillRect(layout.diveTank.x, layout.diveTank.y, layout.diveTank.w, layout.diveTank.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Locked', layout.hotTub.x + layout.hotTub.w/2, layout.hotTub.y + layout.hotTub.h/2);
    ctx.fillText('Locked', layout.steamRoom.x + layout.steamRoom.w/2, layout.steamRoom.y + layout.steamRoom.h/2);
    ctx.fillText('Locked', layout.diveTank.x + layout.diveTank.w/2, layout.diveTank.y + layout.diveTank.h/2);
  }

  // draw player
  ctx.fillStyle = '#ffb84d';
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle='#333'; ctx.lineWidth=1; ctx.stroke();

  // draw key icon if not collected (in office key rectangle center)
  if(!keyCollected){
    const keyRect = layout.office_subs.key;
    ctx.fillStyle = '#222'; ctx.font = 'bold 14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🔑', keyRect.x + keyRect.w/2, keyRect.y + keyRect.h/2);
  }

  // HUD small labels
  ctx.fillStyle = '#000'; ctx.font='12px Arial'; ctx.textAlign='left';
  ctx.fillText('Use E (or INTERACT) to interact', 8, canvas.height - 10);
}

// simple rectangle hit test
function insideRect(px, py, r){
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// movement
document.addEventListener('keydown', (ev) => {
  keys[ev.key] = true;
  if(ev.key === 'e' || ev.key === 'E') doInteract();
});
document.addEventListener('keyup', (ev) => { keys[ev.key] = false; });

let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  if(e.touches && e.touches[0]) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
canvas.addEventListener('touchmove', (e) => {
  if(!touchStart || !e.touches[0]) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  // move player proportionally (simple)
  player.x += dx * 0.08;
  player.y += dy * 0.08;
  touchStart = { x: t.clientX, y: t.clientY };
  clampPlayer();
  draw();
});
canvas.addEventListener('touchend', ()=>{ touchStart = null; });

interactBtn.addEventListener('click', doInteract);

// main loop for keyboard movement
function tick(){
  let moved = false;
  if(keys['ArrowUp'] || keys['w']) { player.y -= player.speed; moved = true; }
  if(keys['ArrowDown'] || keys['s']) { player.y += player.speed; moved = true; }
  if(keys['ArrowLeft'] || keys['a']) { player.x -= player.speed; moved = true; }
  if(keys['ArrowRight'] || keys['d']) { player.x += player.speed; moved = true; }
  clampPlayer();
  if(moved) draw();
  requestAnimationFrame(tick);
}
tick();

function clampPlayer(){
  player.x = Math.max(player.r+6, Math.min(canvas.width - player.r - 6, player.x));
  player.y = Math.max(player.r+6, Math.min(canvas.height - player.r - 6, player.y));
}

// Interaction handler: checks proximity to interactive objects
function doInteract(){
  // front desk
  const desk = layout.desk;
  if(dist(player.x, player.y, desk.x + desk.w/2, desk.y + desk.h/2) < 60){
    if(!admissionSold){
      admissionSold = true;
      statusEl.textContent = 'Admission sold: welcome! (Front Desk)';
      return;
    } else {
      statusEl.textContent = 'You already sold admission.';
      return;
    }
  }

  // guard office key
  const kRect = layout.office_subs.key;
  if(!keyCollected && dist(player.x, player.y, kRect.x + kRect.w/2, kRect.y + kRect.h/2) < 50){
    keyCollected = true;
    statusEl.textContent = 'Key collected! Hot Tub, Steam Room and Dive Tank unlocked.';
    draw();
    return;
  }

  // incident report station
  const inc = layout.office_subs.incident;
  if(dist(player.x, player.y, inc.x + inc.w/2, inc.y + inc.h/2) < 50){
    statusEl.textContent = 'You opened the Incident Report Station. (Simulated)';
    return;
  }

  // water test station -> open chemistry modal
  const wat = layout.office_subs.water;
  if(dist(player.x, player.y, wat.x + wat.w/2, wat.y + wat.h/2) < 50){
    openChemistryMiniGame();
    return;
  }

  // Hot tub (locked until key)
  const hot = layout.hotTub;
  if(dist(player.x, player.y, hot.x + hot.w/2, hot.y + hot.h/2) < 60){
    if(!keyCollected){ statusEl.textContent = 'Hot Tub is locked. Get the key from Guard Office.'; return; }
    statusEl.textContent = 'You relax at the Hot Tub (demo).';
    return;
  }

  // Steam room
  const steam = layout.steamRoom;
  if(dist(player.x, player.y, steam.x + steam.w/2, steam.y + steam.h/2) < 60){
    if(!keyCollected){ statusEl.textContent = 'Steam Room locked. Get the key first.'; return; }
    statusEl.textContent = 'Steam Room accessed (demo).';
    return;
  }

  // Dive tank (separate basin)
  const dive = layout.diveTank;
  if(dist(player.x, player.y, dive.x + dive.w/2, dive.y + dive.h/2) < 60){
    if(!keyCollected){ statusEl.textContent = 'Dive Tank locked. Get key from Guard Office.'; return; }
    statusEl.textContent = 'You access the Dive Tank. (Demo: try diving!)';
    return;
  }

  // Default
  statusEl.textContent = 'No interaction nearby.';
}

function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.sqrt(dx*dx + dy*dy); }

/* -----------------------
   Chemistry Mini-game (same flow you requested)
   ----------------------- */
function openChemistryMiniGame(){
  chemModal.style.display = 'grid';
  chemModal.setAttribute('aria-hidden','false');
  chemText.textContent = "Welcome! Start by adding 5 drops of Solution 001 to the chlorine vial.";
  setupReagentButtons();
  clFill.style.height='0%'; clFill.style.background='#f7e26b';
  phFill.style.height='0%'; phFill.style.background='#ffd28a';
  clReading.textContent='Chlorine: —'; phReading.textContent='pH: —';
  choices.style.display='none'; closeChem.style.display='none';
  // reset chem state
  Object.keys(chemState).forEach(k => chemState[k] = false);
}

function setupReagentButtons(){
  [...reagentRow.querySelectorAll('button')].forEach(btn=>{
    const r = btn.dataset.reagent;
    btn.disabled = !(
      (r==='001' && !chemState.added001)
      || (r==='002' && chemState.added001 && !chemState.added002)
      || (r==='003' && chemState.added002 && !chemState.added003)
      || (r==='PR'  && chemState.askedCombined && !chemState.addedPR)
    );
    btn.onclick = ()=> addReagent(r);
  });
}

function addReagent(r){
  if(r==='001'){
    chemState.added001=true;
    chemText.textContent = "Good. Now add 5 drops of Solution 002 to continue the Free Chlorine test.";
    clFill.style.height='30%';
  }
  if(r==='002' && chemState.added001){
    chemState.added002=true;
    clFill.style.height='55%';
    clReading.textContent='color developing...';
    chemText.textContent = "Color developed! What is the Free Chlorine reading?";
    askChoices("What is the Free Chlorine reading?", ["1 ppm","2 ppm","5 ppm"], 1, ()=>{ clReading.textContent='Free: 2 ppm'; chemState.askedFree=true; });
  }
  if(r==='003' && chemState.added002){
    chemState.added003=true;
    clFill.style.height='80%';
    chemText.textContent = "After adding 003, what is the Total Chlorine reading?";
    askChoices("What is the Total Chlorine reading?", ["2 ppm","3 ppm","6 ppm"], 1, ()=>{ clReading.textContent='Total: 3 ppm'; chemState.askedTotal=true; askCombined(); });
  }
  if(r==='PR' && chemState.askedCombined){
    chemState.addedPR=true;
    phFill.style.height='60%';
    phFill.style.background='#ffb65c';
    chemText.textContent="Phenol red added. What is the pH reading?";
    askChoices("What is the pH reading?", ["6.8","7.2","8.0"], 1, ()=>{ phReading.textContent='7.2 pH'; chemState.askedPH=true; finishChemistry(); });
  }
  setupReagentButtons();
}

function askCombined(){
  askChoices("Combined Chlorine is Total − Free. What's the value?", ["0 ppm","1 ppm","5 ppm"], 1, ()=>{ chemState.askedCombined=true; chemText.textContent='Correct! Now add 0.5 ml Phenol Red.'; });
}

function askChoices(question, labels, correctIndex, onCorrect){
  chemText.textContent = question;
  choices.innerHTML = '';
  labels.forEach((label, i)=>{
    const btn=document.createElement('button');
    btn.className='btn';
    btn.textContent = (i===0?'A) ':i===1?'B) ':'C) ') + label;
    btn.onclick = ()=>{
      if(i===correctIndex){
        flash(btn, true);
        onCorrect && onCorrect();
        choices.style.display='none';
      } else {
        flash(btn, false);
        chemText.textContent = 'Not quite right. Try again!';
      }
    };
    choices.appendChild(btn);
  });
  choices.style.display='flex';
}

function flash(btn, good){
  const cls = good? 'ok' : 'bad';
  btn.classList.add(cls);
  setTimeout(()=>btn.classList.remove(cls), 500);
}

function finishChemistry(){
  chemistryTaskComplete = true;
  statusEl.textContent = 'Chemistry test complete! Free 2 ppm · Total 3 ppm · Combined 1 ppm · pH 7.2';
  chemText.textContent = '✅ Good job. Close to continue orientation.';
  closeChem.style.display='inline-block';
}

closeChem.addEventListener('click', ()=>{ chemModal.style.display='none'; chemModal.setAttribute('aria-hidden','true'); });

// close on Escape
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && chemModal.style.display === 'grid') { chemModal.style.display='none'; chemModal.setAttribute('aria-hidden','true'); }
});

// initial draw
computeLayout();
draw();
