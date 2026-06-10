/* ============================================================
   TECHSOLUX — contour.js
   Shared WebGL2 cursor-reactive contour-line engine, ported from
   ApeChain's heroContourEngine (now parameterized + chromaShift).
   Exposes window.TSXContourEngine for the hero + footer.
   Mesh .dat: [u32 vertCount][u32 triCount][f32 xyz*verts][u16*3*tris]
   ============================================================ */
(function () {
  "use strict";

  const DEFAULTS = {
    meshUrl: "assets/gl/ape_bg.dat",
    color: [1, 1, 1],
    opacity: 0.2,
    drag: 0.2,
    push: 0.2,
    chromaShift: false,
  };

  const CHROMA_LAYERS = [
    { mask: [1, 0, 0], disp: 0.9 },
    { mask: [0, 1, 0], disp: 1.0 },
    { mask: [0, 0, 1], disp: 1.1 },
  ];

  const TF_VERTEX = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec4 aDisplacementIn;
uniform vec4 uCursor;
uniform vec2 uEffectsStrength;
out vec4 tf_disp;
void main() {
  vec2 velocity = aDisplacementIn.zw;
  vec2 pos = aPosition.xy + aDisplacementIn.xy;
  vec2 cursorToPos = pos - uCursor.xy;
  float cursorDist = length(cursorToPos);
  float strength = clamp(1.0 / (1.0 + cursorDist / 0.05) - 0.1, 0.0, 1.0);
  velocity += uCursor.zw * 0.02 * strength * uEffectsStrength.x;
  velocity += -aDisplacementIn.xy * 0.1;
  velocity += cursorToPos * strength * uEffectsStrength.y;
  velocity *= 0.90;
  tf_disp.xy = aDisplacementIn.xy + velocity * 0.1;
  tf_disp.zw = velocity;
  tf_disp = clamp(tf_disp, -1.0, 1.0);
}`;

  const TF_FRAGMENT = `#version 300 es
precision highp float;
void main() {}`;

  const DRAW_VERTEX = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec4 aDisplacementIn;
uniform vec2 uVPRatio;
uniform float uDispStrength;
out float vOpacity;
void main() {
  vec2 pos = aPosition.xy + aDisplacementIn.xy * uDispStrength;
  pos *= uVPRatio;
  gl_Position = vec4(pos, 0.5, 1.0);
  vOpacity = 1.0 - aPosition.z;
}`;

  const DRAW_FRAGMENT = `#version 300 es
precision highp float;
uniform vec4 uColor;
in float vOpacity;
out vec4 fragColor;
void main() {
  fragColor = uColor;
  fragColor.a *= vOpacity;
  fragColor.rgb *= fragColor.a;
}`;

  // additive variant (chroma): rgb pre-scaled, alpha 0 so the page shows through
  const DRAW_FRAGMENT_ADDITIVE = `#version 300 es
precision highp float;
uniform vec4 uColor;
in float vOpacity;
out vec4 fragColor;
void main() {
  fragColor = vec4(uColor.rgb * uColor.a * vOpacity, 0.0);
}`;

  function compileProgram(gl, vsSrc, fsSrc, tfVaryings) {
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("contour shader:", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    const prg = gl.createProgram();
    gl.attachShader(prg, vs);
    gl.attachShader(prg, fs);
    if (tfVaryings) gl.transformFeedbackVaryings(prg, tfVaryings, gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
      console.error("contour program:", gl.getProgramInfoLog(prg));
      return null;
    }
    return prg;
  }

  class ContourEngine {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.opts = Object.assign({}, DEFAULTS, options || {});
      this.gl = null; this.drawPrg = null; this.tfPrg = null;
      this.vbo = null; this.ibo = null; this.dispA = null; this.dispB = null;
      this.tfA = null; this.tfB = null;
      this.vertCount = 0; this.indexCount = 0;
      this.mouseClient = [0, 0]; this.mousePos = [0, 0]; this.mouseVel = [0, 0];
      this.width = 1; this.height = 1; this.raf = 0; this.lastT = 0;
      this.loaded = false; this.disposed = false;
      this.onPointerMove = this.onPointerMove.bind(this);
      this.frame = this.frame.bind(this);
    }

    async load() {
      const gl = this.canvas.getContext("webgl2", {
        alpha: true, premultipliedAlpha: true, antialias: true, depth: false,
      });
      if (!gl) return;
      this.gl = gl;
      this.drawPrg = compileProgram(gl, DRAW_VERTEX,
        this.opts.chromaShift ? DRAW_FRAGMENT_ADDITIVE : DRAW_FRAGMENT);
      this.tfPrg = compileProgram(gl, TF_VERTEX, TF_FRAGMENT, ["tf_disp"]);
      if (!this.drawPrg || !this.tfPrg) return;

      let buf = null;
      for (let attempt = 0; attempt < 3 && !this.disposed; attempt++) {
        const res = await fetch(this.opts.meshUrl);
        const data = res.ok ? await res.arrayBuffer() : null;
        if (data && data.byteLength > 8) { buf = data; break; }
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
      if (!buf || this.disposed) return;
      const header = new Uint32Array(buf, 0, 2);
      this.vertCount = header[0];
      const triCount = header[1];
      const positions = new Float32Array(buf, 8, 3 * this.vertCount);
      const indices = new Uint16Array(buf, 8 + 12 * this.vertCount, 3 * triCount);
      this.indexCount = indices.length;

      this.vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      this.ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

      const zero = new Float32Array(4 * this.vertCount);
      this.dispA = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dispA);
      gl.bufferData(gl.ARRAY_BUFFER, zero, gl.DYNAMIC_COPY);
      this.dispB = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.dispB);
      gl.bufferData(gl.ARRAY_BUFFER, zero, gl.DYNAMIC_COPY);

      this.tfA = gl.createTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tfA);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.dispA);
      this.tfB = gl.createTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tfB);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.dispB);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      document.body.addEventListener("pointermove", this.onPointerMove);
      this.loaded = true;
      this.lastT = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }

    unload() {
      this.disposed = true;
      cancelAnimationFrame(this.raf);
      document.body.removeEventListener("pointermove", this.onPointerMove);
      const gl = this.gl;
      if (gl) {
        for (const b of [this.vbo, this.ibo, this.dispA, this.dispB]) if (b) gl.deleteBuffer(b);
        if (this.tfA) gl.deleteTransformFeedback(this.tfA);
        if (this.tfB) gl.deleteTransformFeedback(this.tfB);
        if (this.drawPrg) gl.deleteProgram(this.drawPrg);
        if (this.tfPrg) gl.deleteProgram(this.tfPrg);
      }
    }

    onPointerMove(e) { this.mouseClient = [e.clientX, e.clientY]; }

    bindAttribs(prg, dispBuffer) {
      const gl = this.gl;
      const aPosition = gl.getAttribLocation(prg, "aPosition");
      const aDisp = gl.getAttribLocation(prg, "aDisplacementIn");
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 12, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, dispBuffer);
      gl.enableVertexAttribArray(aDisp);
      gl.vertexAttribPointer(aDisp, 4, gl.FLOAT, false, 16, 0);
    }

    frame(now) {
      if (this.disposed || !this.gl || !this.loaded) return;
      const dt = Math.max(1e-4, Math.min((now - this.lastT) / 1000, 1 / 20));
      this.lastT = now;
      const gl = this.gl;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
      if (cw && ch && (cw !== this.width || ch !== this.height)) {
        this.width = cw; this.height = ch;
        this.canvas.width = Math.round(cw * dpr);
        this.canvas.height = Math.round(ch * dpr);
      }

      const rect = this.canvas.getBoundingClientRect();
      const tx = (this.mouseClient[0] - rect.left) / this.width;
      const ty = (this.mouseClient[1] - rect.top) / this.height;
      const px = 2 * tx - 1;
      const py = (this.height / this.width) * (-2 * ty + 1);
      this.mouseVel[0] = (px - this.mousePos[0]) / dt;
      this.mouseVel[1] = (py - this.mousePos[1]) / dt;
      if (Math.hypot(this.mouseVel[0], this.mouseVel[1]) > 10) {
        this.mouseVel[0] = 0; this.mouseVel[1] = 0;
      }
      this.mousePos = [px, py];

      gl.useProgram(this.tfPrg);
      this.bindAttribs(this.tfPrg, this.dispA);
      gl.uniform4f(gl.getUniformLocation(this.tfPrg, "uCursor"), px, py, this.mouseVel[0], this.mouseVel[1]);
      gl.uniform2f(gl.getUniformLocation(this.tfPrg, "uEffectsStrength"), this.opts.drag, this.opts.push);
      gl.enable(gl.RASTERIZER_DISCARD);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tfB);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, this.vertCount);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      gl.disable(gl.RASTERIZER_DISCARD);
      [this.dispA, this.dispB] = [this.dispB, this.dispA];
      [this.tfA, this.tfB] = [this.tfB, this.tfA];

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      gl.useProgram(this.drawPrg);
      this.bindAttribs(this.drawPrg, this.dispA);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      const ratio = this.width / this.height;
      const uVPRatio = gl.getUniformLocation(this.drawPrg, "uVPRatio");
      if (ratio > 1) gl.uniform2f(uVPRatio, 1, ratio);
      else gl.uniform2f(uVPRatio, 1 / ratio, 1);

      const uDisp = gl.getUniformLocation(this.drawPrg, "uDispStrength");
      const uColor = gl.getUniformLocation(this.drawPrg, "uColor");
      const c = this.opts.color;

      if (this.opts.chromaShift) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        for (const layer of CHROMA_LAYERS) {
          gl.uniform1f(uDisp, layer.disp);
          gl.uniform4f(uColor,
            layer.mask[0] * c[0], layer.mask[1] * c[1], layer.mask[2] * c[2],
            this.opts.opacity / CHROMA_LAYERS.length);
          gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
        }
        gl.disable(gl.BLEND);
      } else {
        gl.disable(gl.BLEND);
        gl.uniform1f(uDisp, 1);
        gl.uniform4f(uColor, c[0], c[1], c[2], this.opts.opacity);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
      }

      this.raf = requestAnimationFrame(this.frame);
    }
  }

  window.TSXContourEngine = ContourEngine;
})();
