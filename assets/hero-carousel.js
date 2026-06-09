/* ============================================================
   TECHSOLUX — hero-carousel.js
   Showcase 3D des projets : carrousel en perspective + panneau + vignettes.
   ============================================================ */
(function(){
  const ALL = window.PROJECTS || [];
  // projets mis en vedette dans le hero
  const SLUGS = ["paris-beaute","kultu-tv","boutique-informatique","ar-studio-beauty","grand-hiver","ovote"];
  const F = SLUGS.map(s=>ALL.find(p=>p.slug===s)).filter(Boolean);
  if(!F.length) return;
  const n = F.length;

  const deck = document.getElementById('hx-deck');
  const thumbsEl = document.getElementById('hx-thumbs');
  const dotsEl = document.getElementById('hx-dots');
  const catEl = document.getElementById('hx-cat');
  const titleEl = document.getElementById('hx-title');
  const descEl = document.getElementById('hx-desc');
  const ctaEl = document.getElementById('hx-cta');
  const ctaLabel = document.getElementById('hx-cta-label');

  // ---- animated gradient SVG borders ----
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

  const bigName = name => {
    const w = name.split(' ');
    return w.length>1 ? `${w[0]} <b>${w.slice(1).join(' ')}</b>` : `<b>${name}</b>`;
  };

  // ---- build cards (curved full-bleed surface) ----
  deck.innerHTML = F.map((p,i)=>`
    <article class="hx-card" data-i="${i}">
      <div class="hx-card__inner">
        <div class="hx-card__surface" data-img="${p.image||''}">${p.image?'':'<div class="hx-card__fill"></div>'}</div>
        <div class="hx-card__shade"></div>
      </div>
    </article>`).join('');
  const cards = [...deck.querySelectorAll('.hx-card')];

  // ---- build thumbs ----
  thumbsEl.innerHTML = F.map((p,i)=>`<button class="hx__thumb" data-i="${i}" aria-label="${p.name}">${p.image?`<img src="${p.image}" alt="">`:`<span>${p.num}</span>`}<i class="hx__thumb-bar"></i></button>`).join('');
  const thumbs = [...thumbsEl.querySelectorAll('.hx__thumb')];

  // ---- build dots ----
  dotsEl.innerHTML = F.map((_,i)=>`<i data-i="${i}"></i>`).join('');
  const dots = [...dotsEl.querySelectorAll('i')];

  // ---- state ----
  let pos = parseInt(localStorage.getItem('tsx-hero')||'0',10); if(isNaN(pos)) pos = 0;
  let cardW=0, cardH=0;

  function fade(el){
    // anime UNIQUEMENT transform/flou (jamais l'opacité) : si la timeline est
    // en pause (onglet hors focus), le texte reste lisible au lieu de disparaître.
    if(!el.animate) return;
    el.animate([{transform:'translateY(16px)', filter:'blur(5px)'},{transform:'none', filter:'blur(0)'}],
      {duration:560, easing:'cubic-bezier(.22,.61,.36,1)'});
  }

  // ---- curved card surface : vertical facets on a cylinder arc ----
  const NSEG = 9;
  function buildCurves(){
    const R = cardW * 2.3;          // grand rayon = courbe douce et convexe
    const segW = cardW / NSEG;
    cards.forEach(c=>{
      const surface = c.querySelector('.hx-card__surface');
      const img = surface.dataset.img;
      if(!img) return;              // fallback "fill" reste plat
      let html = '';
      for(let i=0;i<NSEG;i++){
        const theta = (i - (NSEG-1)/2) * (segW / R);   // radians, centre de la facette
        const x = R*Math.sin(theta);
        const z = R*Math.cos(theta) - R;               // <=0 : les bords reculent
        const deg = theta*180/Math.PI;
        const bgx = -(i*segW);
        html += `<span class="hx-seg" style="width:${(segW+0.8).toFixed(2)}px;height:${cardH.toFixed(1)}px;`+
          `transform:translate(-50%,-50%) translateX(${x.toFixed(2)}px) translateZ(${z.toFixed(2)}px) rotateY(${deg.toFixed(2)}deg);`+
          `background-image:url('${img}');background-size:${cardW.toFixed(1)}px ${cardH.toFixed(1)}px;`+
          `background-position:${bgx.toFixed(2)}px 0;"></span>`;
      }
      surface.innerHTML = html;
    });
  }

  function geom(){
    cardW = Math.min(innerWidth*0.62, 940);
    cardH = cardW/1.5;
    if(cardH > innerHeight*0.7){ cardH = innerHeight*0.7; cardW = cardH*1.5; }
    cards.forEach(c=>{ c.style.width=cardW+'px'; c.style.height=cardH+'px'; });
    buildCurves();
    render(false);
  }

  function render(animate){
    const cur = ((pos % n) + n) % n;
    cards.forEach((c,i)=>{
      let k = i - cur; if(k > n/2) k -= n; if(k < -n/2) k += n;   // décalage circulaire signé
      const ak = Math.abs(k);
      // convex fan / coverflow arc
      const ry = -k * 17;
      const tx = k * cardW * 0.66;
      const tz = -ak * cardW * 0.16;
      const sc = 1 - Math.min(ak,3) * 0.06;
      c.style.transform = `translate(-50%,-50%) translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry}deg) scale(${sc.toFixed(3)})`;
      c.style.opacity = ak<=2 ? '1' : '0';
      c.style.filter  = ak===0 ? 'none' : `brightness(${ak===1?0.6:0.42})`;
      c.style.zIndex  = String(30 - ak);
      c.style.pointerEvents = ak<=1 ? 'auto' : 'none';
      c.classList.toggle('is-active', k===0);
    });
    thumbs.forEach((t,i)=>t.classList.toggle('is-active', i===cur));
    dots.forEach((d,i)=>d.classList.toggle('on', i===cur));
    const p = F[cur];
    catEl.textContent = p.type + ' · ' + p.sector;
    titleEl.innerHTML = bigName(p.name);
    descEl.textContent = p.tagline;
    ctaEl.href = `case-study.html?p=${p.slug}`;
    ctaLabel.textContent = p.cat==='mobile' ? "Voir l'app" : "Voir le projet";
    if(animate) [catEl,titleEl,descEl].forEach(fade);
    border(ctaEl,'pill');
    localStorage.setItem('tsx-hero', String(pos));
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

  // ---- autoplay ----
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer=null;
  function restart(){ if(timer) clearInterval(timer); if(!reduce) timer=setInterval(next, 5200); }
  const hero = document.querySelector('.hx');
  hero.addEventListener('pointerenter', ()=>{ hero.classList.add('is-paused'); if(timer){clearInterval(timer); timer=null;} });
  hero.addEventListener('pointerleave', ()=>{ hero.classList.remove('is-paused'); restart(); });

  geom();
  fitBorders();
  addEventListener('resize', ()=>{ geom(); fitBorders(); });
  restart();

  // ---- animated canvas particle field + mouse parallax ----
  (function canvasBg(){
    const cv = document.getElementById('hx-canvas'); if(!cv) return;
    const ctx = cv.getContext('2d');
    let w=0, h=0, dpr=1, parts=[], raf=null;
    const mouse = { x:.5, y:.5, tx:.5, ty:.5 };
    const LINK = 132;
    function init(){
      const n = Math.round(Math.min(130, (w*h)/13000));
      parts = [];
      for(let i=0;i<n;i++) parts.push({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-.5)*.26, vy:(Math.random()-.5)*.26,
        r:Math.random()*1.5+.6
      });
    }
    function size(){
      dpr = Math.min(devicePixelRatio||1, 2);
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.max(1,w*dpr); cv.height = Math.max(1,h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      init();
    }
    function frame(){
      mouse.x += (mouse.tx-mouse.x)*.06; mouse.y += (mouse.ty-mouse.y)*.06;
      const ox=(mouse.x-.5)*46, oy=(mouse.y-.5)*46;
      ctx.clearRect(0,0,w,h);
      for(const p of parts){
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>w) p.vx*=-1;
        if(p.y<0||p.y>h) p.vy*=-1;
      }
      for(let i=0;i<parts.length;i++){
        const a=parts[i];
        for(let j=i+1;j<parts.length;j++){
          const b=parts[j], dx=a.x-b.x, dy=a.y-b.y, d=Math.hypot(dx,dy);
          if(d<LINK){
            ctx.strokeStyle=`rgba(96,118,255,${((1-d/LINK)*.5).toFixed(3)})`;
            ctx.lineWidth=.6;
            ctx.beginPath(); ctx.moveTo(a.x+ox,a.y+oy); ctx.lineTo(b.x+ox,b.y+oy); ctx.stroke();
          }
        }
      }
      for(const p of parts){
        ctx.fillStyle='rgba(150,170,255,.72)';
        ctx.beginPath(); ctx.arc(p.x+ox,p.y+oy,p.r,0,6.2832); ctx.fill();
      }
      raf=requestAnimationFrame(frame);
    }
    size();
    addEventListener('resize', size);
    addEventListener('pointermove', e=>{ mouse.tx=e.clientX/innerWidth; mouse.ty=e.clientY/innerHeight; }, {passive:true});
    if(reduce){ // static single frame
      ctx.clearRect(0,0,w,h);
      for(const p of parts){ ctx.fillStyle='rgba(150,170,255,.55)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.2832); ctx.fill(); }
    } else { frame(); }
  })();
})();
