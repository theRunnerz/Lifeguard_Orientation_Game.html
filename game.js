/* game.js
   Drop-in file that draws the map, handles player movement and interactions,
   and runs the fixed chemistry mini-game. Replace your old game.js with this.
*/

(() => {
  // Elements
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const instructionsEl = document.getElementById('instructions');
  const interactBtn = document.getElementById('interactBtn');

  // Chemistry modal elements
  const chemModal = document.getElementById('chemModal');
  const chemText = document.getElementById('chemText');
  const clFill = document.getElementById('clFill');
  const phFill = document.getElementById('phFill');
  const clReading = document.getElementById('clReading');
  const phReading = document.getElementById('phReading');
  const reagentRow = document.getElementById('reagentRow');
  const choicesDiv = document.getElementById('choices');
  const closeChem = document.getElementById('closeChem');

  // DPI & sizing
  function fitCanvas(){
    const dpr = window.devicePixelRatio || 1;
    const styleW = canvas.clientWidth || canvas.offsetWidth || 800;
    const styleH = canvas.clientHeight || Math.round(styleW * 10/16) || 500;
    canvas.width = Math.floor(styleW * dpr);
    canvas.height = Math.floor(styleH * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0); // draw in CSS px coordinates
    computeLayout();
    draw(); // initial draw
  }
  window.addEventListener('resize', fitCanvas);

  // Logical layout (computed from canvas client size)
  let layout = {};
  function computeLayout(){
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    // define areas (percent-based)
    layout.frontDesk = { x: W*0.04, y: H*0.04, w: W*0.22, h: H*0.12 };
    layout.guardOffice = { x: W*0.04, y: H*0.26, w: W*0.22, h: H*0.34 };
    layout.officeSubs = {
      key: { x: layout.guardOffice.x + 8, y: layout.guardOffice.y + 8, w: layout.guardOffice.w - 16, h: (layout.guardOffice.h/3)-10 },
      incident: { x: layout.guardOffice.x + 8, y: layout.guardOffice.y + 8 + (layout.guardOffice.h/3), w: layout.guardOffice.w - 16, h: (layout.guardOffice.h/3)-10 },
      water: { x: layout.guardOffice.x + 8, y: layout.guardOffice.y + 8 + (2*layout.guardOffice.h/3), w: layout.guardOffice.w - 16, h: (layout.guardOffice.h/3)-10 }
    };
    layout.pool = { x: W*0.30, y: H*0.18, w: W*0.48, h: H*0.62 };
    layout.steam = { x: W*0.62, y: H*0.04, w: W*0.12, h: H*0.12, locked:true };
    layout.hotTub = { x: W*0.75, y: H*0.04, w: W*0.12, h: H*0.12, locked:true };
    layout.dive = { x: W*0.80, y: layout.pool.y + layout.pool.h*0.22, w: W*0.12, h: H*0.18, locked:true };

    // hotspots also reference
    layout.hotspots = {
      key: layout.officeSubs.key,
      incident: layout.officeSubs.incident,
      waterTest: layout.officeSubs.water,
      deskPC: { x: layout.frontDesk.x + 8, y: layout.frontDesk.y + 10, w: layout.frontDesk.w-16, h: (layout.frontDesk.h - 18) }
    };
  }

  // player
  let player = { x: 120, y: 90, r: 8, speed: 3.5 };

  // state
  let hasKey = false;
  let chemistryDone = false;
  let toastTimer = null;

  // keyboard & touch
  const keys = {};
  document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if(e.key.toLowerCase()==='e') doInteract();
  });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  // touch swipe simple movement
  let tStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; tStart = { x: t.clientX, y: t.clientY };
  }, {passive:true});
  canvas.addEventListener('touchmove', (e) => {
    if(!tStart) return;
    const t = e.touches[0];
    const dx = t.clientX - tStart.x, dy = t.clientY - tStart.y;
    // move less (scale)
    player.x += dx * 0.06;
    player.y += dy * 0.06;
    tStart = { x: t.clientX, y: t.clientY };
    clampPlayer();
    draw();
  }, {passive:false});
  canvas.addEventListener('touchend', ()=> tStart = null);

  interactBtn.addEventListener('click', doInteract);

  // utility draw funcs
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }
  function fillRectLabel(x,y,w,h,fill,stroke,label,size=14){
    ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1;
    roundRect(ctx,x,y,w,h,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#223'; ctx.font = `${size}px system-ui, Arial`; ctx.textAlign = 'left'; ctx.textBaseline='top';
    const lines = (label||'').split('\n');
    let ty = y + 6;
    lines.forEach(ln => { ctx.fillText(ln, x+8, ty); ty += size + 2; });
  }

  function drawPool(){
    const p = layout.pool;
    fillRectLabel(p.x, p.y, p.w, p.h, '#dff4ff','#3aa', '6-Lane Pool\n(25 m)', 16);
    // lane separators (5 lines = 6 lanes)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6bb3d9';
    const laneW = p.w / 6;
    for(let i=1;i<6;i++){
      const lx = p.x + i*laneW;
      ctx.beginPath(); ctx.moveTo(lx, p.y+8); ctx.lineTo(lx, p.y + p.h - 8); ctx.stroke();
    }
    // labels shallow & deep
    ctx.fillStyle = '#123';
    ctx.font = 'bold 14px system-ui, Arial'; ctx.textAlign='center';
    ctx.fillText('Shallow End', p.x + p.w*0.5, p.y + p.h*0.22);
    ctx.fillText('Deep End', p.x + p.w*0.5, p.y + p.h*0.78);
  }

  function drawMap(){
    // background deck
    ctx.fillStyle = '#f0fbff'; ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);

    // front desk
    fillRectLabel(layout.frontDesk.x, layout.frontDesk.y, layout.frontDesk.w, layout.frontDesk.h, '#fff','#333','Front Desk\n(Admissions)',13);

    // guard office and subs
    fillRectLabel(layout.guardOffice.x, layout.guardOffice.y, layout.guardOffice.w, layout.guardOffice.h, '#fff','#333','Guard Office',14);
    // office subsections
    const k = layout.officeSubs.key;
    fillRectLabel(k.x, k.y, k.w, k.h, '#fff9e6','#333', hasKey ? 'Key (Collected)' : 'Key',12);
    const inc = layout.officeSubs.incident;
    fillRectLabel(inc.x, inc.y, inc.w, inc.h, '#fff','#333','Incident Report',12);
    const wat = layout.officeSubs.water;
    fillRectLabel(wat.x, wat.y, wat.w, wat.h, '#fff','#333','Water Test Station',12);

    // pool
    drawPool();

    // hot tub & steam (top area)
    fillRectLabel(layout.steam.x, layout.steam.y, layout.steam.w, layout.steam.h, layout.steam.locked ? '#eee' : '#dff2ff', '#333','Steam Room',12);
    fillRectLabel(layout.hotTub.x, layout.hotTub.y, layout.hotTub.w, layout.hotTub.h, layout.hotTub.locked ? '#eee' : '#dff2ff','#333','Hot Tub',12);

    // dive tank
    fillRectLabel(layout.dive.x, layout.dive.y, layout.dive.w, layout.dive.h, layout.dive.locked ? '#eee' : '#dff2ff','#333','Dive Tank',12);

    // show locked overlays if locked
    if(layout.hotTub.locked || layout.steam.locked || layout.dive.locked){
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      if(layout.hotTub.locked) ctx.fillRect(layout.hotTub.x, layout.hotTub.y, layout.hotTub.w, layout.hotTub.h);
      if(layout.steam.locked) ctx.fillRect(layout.steam.x, layout.steam.y, layout.steam.w, layout.steam.h);
      if(layout.dive.locked) ctx.fillRect(layout.dive.x, layout.dive.y, layout.dive.w, layout.dive.h);
      ctx.fillStyle = '#fff'; ctx.font='bold 12px system-ui'; ctx.textAlign='center';
      if(layout.hotTub.locked) ctx.fillText('LOCKED', layout.hotTub.x + layout.hotTub.w/2, layout.hotTub.y + layout.hotTub.h/2);
      if(layout.steam.locked) ctx.fillText('LOCKED', layout.steam.x + layout.steam.w/2, layout.steam.y + layout.steam.h/2);
      if(layout.dive.locked) ctx.fillText('LOCKED', layout.dive.x + layout.dive.w/2, layout.dive.y + layout.dive.h/2);
    }

    // small labels/hints
    ctx.fillStyle = '#333'; ctx.font='12px system-ui'; ctx.textAlign='left';
    ctx.fillText('Tip: INTERACT to pick up key / open water test', 8, canvas.clientHeight - 8);
  }

  function drawPlayer(){
    ctx.beginPath(); ctx.fillStyle = '#ffb84d';
    ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth=1; ctx.stroke();
  }

  function draw(){
    // movement tick
    if(keys['arrowup'] || keys['w']) player.y -= player.speed;
    if(keys['arrowdown'] || keys['s']) player.y += player.speed;
    if(keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if(keys['arrowright'] || keys['d']) player.x += player.speed;
    clampPlayer();

    // clear & draw
    ctx.clearRect(0,0,canvas.width/ (window.devicePixelRatio||1), canvas.height/ (window.devicePixelRatio||1));
    drawMap();
    drawPlayer();
    requestAnimationFrame(draw);
  }

  function clampPlayer(){
    const margin = 8;
    player.x = Math.max(margin, Math.min(canvas.clientWidth - margin, player.x));
    player.y = Math.max(margin + 20, Math.min(canvas.clientHeight - margin - 6, player.y));
  }

  // proximity test
  function nearRect(px,py,r,range=48){
    const cx = r.x + r.w/2, cy = r.y + r.h/2;
    const dx = px - cx, dy = py - cy;
    return Math.sqrt(dx*dx + dy*dy) < range;
  }

  // toast status message
  function toast(msg, timeout=2200){
    statusEl.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(updateStatus, timeout);
  }

  function updateStatus(){
    if(!hasKey) statusEl.textContent = 'Objective: Pick up the key in the Guard Office (middle-left).';
    else if(!chemistryDone) statusEl.textContent = 'Key collected — do the Water Test at the Guard Office.';
    else statusEl.textContent = 'Orientation step complete — explore the facility!';
    instructionsEl.textContent = 'Move: arrows / WASD or swipe. Interact: E or INTERACT button.';
  }

  function doInteract(){
    // check key hotspot
    if(!hasKey && nearRect(player.x, player.y, layout.hotspots.key, 60)){
      hasKey = true;
      layout.hotTub.locked = layout.steam.locked = layout.dive.locked = false;
      layout.hotspots.key.picked = true;
      toast('🔑 Key collected! Areas unlocked.');
      updateStatus();
      return;
    }

    // water test
    if(nearRect(player.x, player.y, layout.hotspots.waterTest, 56)){
      openChemistryMiniGame();
      return;
    }

    // incident
    if(nearRect(player.x, player.y, layout.hotspots.incident, 56)){
      toast('📝 Incident Report (demo): record details here.');
      return;
    }

    // front desk PC
    if(nearRect(player.x, player.y, layout.hotspots.deskPC, 60)){
      toast('💻 Admission sold (demo).');
      return;
    }

    // locked areas messages
    if(nearRect(player.x, player.y, layout.hotTub, 70) && layout.hotTub.locked){
      toast('🔒 Hot Tub locked — collect key.');
      return;
    }
    if(nearRect(player.x, player.y, layout.steam, 70) && layout.steam.locked){
      toast('🔒 Steam Room locked — collect key.');
      return;
    }
    if(nearRect(player.x, player.y, layout.dive, 80) && layout.dive.locked){
      toast('🔒 Dive Tank locked — collect key.');
      return;
    }

    toast('Nothing to interact with here.');
  }

  // ---------------- Chemistry Mini-game ----------------
  const chemState = {
    added001:false, added002:false, added003:false, addedPR:false,
    free:null, total:null, combined:null, ph:null
  };

  function setupReagentButtons(){
    const btns = reagentRow.querySelectorAll('button');
    btns.forEach(b=>{
      const r = b.dataset.reagent;
      // enable only allowed ones based on state
      b.disabled = !(
        (r==='001' && !chemState.added001)
        || (r==='002' && chemState.added001 && !chemState.added002)
        || (r==='003' && chemState.added002 && !chemState.added003)
        || (r==='PR'  && chemState.added003 && chemState.combined===1 && !chemState.addedPR)
      );
      b.onclick = ()=> addReagent(r);
    });
  }

  function openChemistryMiniGame(){
    // reset state
    Object.keys(chemState).forEach(k=>chemState[k]= (typeof chemState[k]==='boolean')? false : null );
    chemText.textContent = 'Start by adding 5 drops of Solution 001.';
    clFill.style.height = '0%'; clFill.style.background = '#f7e26b';
    phFill.style.height = '0%'; phFill.style.background = '#ffd28a';
    clReading.textContent = 'Chlorine: —'; phReading.textContent='pH: —';
    choicesDiv.style.display = 'none'; closeChem.style.display='none';
    chemModal.style.display = 'grid'; chemModal.setAttribute('aria-hidden','false');
    setupReagentButtons();
  }

  function addReagent(r){
    if(r==='001' && !chemState.added001){
      chemState.added001 = true;
      chemText.textContent = 'Added 001. Now add 5 drops of 002.';
      clFill.style.height = '30%';
    } else if(r==='002' && chemState.added001 && !chemState.added002){
      chemState.added002 = true;
      clFill.style.height = '55%';
      // ask Free Chlorine
      askChoices('What is the Free Chlorine reading?', ['A) 1 ppm','B) 2 ppm','C) 5 ppm'], 1, ()=>{
        chemState.free = 2;
        clReading.textContent = 'Free Chlorine: 2 ppm';
        chemText.textContent = 'Correct. Now add 5 drops of 003.';
      });
    } else if(r==='003' && chemState.added002 && !chemState.added003){
      chemState.added003 = true;
      clFill.style.height = '80%';
      // ask total
      askChoices('After 003, what is the Total Chlorine?', ['A) 2 ppm','B) 3 ppm','C) 6 ppm'], 1, ()=>{
        chemState.total = 3;
        clReading.textContent = 'Total Chlorine: 3 ppm';
        // ask combined
        askChoices('Combined = Total − Free. Value?', ['A) 0 ppm','B) 1 ppm','C) 5 ppm'], 1, ()=>{
          chemState.combined = 1;
          chemText.textContent = 'Combined = 1 ppm. Now add 0.5 ml Phenol Red.';
          setupReagentButtons(); // enable PR next
        });
      });
    } else if(r==='PR' && chemState.added003 && chemState.combined===1 && !chemState.addedPR){
      chemState.addedPR = true;
      phFill.style.height = '60%'; phFill.style.background = '#ffb65c';
      askChoices('What is the pH reading?', ['A) 6.8','B) 7.2','C) 8.0'], 1, ()=>{
        chemState.ph = 7.2;
        phReading.textContent = 'pH: 7.2';
        // show summary
        showChemSummary();
        chemistryDone = true;
        updateStatus();
      });
    }
    setupReagentButtons();
  }

  function askChoices(question, labels, correctIndex, onCorrect){
    chemText.textContent = question;
    choicesDiv.innerHTML = '';
    labels.forEach((label,i)=>{
      const b = document.createElement('button'); b.className='btn'; b.textContent = label;
      b.onclick = ()=>{
        if(i===correctIndex){
          b.classList.add('ok'); setTimeout(()=>b.classList.remove('ok'),300);
          onCorrect && onCorrect();
          choicesDiv.style.display='none';
        } else {
          b.classList.add('bad'); setTimeout(()=>b.classList.remove('bad'),350);
          chemText.textContent = 'Not quite. Try again.';
        }
      };
      choicesDiv.appendChild(b);
    });
    choicesDiv.style.display='flex';
  }

  function showChemSummary(){
    chemText.innerHTML = `✅ Test complete!<br>
      <strong>Results</strong><br>
      • Free Chlorine = ${chemState.free} ppm<br>
      • Total Chlorine = ${chemState.total} ppm<br>
      • Combined Chlorine = ${chemState.combined} ppm<br>
      • pH = ${chemState.ph}`;
    closeChem.style.display = 'inline-block';
  }

  closeChem.addEventListener('click', ()=>{
    chemModal.style.display='none';
    chemModal.setAttribute('aria-hidden','true');
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && chemModal.style.display === 'grid'){
      chemModal.style.display='none';
      chemModal.setAttribute('aria-hidden','true');
    }
  });

  // boot
  fitCanvas();
  updateStatus();
  // main draw loop
  draw();

})();
