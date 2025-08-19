// --- Tabs ---
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// --- Dates (default today, no future) ---
function todayStr(){
  const d = new Date();
  return d.toISOString().split("T")[0];
}
function initDates(scope=document){
  const t = todayStr();
  scope.querySelectorAll('input[type="date"].use-today').forEach(i=>{
    if(!i.value) i.value = t;
  });
  scope.querySelectorAll('input[type="date"].limit-today').forEach(i=>{
    i.max = t;
  });
}
initDates();

// --- Signature Pad ---
function makeSignaturePad(canvas){
  const ctx = canvas.getContext('2d');
  function resize(){
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    clear();
  }
  function clear(){
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    drawn = false;
  }
  let drawing = false, last=null, drawn=false;
  function pos(e){ 
    if(e.touches){ const r = canvas.getBoundingClientRect(); 
      return {x: e.touches[0].clientX-r.left, y:e.touches[0].clientY-r.top}; }
    return {x: e.offsetX, y: e.offsetY};
  }
  function start(e){ drawing=true; last=pos(e); e.preventDefault(); }
  function move(e){ if(!drawing) return;
    const p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.strokeStyle='#2dd4bf'; ctx.lineWidth=2; ctx.stroke(); last=p; drawn=true; e.preventDefault();
  }
  function end(){ drawing=false; }
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start,{passive:false});
  canvas.addEventListener('touchmove', move,{passive:false});
  window.addEventListener('touchend', end);
  canvas.closest('.sig-block').querySelector('.sig-clear').addEventListener('click', clear);
  new ResizeObserver(resize).observe(canvas);
  resize();
  return { toDataURL(){ return drawn?canvas.toDataURL():""; }, clear };
}
const sigPads=new WeakMap();
function initPads(scope=document){
  scope.querySelectorAll('.sig-pad').forEach(cv=>{
    if(!sigPads.has(cv)) sigPads.set(cv, makeSignaturePad(cv));
  });
}
initPads();

// --- Add roast batch ---
document.getElementById('addBatch').addEventListener('click', ()=>{
  const container=document.getElementById('batchContainer');
  const first=container.querySelector('.batch-entry');
  const clone=first.cloneNode(true);
  clone.querySelectorAll('input').forEach(i=>i.value="");
  initDates(clone);
  const oldCanvas=clone.querySelector('.sig-pad');
  const fresh=document.createElement('canvas');
  fresh.className='sig-pad';
  clone.querySelector('.sig-block').replaceChild(fresh, oldCanvas);
  container.appendChild(clone);
  initPads(clone);
});