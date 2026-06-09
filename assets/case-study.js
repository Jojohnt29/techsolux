/* ============================================================
   TECHSOLUX — case-study.js
   Rend une fiche projet à partir de ?p=slug + lenis/reveals légers.
   ============================================================ */
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PROJECTS = window.PROJECTS || [];
  const mount = document.getElementById('cs');
  const params = new URLSearchParams(location.search);
  const slug = params.get('p');
  const i = PROJECTS.findIndex(p=>p.slug===slug);
  const p = PROJECTS[i];

  const ph = (label, cls='') => `
    <div class="ph ${cls}">
      <span class="ph__corner tl"></span><span class="ph__corner tr"></span>
      <span class="ph__corner bl"></span><span class="ph__corner br"></span>
      <span class="ph__label">${label}</span>
    </div>`;

  if(!p){
    mount.innerHTML = `<section class="section"><div class="wrap cs-404">
      <span class="cs-num">404</span>
      <h1 class="cs-title">Projet<br>introuvable</h1>
      <p class="lead" style="max-width:46ch">Cette fiche n'existe pas ou le lien est erroné.</p>
      <a class="btn btn--primary" href="index.html#work" style="align-self:flex-start">Voir tous les travaux <span class="arr">→</span></a>
    </div></section>`;
    return;
  }

  document.title = `${p.name} — TechSolux`;
  const next = PROJECTS[(i+1) % PROJECTS.length];
  const isMobile = p.cat==='mobile';
  const visitLabel = isMobile ? 'iOS + Android' : 'Visiter le site';
  const visitFlag  = isMobile ? 'lien store à fournir' : 'lien à fournir';

  mount.innerHTML = `
  <section class="section cs-hero" data-screen-label="Étude de cas — ${p.name}">
    <div class="rails"></div>
    <div class="wrap">
      <a class="cs-back" href="index.html#work"><span class="arr">←</span> Tous les travaux</a>
      <div class="cs-eyebrow reveal">
        <span class="cs-num">PROJET ${p.num} / 12</span>
        <span class="tag tag--blue">${p.type}</span>
        <span class="tag">${p.sector}</span>
      </div>
      <h1 class="cs-title reveal">${p.name}</h1>
      <p class="cs-tagline reveal">${p.tagline}</p>
      <div class="cs-actions reveal">
        <a class="btn btn--primary btn--lg" href="${p.fiche}" target="_blank" rel="noopener">Étude complète <span class="arr">↗</span></a>
        <span class="btn btn--lg" style="cursor:default; opacity:.78">${visitLabel} <span class="flag" style="margin-left:4px">${visitFlag}</span></span>
        <a class="btn btn--lg" href="https://forms.gle/HeqoTrc2DM23VLcP6" target="_blank" rel="noopener">Projet similaire <span class="arr">→</span></a>
      </div>

      <div class="cs-meta reveal">
        <div class="cs-meta__cell"><span class="mono">Type</span><b>${p.type}</b></div>
        <div class="cs-meta__cell"><span class="mono">Secteur</span><b>${p.sector}</b></div>
        <div class="cs-meta__cell"><span class="mono">Zone</span><b>${p.region}</b></div>
        <div class="cs-meta__cell"><span class="mono">Périmètre</span><b>${p.services.length} volets</b></div>
      </div>

      <div class="cs-shot reveal">${p.image ? `<img class="cs-shot__img" src="${p.image}" alt="${p.name}">` : ph(p.name.toUpperCase()+' — VISUEL PRINCIPAL À FOURNIR')}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="cs-body">
        <aside class="cs-side reveal">
          <div class="cs-block">
            <span class="idx">// PÉRIMÈTRE</span>
            <h2 style="font-size:clamp(22px,2.2vw,30px); margin-bottom:20px">Livrables</h2>
            <ul class="cs-list">
              ${p.delivered.map((d,n)=>`<li><span class="mono">${String(n+1).padStart(2,'0')}</span> ${d}</li>`).join('')}
            </ul>
          </div>
          <div class="cs-block">
            <span class="idx">// STACK</span>
            <h2 style="font-size:clamp(22px,2.2vw,30px); margin-bottom:4px">Technique</h2>
            <div class="cs-tags">${p.stack.map(s=>`<span class="tag">${s}</span>`).join('')}</div>
          </div>
          <div class="cs-block">
            <span class="idx">// SERVICES</span>
            <div class="cs-tags" style="margin-top:14px">${p.services.map(s=>`<span class="tag tag--blue">${s}</span>`).join('')}</div>
          </div>
        </aside>
        <div>
          <div class="cs-block reveal">
            <span class="idx">01 — CONTEXTE</span>
            <h2>Le contexte</h2>
            <p style="margin-top:20px">${p.context}</p>
          </div>
          <div class="cs-block reveal">
            <span class="idx">02 — APPROCHE</span>
            <h2>L'approche</h2>
            <p style="margin-top:20px">${p.approach}</p>
          </div>
          <div class="cs-block reveal">
            <span class="idx">03 — RÉSUMÉ</span>
            <h2>En bref</h2>
            <p style="margin-top:20px">${p.summary}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="sec-head reveal">
        <div>
          <span class="idx" style="font-family:var(--font-mono); font-size:13px; color:var(--blue); letter-spacing:.1em; margin-bottom:18px; display:block">// APERÇU</span>
          <h2 class="h-sec" style="font-size:clamp(30px,4.4vw,68px)">Écrans</h2>
        </div>
        <p class="lead">Maquettes de placement — à remplacer par les vrais screenshots du projet livré.</p>
      </div>
      <div class="cs-gallery reveal">
        ${p.gallery.map(g=>`<figure class="shot" style="margin:0">${ph(g.toUpperCase())}</figure>`).join('')}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <nav class="cs-next reveal">
        <a href="case-study.html?p=${next.slug}">
          <div>
            <span class="mono">Projet suivant — ${next.num} / 12</span>
            <b>${next.name}</b>
          </div>
          <span class="arr">→</span>
        </a>
      </nav>
    </div>
  </section>`;

  /* ---- lenis + reveals ---- */
  let lenis=null;
  if(window.Lenis && !reduce){
    lenis = new Lenis({ duration:1.1, smoothWheel:true, lerp:.1 });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if(window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{ const id=a.getAttribute('href'); if(id.length>1){ const el=document.querySelector(id); if(el){ e.preventDefault(); lenis.scrollTo(el,{offset:-60}); } } });
    });
  }
  if(window.gsap && window.ScrollTrigger && !reduce){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.reveal').forEach(el=>{
      gsap.fromTo(el,{opacity:0,y:40},{opacity:1,y:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}});
    });
  }

  /* nav stuck */
  const nav=document.getElementById('nav');
  const onScroll=()=>{ if(nav) nav.classList.toggle('is-stuck', window.scrollY>40); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
})();
