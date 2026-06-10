/* ============================================================
   TECHSOLUX — footer.js
   ApeChain-style footer: cursor-reactive contour-line background,
   project-art mosaic strip, and a chromatic cursor-reactive
   TECHSOLUX wordmark (RGB split). Reuses window.TSXContourEngine.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    const footer = document.querySelector(".tsf");
    if (!footer) return;

    /* contour-line background (dark blue, like ApeChain's footer rings) */
    const cv = footer.querySelector("#tsf-contour");
    if (cv && window.TSXContourEngine) {
      const eng = new window.TSXContourEngine(cv, {
        meshUrl: "assets/gl/ape_bg.dat",
        color: [0.078, 0.204, 0.6], // #143499
        opacity: 0.24,
        drag: 0.2,
        push: 0.2,
        chromaShift: false,
      });
      eng.load();
    }

    /* dimmed project-art mosaic strip pinned to the bottom */
    const mosaic = footer.querySelector("#tsf-mosaic");
    if (mosaic) {
      const imgs = (window.PROJECTS || []).filter((p) => p.image).map((p) => p.image);
      if (imgs.length) {
        const row = imgs.concat(imgs, imgs);
        mosaic.innerHTML = row
          .map((src) => `<span style="background-image:url('${src}')"></span>`)
          .join("");
      }
    }

    /* chromatic cursor-reactive wordmark (RGB split) */
    const word = footer.querySelector("#tsf-word");
    if (word) {
      const txt = word.getAttribute("data-text") || "TECHSOLUX";
      word.innerHTML =
        `<span class="tsf-word__l tsf-word__base">${txt}</span>` +
        `<span class="tsf-word__l tsf-word__r" aria-hidden="true">${txt}</span>` +
        `<span class="tsf-word__l tsf-word__g" aria-hidden="true">${txt}</span>` +
        `<span class="tsf-word__l tsf-word__b" aria-hidden="true">${txt}</span>`;
      const R = word.querySelector(".tsf-word__r");
      const G = word.querySelector(".tsf-word__g");
      const B = word.querySelector(".tsf-word__b");
      let mx = 0, my = 0, tx = 0, ty = 0, t = 0;
      const onMove = (e) => {
        const r = word.getBoundingClientRect();
        if (!r.width) return;
        tx = (e.clientX - (r.left + r.width / 2)) / r.width;
        ty = (e.clientY - (r.top + r.height / 2)) / r.height;
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      function loop() {
        t += 0.016;
        mx += (tx - mx) * 0.08;
        my += (ty - my) * 0.08;
        const ox = mx * 16 + Math.sin(t * 0.7) * 3;
        const oy = my * 9 + Math.cos(t * 0.5) * 1.5;
        R.style.transform = `translate(${(-ox).toFixed(2)}px, ${(-oy).toFixed(2)}px)`;
        B.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)`;
        G.style.transform = `translate(${(ox * 0.25).toFixed(2)}px, 0)`;
        requestAnimationFrame(loop);
      }
      if (!reduce) loop();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
