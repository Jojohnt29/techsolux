/* ============================================================
   TECHSOLUX — tweaks.js  (vanilla Tweaks panel + host protocol)
   ============================================================ */
(function(){
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "accent": "#4353FF",
    "theme": "dark",
    "workLayout": "grid",
    "grain": true
  }/*EDITMODE-END*/;

  // accent → derived palette
  const ACCENTS = {
    "#4353FF": { v2:"#6E7BFF", dim:"#2A309E", glow:"rgba(67,83,255,.45)" },   // brand
    "#00A3FF": { v2:"#52C6FF", dim:"#0A5E94", glow:"rgba(0,163,255,.45)" },   // électrique cyan
    "#7A5CFF": { v2:"#9E86FF", dim:"#4A329E", glow:"rgba(122,92,255,.45)" },  // violet
    "#FF5A3C": { v2:"#FF8163", dim:"#9E3320", glow:"rgba(255,90,60,.45)" }    // orange brut
  };

  const root = document.documentElement;
  function apply(t){
    const a = ACCENTS[t.accent] || ACCENTS["#4353FF"];
    root.style.setProperty('--blue', t.accent);
    root.style.setProperty('--blue-2', a.v2);
    root.style.setProperty('--blue-dim', a.dim);
    root.style.setProperty('--blue-glow', a.glow);
    root.setAttribute('data-theme', t.theme);
    document.body.classList.toggle('no-grain', !t.grain);
    const wg = document.getElementById('work-grid');
    if(wg) wg.classList.toggle('is-rows', t.workLayout==='rows');
  }
  apply(TWEAKS);

  function setTweak(key, val){
    TWEAKS[key] = val;
    apply(TWEAKS);
    try{ window.parent.postMessage({ type:'__edit_mode_set_keys', edits:{ [key]:val } }, '*'); }catch(e){}
    window.dispatchEvent(new CustomEvent('tweakchange', { detail:{ [key]:val } }));
  }

  /* ---------- panel UI ---------- */
  const css = `
  .tx-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:264px;
    background:rgba(11,13,18,.86);color:#F3F5FA;border:1px solid rgba(255,255,255,.14);
    backdrop-filter:blur(20px) saturate(150%);-webkit-backdrop-filter:blur(20px) saturate(150%);
    font-family:"JetBrains Mono",monospace;font-size:11px;display:none;flex-direction:column;
    box-shadow:0 20px 60px rgba(0,0,0,.5)}
  .tx-panel.open{display:flex}
  .tx-hd{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;
    border-bottom:1px solid rgba(255,255,255,.1);cursor:move;user-select:none}
  .tx-hd b{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:600}
  .tx-hd .dot{width:7px;height:7px;background:var(--blue,#4353FF);border-radius:50%;margin-right:8px;display:inline-block}
  .tx-x{background:none;border:0;color:rgba(255,255,255,.5);cursor:pointer;font-size:14px;padding:2px 6px}
  .tx-x:hover{color:#fff}
  .tx-body{padding:6px 14px 16px;display:flex;flex-direction:column;gap:4px;max-height:70vh;overflow:auto}
  .tx-sect{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);
    margin:14px 0 8px;font-weight:600}
  .tx-sect:first-child{margin-top:6px}
  .tx-seg{display:flex;border:1px solid rgba(255,255,255,.14);margin-bottom:2px}
  .tx-seg button{flex:1;background:none;border:0;border-right:1px solid rgba(255,255,255,.1);
    color:rgba(255,255,255,.6);font-family:inherit;font-size:10px;letter-spacing:.04em;
    padding:9px 4px;cursor:pointer;text-transform:uppercase;transition:.2s}
  .tx-seg button:last-child{border-right:0}
  .tx-seg button:hover{color:#fff;background:rgba(255,255,255,.05)}
  .tx-seg button.on{background:var(--blue,#4353FF);color:#fff}
  .tx-sw{display:flex;gap:7px}
  .tx-sw button{flex:1;height:34px;border:1px solid rgba(255,255,255,.16);cursor:pointer;position:relative;padding:0}
  .tx-sw button.on{box-shadow:inset 0 0 0 2px #fff, 0 0 0 1px rgba(0,0,0,.4)}
  .tx-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 0}
  .tx-row span{color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;font-size:10px}
  .tx-tog{position:relative;width:34px;height:19px;border:1px solid rgba(255,255,255,.2);
    background:rgba(255,255,255,.08);cursor:pointer;transition:.2s;flex-shrink:0}
  .tx-tog.on{background:var(--blue,#4353FF);border-color:var(--blue,#4353FF)}
  .tx-tog i{position:absolute;top:2px;left:2px;width:13px;height:13px;background:#fff;transition:.2s}
  .tx-tog.on i{transform:translateX(15px)}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'tx-panel';
  panel.setAttribute('data-omelette-chrome','');
  panel.innerHTML = `
    <div class="tx-hd" id="tx-drag"><b><span class="dot"></span>Tweaks</b><button class="tx-x" id="tx-close">✕</button></div>
    <div class="tx-body">
      <div class="tx-sect">Couleur signature</div>
      <div class="tx-sw" id="tx-accent"></div>
      <div class="tx-sect">Ambiance</div>
      <div class="tx-seg" data-key="theme">
        <button data-v="dark">Dark</button><button data-v="light">Béton clair</button>
      </div>
      <div class="tx-sect">Travaux — disposition</div>
      <div class="tx-seg" data-key="workLayout">
        <button data-v="grid">Grille</button><button data-v="rows">Lignes</button>
      </div>
      <div class="tx-sect">Texture</div>
      <div class="tx-row"><span>Grain de film</span><div class="tx-tog" id="tx-grain"><i></i></div></div>
    </div>`;
  document.body.appendChild(panel);

  // accent swatches
  const accWrap = panel.querySelector('#tx-accent');
  Object.keys(ACCENTS).forEach(hex=>{
    const b = document.createElement('button');
    b.style.background = hex; b.dataset.v = hex; b.title = hex;
    accWrap.appendChild(b);
  });

  function sync(){
    accWrap.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.v===TWEAKS.accent));
    panel.querySelectorAll('.tx-seg').forEach(seg=>{
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.v===TWEAKS[key]));
    });
    panel.querySelector('#tx-grain').classList.toggle('on', !!TWEAKS.grain);
  }
  sync();

  accWrap.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b)return; setTweak('accent', b.dataset.v); sync(); });
  panel.querySelectorAll('.tx-seg').forEach(seg=>{
    seg.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b)return; setTweak(seg.dataset.key, b.dataset.v); sync(); });
  });
  panel.querySelector('#tx-grain').addEventListener('click', ()=>{ setTweak('grain', !TWEAKS.grain); sync(); });

  /* ---------- host protocol ---------- */
  let open = false;
  function setOpen(v){ open=v; panel.classList.toggle('open', v); }
  window.addEventListener('message', e=>{
    const t = e?.data?.type;
    if(t==='__activate_edit_mode') setOpen(true);
    else if(t==='__deactivate_edit_mode') setOpen(false);
  });
  try{ window.parent.postMessage({ type:'__edit_mode_available' }, '*'); }catch(e){}
  panel.querySelector('#tx-close').addEventListener('click', ()=>{
    setOpen(false);
    try{ window.parent.postMessage({ type:'__edit_mode_dismissed' }, '*'); }catch(e){}
  });

  /* ---------- drag ---------- */
  const drag = panel.querySelector('#tx-drag');
  drag.addEventListener('mousedown', e=>{
    if(e.target.id==='tx-close') return;
    const r = panel.getBoundingClientRect();
    const sx=e.clientX, sy=e.clientY, sr=window.innerWidth-r.right, sb=window.innerHeight-r.bottom;
    const move=ev=>{
      panel.style.right = Math.max(8, sr-(ev.clientX-sx))+'px';
      panel.style.bottom = Math.max(8, sb-(ev.clientY-sy))+'px';
    };
    const up=()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  });
})();
