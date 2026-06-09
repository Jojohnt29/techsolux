/* ============================================================
   TECHSOLUX — main.js
   Lenis smooth scroll · GSAP reveals · Hero WebGL (Three.js)
   Services / Marquee / Work grid injection + filtres
   ============================================================ */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PROJECTS = window.PROJECTS || [];

  /* ---------- SERVICES ---------- */
  const SERVICES = [
    { t:"Sites web", d:"Sites vitrines et plateformes dynamiques, responsives et rapides — WordPress ou sur-mesure." },
    { t:"Applications mobiles", d:"Apps iOS + Android en Flutter, d'une seule base de code jusqu'à la publication." },
    { t:"Identité de marque", d:"Logo, couleurs, système visuel. Une marque cohérente sur tous les supports." },
    { t:"UI / UX Design", d:"Maquettes Figma centrées usage. On valide l'expérience avant d'écrire le code." },
    { t:"Création de contenu", d:"Textes, visuels et médias pour donner de la matière à votre présence en ligne." },
    { t:"SEO & marketing", d:"Bases SEO techniques et on-page pour être trouvé là où ça compte." },
  ];
  const sg = document.getElementById('services-grid');
  if(sg){
    sg.innerHTML = SERVICES.map((s,i)=>`
      <article class="svc">
        <div class="svc__num"><b>${String(i+1).padStart(2,'0')}</b> / 06</div>
        <div>
          <h3>${s.t}</h3>
          <p>${s.d}</p>
        </div>
        <span class="svc__line"></span>
      </article>`).join('');
  }

  /* ---------- MARQUEE ---------- */
  const mt = document.getElementById('marquee-track');
  if(mt){
    const names = PROJECTS.map(p=>p.name);
    const one = names.map((n,i)=>`<span class="marquee__item ${i%2?'dim':''}"><span>${n}</span><span class="star">✳</span></span>`).join('');
    mt.innerHTML = one + one; // duplicate for seamless loop
  }

  /* ---------- WORK GRID + FILTERS ---------- */
  const FILTERS = [
    { id:'all',    label:'Tous',          match:()=>true },
    { id:'web',    label:'Sites web',     match:p=>p.cat==='web'||p.cat==='webapp' },
    { id:'mobile', label:'Applications',  match:p=>p.cat==='mobile' },
    { id:'ecom',   label:'E-commerce',    match:p=>p.cat==='ecom' },
  ];
  const wf = document.getElementById('work-filters');
  const wg = document.getElementById('work-grid');
  if(wf && wg){
    wf.innerHTML = FILTERS.map((f,i)=>{
      const n = PROJECTS.filter(f.match).length;
      return `<button class="filter ${i===0?'is-active':''}" data-f="${f.id}">${f.label}<b>${String(n).padStart(2,'0')}</b></button>`;
    }).join('');

    wg.innerHTML = PROJECTS.map(p=>`
      <a class="card" href="case-study.html?p=${p.slug}" data-cat="${p.cat}" aria-label="${p.name} — ${p.type}">
        <div class="card__media">
          ${p.image ? `<img class="card__img" src="${p.image}" alt="${p.name}" loading="lazy">` : `<div class="ph">
            <span class="ph__corner tl"></span><span class="ph__corner tr"></span>
            <span class="ph__corner bl"></span><span class="ph__corner br"></span>
            <span class="ph__label">${p.name.toUpperCase()}<br>— SCREENSHOT À FOURNIR</span>
          </div>`}
          <span class="card__num">${p.num}</span>
          <span class="card__type tag tag--blue">${p.type}</span>
        </div>
        <div class="card__body">
          <span class="card__sector">${p.sector}${p.region && p.region!=='—' ? ' · '+p.region : ''}</span>
          <h3 class="card__title">${p.name} <span class="arr">↗</span></h3>
          <p class="card__sum">${p.summary}</p>
        </div>
      </a>`).join('');

    wf.addEventListener('click', e=>{
      const btn = e.target.closest('.filter'); if(!btn) return;
      wf.querySelectorAll('.filter').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = FILTERS.find(x=>x.id===btn.dataset.f);
      wg.querySelectorAll('.card').forEach(card=>{
        const p = PROJECTS.find(x=>x.cat===card.dataset.cat) || {cat:card.dataset.cat};
        const show = f.match({cat:card.dataset.cat});
        card.classList.toggle('is-hidden', !show);
      });
      if(window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ---------- NAV stuck + burger ---------- */
  const nav = document.getElementById('nav');
  const onScroll = ()=>{ if(nav) nav.classList.toggle('is-stuck', window.scrollY > 40); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  const burger = document.getElementById('burger');
  if(burger){ burger.addEventListener('click', ()=>{ document.querySelector('#contact')?.scrollIntoView(); }); }

  /* ---------- SIDE INDEX active tracking ---------- */
  const dex = document.getElementById('dex');
  if(dex && 'IntersectionObserver' in window){
    const setActive = id => dex.querySelectorAll('a').forEach(a=>a.classList.toggle('is-active', a.dataset.target===id));
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin:'-45% 0px -45% 0px', threshold:0 });
    [...dex.querySelectorAll('a')].forEach(a=>{ const s=document.getElementById(a.dataset.target); if(s) io.observe(s); });
  }

  /* ---------- LENIS smooth scroll ---------- */
  let lenis = null;
  if(window.Lenis && !reduce){
    lenis = new Lenis({ duration:1.1, smoothWheel:true, lerp:0.1 });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if(window.ScrollTrigger){ lenis.on('scroll', ScrollTrigger.update); }
    // anchor links via lenis
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        const id = a.getAttribute('href');
        if(id.length>1){ const el=document.querySelector(id); if(el){ e.preventDefault(); lenis.scrollTo(el, {offset:-60}); } }
      });
    });
  }

  /* ---------- GSAP reveals ---------- */
  if(window.gsap && window.ScrollTrigger && !reduce){
    gsap.registerPlugin(ScrollTrigger);

    // generic reveals
    gsap.utils.toArray('.reveal').forEach(el=>{
      if(el.closest('.hero')) return; // hero has its own intro
      gsap.fromTo(el, { opacity:0, y:40 }, {
        opacity:1, y:0, duration:.9, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 88%' }
      });
    });
  }

  /* ============================================================
     HERO WEBGL — wireframe sphere + particle field + parallax
     ============================================================ */
  (function heroGL(){
    const canvas = document.getElementById('hero-canvas');
    if(!canvas || !window.THREE) return;
    if(reduce){ canvas.style.opacity = .35; }

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, .1, 100);
    cam.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setClearColor(0x000000, 0);

    const group = new THREE.Group();
    scene.add(group);

    // read brand color from CSS (tweakable)
    function brandColor(){
      const c = getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() || '#4353FF';
      return new THREE.Color(c);
    }
    let COL = brandColor();

    // 1) wireframe icosphere
    const geo = new THREE.IcosahedronGeometry(3.1, 4);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color:COL, transparent:true, opacity:.55 })
    );
    group.add(wire);

    // inner faint solid for depth
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.0, 2),
      new THREE.MeshBasicMaterial({ color:0x0a0c14, transparent:true, opacity:.85 })
    );
    group.add(inner);

    // vertex dots on the sphere
    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', geo.getAttribute('position').clone());
    const dots = new THREE.Points(dotsGeo, new THREE.PointsMaterial({ color:COL, size:.05, transparent:true, opacity:.9 }));
    group.add(dots);

    // 2) ambient particle field
    const N = 900;
    const pos = new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const r = 6 + Math.random()*9;
      const th = Math.random()*Math.PI*2;
      const ph = Math.acos(2*Math.random()-1);
      pos[i*3]   = r*Math.sin(ph)*Math.cos(th);
      pos[i*3+1] = r*Math.sin(ph)*Math.sin(th);
      pos[i*3+2] = r*Math.cos(ph);
    }
    const fieldGeo = new THREE.BufferGeometry();
    fieldGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const field = new THREE.Points(fieldGeo, new THREE.PointsMaterial({ color:0x8893ff, size:.035, transparent:true, opacity:.5 }));
    scene.add(field);

    function resize(){
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
      renderer.setSize(w, h, false);
      cam.aspect = w/h; cam.updateProjectionMatrix();
      // big centered background globe (behind hero text)
      group.position.x = 0;
      group.position.y = w > 900 ? 0.15 : 1.0;
      const s = w > 900 ? 1.32 : 0.9;
      group.scale.setScalar(s);
    }
    window.addEventListener('resize', resize); resize();

    // parallax target
    const mouse = { x:0, y:0, tx:0, ty:0 };
    window.addEventListener('pointermove', e=>{
      mouse.tx = (e.clientX/window.innerWidth - .5);
      mouse.ty = (e.clientY/window.innerHeight - .5);
    });

    // hero style variants (tweakable)
    function applyHeroStyle(){
      const mode = document.documentElement.getAttribute('data-hero') || 'wire';
      if(mode==='points'){
        wire.visible=false; inner.visible=false; dots.visible=true;
        dots.material.size=.075; field.material.opacity=.7;
      } else if(mode==='globe'){
        wire.visible=true; wire.material.opacity=.55; inner.visible=true;
        dots.visible=false; field.material.opacity=.35;
      } else { // wire (default)
        wire.visible=true; wire.material.opacity=.42; inner.visible=true;
        dots.visible=true; dots.material.size=.05; field.material.opacity=.5;
      }
    }
    applyHeroStyle();

    // refresh color + style on tweak change
    window.addEventListener('tweakchange', ()=>{
      COL = brandColor();
      wire.material.color.copy(COL);
      dots.material.color.copy(COL);
      applyHeroStyle();
    });

    let raf;
    function loop(t){
      raf = requestAnimationFrame(loop);
      mouse.x += (mouse.tx - mouse.x)*.05;
      mouse.y += (mouse.ty - mouse.y)*.05;
      const time = t*0.001;
      group.rotation.y = time*0.12 + mouse.x*0.6;
      group.rotation.x = mouse.y*0.4 + Math.sin(time*0.3)*0.04;
      field.rotation.y = -time*0.02 + mouse.x*0.2;
      field.rotation.x = mouse.y*0.15;
      cam.position.x += (mouse.x*1.4 - cam.position.x)*.04;
      cam.position.y += (-mouse.y*1.0 - cam.position.y)*.04;
      cam.lookAt(group.position);
      renderer.render(scene, cam);
    }
    if(!reduce){ loop(0); } else { renderer.render(scene, cam); }

    // pause when hero off-screen
    if(window.ScrollTrigger){
      ScrollTrigger.create({
        trigger:'.hero', start:'top top', end:'bottom top',
        onLeave:()=>{ if(raf) cancelAnimationFrame(raf); raf=null; },
        onEnterBack:()=>{ if(!raf && !reduce) loop(0); }
      });
    }
  })();

})();
