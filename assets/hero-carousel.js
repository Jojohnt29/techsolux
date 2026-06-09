/* ============================================================
   TECHSOLUX — hero-carousel.js
   Showcase hero : flat tilted card coverflow + topographic
   ring background canvas. Original implementation.
   ============================================================ */
(function(){
  const ALL = window.PROJECTS || [];
  const SLUGS = ["paris-beaute","kultu-tv","boutique-informatique","ar-studio-beauty","grand-hiver","ovote"];
  const F = SLUGS.map(s=>ALL.find(p=>p.slug===s)).filter(Boolean);
  if(!F.length) return;
  const n = F.length;

  const deck     = document.getElementById('hx-deck');
  const thumbsEl = document.getElementById('hx-thumbs');
  const dotsEl   = document.getElementById('hx-dots');
  const catEl    = document.getElementById('hx-cat');
  const titleEl  = document.getElementById('hx-title');
  const descEl   = document.getElementById('hx-desc');
  const ctaEl    = document.getElementById('hx-cta');
  const ctaLabel = document.getElementById('hx-cta-label');

  /* ---------- animated gradient SVG borders ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function ensureDefs(){
    if(document.getElementById('tsx-grad')) return;
    const svg = document.createElementNS(SVGNS,'svg');
    svg.setAttribute('class','hx__defs'); svg.setAttribute('aria-hidden','true');
    svg.innerHTML =
      '<defs><linearGradient id="tsx-grad" x1="0%" y1="0%" x2="100%" y2="100%">'+
      '<stop offset="6%" stop-color="#9E8BFF"/><stop offset="40%" stop-color="#4353FF"/>'+
      '<stop offset="72%" stop-color="#27C6FF"/><stop offset="96%" stop-color="#A9ECFF"/>'+
      '</linearGradient><filter id="tsx-blur"><feGaussianBlur stdDeviation="4"/></filter></defs>';
    document.body.appendChild(svg);
  }
  function border(el, shape){
    ensureDefs();
    const P = 18, r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if(!w || !h) return;
    const old = el.querySelector(':scope > .gb'); if(old) old.remove();
    const svg = document.createElementNS(SVGNS,'svg');
    svg.setAttribute('class','gb');
    svg.setAttribute('width', w+2*P); svg.setAttribute('height', h+2*P);
    svg.setAttribute('viewBox', `0 0 ${w+2*P} ${h+2*P}`);
    let m;
    if(shape === 'circle'){
      const cx=(w+2*P)/2, cy=(h+2*P)/2, rad=w/2;
      const C=(cls,sw)=>`<circle class="${cls}" cx="${cx}" cy="${cy}" r="${rad}" pathLength="100" stroke-width="${sw}"/>`;
      m = C('gb-echo',2)+C('gb-echo gb-echo2',2)+C('gb-base',1.5)+C('gb-glow',3)+C('gb-trace',2.5);
    } else {
      const rx = h/2;
      const R=(cls,sw)=>`<rect class="${cls}" x="${P}" y="${P}" width="${w}" height="${h}" rx="${rx}" pathLength="100" stroke-width="${sw}"/>`;
      m = R('gb-echo',2)+R('gb-echo gb-echo2',2)+R('gb-base',1.5)+R('gb-glow',3)+R('gb-trace',2.5);
    }
    svg.innerHTML = m;
    el.appendChild(svg);
  }
  const prevBtn = document.getElementById('hx-prev');
  const nextBtn = document.getElementById('hx-next');
  const fitBorders = ()=>{ border(prevBtn,'circle'); border(nextBtn,'circle'); border(ctaEl,'pill'); };

  /* ---------- build curved cards (facets on a cylinder arc) ---------- */
  deck.innerHTML = F.map((p,i)=>`
    <article class="hx-card" data-i="${i}">
      <div class="hx-card__surface" data-img="${p.image||''}" data-name="${p.name}"></div>
    </article>`).join('');
  const cards = [...deck.querySelectorAll('.hx-card')];

  /* ---------- build thumbs ---------- */
  thumbsEl.innerHTML = F.map((p,i)=>`<button class="hx__thumb" data-i="${i}" aria-label="${p.name}">${p.image?`<img src="${p.image}" alt="">`:`<span>${p.num}</span>`}<i class="hx__thumb-bar"></i></button>`).join('');
  const thumbs = [...thumbsEl.querySelectorAll('.hx__thumb')];

  /* ---------- build dots ---------- */
  dotsEl.innerHTML = F.map((_,i)=>`<i data-i="${i}"></i>`).join('');
  const dots = [...dotsEl.querySelectorAll('i')];

  /* ---------- state ---------- */
  let pos = parseInt(localStorage.getItem('tsx-hero')||'0',10); if(isNaN(pos)) pos = 0;
  let cardW=0, cardH=0;

  function fade(el){
    if(!el.animate) return;
    el.animate(
      [{transform:'translateY(14px)', filter:'blur(6px)'},{transform:'none', filter:'blur(0)'}],
      {duration:560, easing:'cubic-bezier(.22,.61,.36,1)'}
    );
  }

  /* ---------- ring constants ---------- */
  // 6 cards × (360°/6) = full closed ring band.
  // Each card itself is a curved segment built from N vertical facets;
  // when all 6 segments sit on the same cylinder the facets join into
  // one continuous ring (the bague effect).
  const NSEG       = 14;                   // facets per card
  const ANGLE_STEP = (2 * Math.PI) / n;    // 60° between card centers
  const FACET_ANGLE = ANGLE_STEP / NSEG;   // ≈ 4.3° per facet
  const PITCH_DECK = -18;                  // global ring tilt (deg)
  const HIDE_ANGLE = Math.PI * 0.58;       // past ~104° from front = back of ring

  // Cylinder radius such that adjacent facets exactly butt edge-to-edge.
  function ringRadius(){
    const segW = cardW / NSEG;
    return segW / (2 * Math.sin(FACET_ANGLE / 2));
  }

  /* ---------- rebuild curved facets (image sliced across N panels) ---------- */
  function rebuildFacets(){
    const R = ringRadius();
    const segW = cardW / NSEG;
    cards.forEach(card=>{
      const surface = card.querySelector('.hx-card__surface');
      const img = surface.dataset.img;
      const name = surface.dataset.name;
      // The .hx-card outer needs a zero-sized hit area at its center.
      card.style.width = '0px'; card.style.height = '0px';
      if(!img){
        surface.innerHTML =
          `<span class="hx-card__fill" style="`+
          `width:${cardW.toFixed(1)}px;height:${cardH.toFixed(1)}px;`+
          `transform:translate(-50%,-50%);position:absolute;left:50%;top:50%;">`+
          `<span>${name}</span></span>`;
        return;
      }
      let html = '';
      for(let j=0;j<NSEG;j++){
        // Local arc — same R, so adjacent cards' facets continue smoothly.
        const localAngle = (j - (NSEG-1)/2) * FACET_ANGLE;
        const lx  = R * Math.sin(localAngle);
        const lz  = R * (Math.cos(localAngle) - 1);
        const lry = -localAngle * 180 / Math.PI;
        const bgx = -j * segW;
        html += `<span class="hx-seg" style="`+
          `width:${(segW+0.6).toFixed(2)}px;height:${cardH.toFixed(1)}px;`+
          `transform:translate(-50%,-50%) translateX(${lx.toFixed(2)}px) translateZ(${lz.toFixed(2)}px) rotateY(${lry.toFixed(2)}deg);`+
          `background-image:url('${img}');`+
          `background-size:${cardW.toFixed(1)}px ${cardH.toFixed(1)}px;`+
          `background-position:${bgx.toFixed(2)}px 0;"></span>`;
      }
      surface.innerHTML = html;
    });
  }

  function geom(){
    const W = innerWidth;
    cardW = Math.min(W*0.34, 520);
    cardH = cardW*0.66;
    if(cardH > innerHeight*0.48){ cardH = innerHeight*0.48; cardW = cardH/0.66; }
    if(W <= 680){ cardW = Math.min(W*0.66, 320); cardH = cardW*0.66; }
    rebuildFacets();

    // Global ring tilt — look down at the band like jewelry
    const deckInner = document.getElementById('hx-deck');
    if(deckInner){
      deckInner.style.transformStyle = 'preserve-3d';
      deckInner.style.transformOrigin = '50% 50%';
      deckInner.style.transform = `rotateX(${PITCH_DECK}deg)`;
    }
    render(false);
  }

  function render(animate){
    const cur = ((pos % n) + n) % n;
    const R = ringRadius();

    cards.forEach((c,i)=>{
      let k = i - cur;
      if(k >  n/2) k -= n;
      if(k < -n/2) k += n;
      const ak = Math.abs(k);

      const angle = k * ANGLE_STEP;
      const aAbs  = Math.abs(angle);
      const tx = R * Math.sin(angle);
      const tz = R * (Math.cos(angle) - 1);
      const ry = -angle * 180 / Math.PI;

      const visible  = aAbs < HIDE_ANGLE;
      const turnFade = Math.max(0, Math.cos(angle));

      c.style.transform =
        `translate(-50%,-50%) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) `+
        `rotateY(${ry.toFixed(2)}deg)`;
      c.style.opacity = visible ? (0.30 + 0.70*turnFade).toFixed(2) : '0';
      c.style.filter  = ak===0 ? 'none' : `brightness(${(0.50 + 0.45*turnFade).toFixed(2)})`;
      c.style.zIndex  = String(30 - ak);
      c.style.pointerEvents = ak<=1 ? 'auto' : 'none';
      c.classList.toggle('is-active', k===0);
      c.classList.toggle('is-neighbor', ak===1);
    });
    thumbs.forEach((t,i)=>t.classList.toggle('is-active', i===cur));
    dots.forEach((d,i)=>d.classList.toggle('on', i===cur));

    const p = F[cur];
    catEl.textContent = (p.type + ' · ' + p.sector).toUpperCase();
    titleEl.innerHTML = p.name;
    descEl.textContent = p.tagline;
    ctaEl.href = `case-study.html?p=${p.slug}`;
    ctaLabel.textContent = p.cat==='mobile' ? "Voir l'app" : "Voir le projet";
    if(animate) [catEl,titleEl,descEl].forEach(fade);
    border(ctaEl,'pill');
    localStorage.setItem('tsx-hero', String(pos));

    setBgFocus(cur);
  }

  const next = ()=>{ pos++; render(true); };
  const prev = ()=>{ pos--; render(true); };
  const go = i => { const cur=((pos%n)+n)%n; let d=i-cur; if(d>n/2)d-=n; if(d<-n/2)d+=n; pos+=d; render(true); };

  document.getElementById('hx-next').addEventListener('click', ()=>{ next(); restart(); });
  document.getElementById('hx-prev').addEventListener('click', ()=>{ prev(); restart(); });
  thumbs.forEach(t=>t.addEventListener('click', ()=>{ go(+t.dataset.i); restart(); }));
  dots.forEach(d=>d.addEventListener('click', ()=>{ go(+d.dataset.i); restart(); }));
  cards.forEach(c=>c.addEventListener('click', ()=>{
    const cur=((pos%n)+n)%n; const i=+c.dataset.i;
    if(i===cur){ location.href = `case-study.html?p=${F[cur].slug}`; }
    else { go(i); restart(); }
  }));
  cards.forEach(c=>c.style.pointerEvents='auto');

  // keyboard navigation
  addEventListener('keydown', e=>{
    if(e.target.closest('input,textarea')) return;
    if(e.key==='ArrowDown'||e.key==='ArrowRight'){ next(); restart(); }
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ prev(); restart(); }
  });

  /* ---------- autoplay ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer=null;
  function restart(){ if(timer) clearInterval(timer); if(!reduce) timer=setInterval(next, 5200); }
  const hero = document.querySelector('.hx');
  hero.addEventListener('pointerenter', ()=>{ hero.classList.add('is-paused'); if(timer){clearInterval(timer); timer=null;} });
  hero.addEventListener('pointerleave', ()=>{ hero.classList.remove('is-paused'); restart(); });

  /* ============================================================
     TOPOGRAPHIC RING BACKGROUND CANVAS
     Concentric distorted rings centered on a focal point that
     shifts per slide + soft mouse parallax.
     ============================================================ */
  let focusTarget = {x:0.62, y:0.46}, focus = {...focusTarget};
  const FOCAL = [
    {x:0.30,y:0.55}, {x:0.46,y:0.40}, {x:0.62,y:0.48},
    {x:0.74,y:0.42}, {x:0.55,y:0.58}, {x:0.40,y:0.46}
  ];
  function setBgFocus(i){ focusTarget = FOCAL[i % FOCAL.length] || focusTarget; }
  setBgFocus(((pos%n)+n)%n);

  (function topoBg(){
    const cv = document.getElementById('hx-canvas'); if(!cv) return;
    const ctx = cv.getContext('2d');
    let w=0, h=0, dpr=1, raf=null;
    const mouse = { x:.5, y:.5, tx:.5, ty:.5 };

    function size(){
      dpr = Math.min(devicePixelRatio||1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.max(1,w*dpr); cv.height = Math.max(1,h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function ringPath(cx, cy, r, distort, time){
      ctx.beginPath();
      const steps = Math.max(64, Math.min(260, Math.round(r/2.4)));
      for(let s=0;s<=steps;s++){
        const a = (s/steps)*Math.PI*2;
        // layered noise: more harmonics + faster drift for visibly turbulent rings
        const noise =
          Math.sin(a*3 + time*0.0009 + r*0.020) * distort +
          Math.cos(a*5 + time*0.0007 - r*0.012) * (distort*0.70) +
          Math.sin(a*7 + time*0.0011 + r*0.006) * (distort*0.35);
        const rr = r + noise;
        const x = cx + rr*Math.cos(a);
        const y = cy + rr*Math.sin(a);
        if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
    }
    function frame(time){
      focus.x += (focusTarget.x - focus.x) * 0.04;
      focus.y += (focusTarget.y - focus.y) * 0.04;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const cx = w * (focus.x + (mouse.x-.5)*0.05);
      const cy = h * (focus.y + (mouse.y-.5)*0.05);

      ctx.clearRect(0,0,w,h);

      // soft glow halo around focal point
      const halo = ctx.createRadialGradient(cx,cy,0, cx,cy, Math.max(w,h)*0.55);
      halo.addColorStop(0,   'rgba(67,83,255,0.22)');
      halo.addColorStop(0.45,'rgba(40,52,150,0.08)');
      halo.addColorStop(1,   'rgba(7,8,11,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0,0,w,h);

      // concentric topographic rings — heavier distortion + bolder lines
      const maxR = Math.hypot(w,h);
      ctx.lineWidth = 1.4;
      for(let r=44; r<maxR; r+=38){
        const d = Math.min(r*0.11, 64);                 // distortion 4.5%→11%, cap 26→64
        const dist = Math.min(1, r / (maxR*0.6));
        const fade = 1 - dist;
        const tint = 0.30*fade + 0.07;                  // opacity boost (.16+.04 → .30+.07)
        ctx.strokeStyle = `rgba(150,170,255,${tint.toFixed(3)})`;
        ringPath(cx, cy, r, d, time);
        ctx.stroke();
      }

      // accent ring near focal point
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(110,123,255,0.55)';
      ringPath(cx, cy, 120 + Math.sin(time*0.001)*4, 6, time);
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    }
    size();
    addEventListener('resize', size);
    addEventListener('pointermove', e=>{ mouse.tx=e.clientX/innerWidth; mouse.ty=e.clientY/innerHeight; }, {passive:true});
    if(reduce){ /* static */ }
    else { raf = requestAnimationFrame(frame); }
  })();

  /* ---------- init ---------- */
  geom();
  fitBorders();
  addEventListener('resize', ()=>{ geom(); fitBorders(); });
  restart();

})();
