// --- Simple top-down map & player ---
const TILE = 16; // internal pixel tile (canvas is 320x320 => 20x20 tiles)
const MAP_W = 20, MAP_H = 20;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

// 0 floor, 1 wall, 2 water, 3 desk, etc
const map = [];
for(let y=0;y<MAP_H;y++){
  const row=[];
  for(let x=0;x<MAP_W;x++){
    const edge = (x===0||y===0||x===MAP_W-1||y===MAP_H-1);
    row.push(edge?1:0);
  }
  map.push(row);
}
// Add some interior walls to feel like a facility
for(let x=3;x<17;x++){ map[6][x]=1; } // horizontal wall
for(let y=2;y<15;y++){ map[y][12]=1; } // vertical wall

const player = {x:2, y:2, dir:'down'};
const npcChem = {x: 16, y: 3, color:'#2e6cff', name:'Test Station NPC'}; // blue NPC

let keys = {};
document.addEventListener('keydown', e=>{ keys[e.key]=true; if(e.key==='e' || e.key==='E'){ tryTalk(); }});
document.addEventListener('keyup', e=>{ keys[e.key]=false; });

let chemistryTaskComplete = false;

function canWalk(nx,ny){
  if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H) return false;
  return map[ny][nx]===0;
}

function update(){
  let nx = player.x, ny = player.y;
  if(keys['ArrowUp']) { ny--; player.dir='up'; }
  else if(keys['ArrowDown']) { ny++; player.dir='down'; }
  else if(keys['ArrowLeft']) { nx--; player.dir='left'; }
  else if(keys['ArrowRight']) { nx++; player.dir='right'; }
  if(canWalk(nx,ny)){ player.x=nx; player.y=ny; }
}

function drawTile(x,y,v){
  // floor
  ctx.fillStyle = '#7ad3ff'; // pool deck base
  ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
  // add checker light tiles
  if(((x+y)&1)===0){ ctx.fillStyle='#86dcff'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); }
  if(v===1){ ctx.fillStyle='#2a2a2a'; ctx.fillRect(x*TILE,y*TILE,TILE,TILE); }
}

function draw(){
  // map
  for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) drawTile(x,y,map[y][x]);

  // simple furniture (desk for NPC)
  ctx.fillStyle = '#c4a574';
  ctx.fillRect(npcChem.x*TILE-1, (npcChem.y+1)*TILE, TILE+2, TILE/2);

  // NPC
  ctx.fillStyle = npcChem.color;
  ctx.fillRect(npcChem.x*TILE, npcChem.y*TILE, TILE, TILE);

  // player
  ctx.fillStyle = '#ffce33';
  ctx.fillRect(player.x*TILE, player.y*TILE, TILE, TILE);

  // objective marker
  if(!chemistryTaskComplete){
    ctx.fillStyle = '#fff';
    ctx.fillRect(npcChem.x*TILE+5, npcChem.y*TILE-8, 6, 6);
  }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

function adjacent(ax,ay,bx,by){
  const dx=Math.abs(ax-bx), dy=Math.abs(ay-by);
  return (dx+dy===1);
}

function tryTalk(){
  if(adjacent(player.x,player.y,npcChem.x,npcChem.y)){
    openChemistryMiniGame();
  }
}

// --- Chemistry Mini-game ---
const chemModal = document.getElementById('chemModal');
const chemText = document.getElementById('chemText');
const clFill = document.getElementById('clFill');
const phFill = document.getElementById('phFill');
const clReading = document.getElementById('clReading');
const phReading = document.getElementById('phReading');
const reagentRow = document.getElementById('reagentRow');
const choices = document.getElementById('choices');
const closeChem = document.getElementById('closeChem');

const chemState = {
  added001:false,
  added002:false,
  askedFree:false,
  added003:false,
  askedTotal:false,
  askedCombined:false,
  addedPR:false,
  askedPH:false,
  correctCount:0
};

function openChemistryMiniGame(){
  chemModal.style.display='grid';
  chemText.textContent = "Welcome! Start by adding 5 drops of Solution 001 to the chlorine vial.";
  setupReagentButtons();
  clFill.style.height='0%'; clFill.style.background='#f7e26b';
  phFill.style.height='0%'; phFill.style.background='#ffd28a';
  clReading.textContent='Reading: —';
  phReading.textContent='Reading: —';
  choices.style.display='none';
  closeChem.style.display='none';
  // reset state
  Object.keys(chemState).forEach(k=>{ if(typeof chemState[k]==='boolean') chemState[k]=false; });
  chemState.correctCount=0;
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
    clReading.textContent='Reading: color developing...';
    chemText.textContent = "Color developed! What is the Free Chlorine reading?";
    askChoices(
      "What is the Free Chlorine reading?",
      ["1 ppm","2 ppm","5 ppm"],
      1,
      ()=>{ clReading.textContent='Reading: 2 ppm (Free)'; chemState.askedFree=true; }
    );
  }
  if(r==='003' && chemState.added002){
    chemState.added003=true;
    clFill.style.height='80%';
    chemText.textContent = "Great. After adding 003, what is the Total Chlorine reading?";
    askChoices(
      "What is the Total Chlorine reading?",
      ["2 ppm","3 ppm","6 ppm"],
      1,
      ()=>{ clReading.textContent='Reading: 3 ppm (Total)'; chemState.askedTotal=true; askCombined(); }
    );
  }
  if(r==='PR' && chemState.askedCombined){
    chemState.addedPR=true;
    phFill.style.height='60%';
    phFill.style.background='#ffb65c';
    chemText.textContent="Phenol red added. What is the pH reading?";
    askChoices(
      "What is the pH reading?",
      ["6.8","7.2","8.0"],
      1,
      ()=>{ phReading.textContent='Reading: 7.2 pH'; chemState.askedPH=true; finishChemistry(); }
    );
  }
  setupReagentButtons();
}

function askCombined(){
  askChoices(
    "Combined Chlorine is Total − Free. What's the value?",
    ["0 ppm","1 ppm","5 ppm"],
    1,
    ()=>{ chemState.askedCombined=true; chemText.textContent='Correct! Now test pH: add 0.5 ml Phenol Red.'; }
  );
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
  setTimeout(()=>btn.classList.remove(cls), 400);
}

function finishChemistry(){
  chemistryTaskComplete = true;
  statusEl.textContent = 'Level 1 complete ✔️  Next objective: Orientation NPC (coming next)';
  chemText.textContent = '✅ Great job! Results recorded: Free 2 ppm, Total 3 ppm, Combined 1 ppm, pH 7.2. You passed the chemistry test!';
  closeChem.style.display='inline-block';
}

closeChem.addEventListener('click', ()=>{ chemModal.style.display='none'; });

// Close modal with Escape
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && chemModal.style.display==='grid'){ chemModal.style.display='none'; }});
