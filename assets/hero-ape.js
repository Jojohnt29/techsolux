/* ============================================================
   TECHSOLUX — hero-ape.js
   Faithful vanilla-JS port of the ApeChain hero:
   - HeroWheelEngine  : WebGL2 bent-card wheel (curved ring of cards)
   - HeroContourEngine: WebGL2 topographic contour-line background
   Data is swapped to TechSolux's 6 featured projects (window.PROJECTS).
   Engines transcribed from the original TS — mechanics unchanged.
   ============================================================ */
(function () {
  "use strict";

  /* ============================================================
     WHEEL ENGINE  (bent card meshes on an ellipse)
     ============================================================ */
  const TEX_W = 1800, TEX_H = 1080;
  const CARD_ASPECT = 5 / 3;
  const CARD_MARGIN = 0.1;
  const COLS = 20;
  const IDLE_DURATION = 5;
  const IDLE_CREEP = 0.125;
  const HFOV = (35 * Math.PI) / 180;
  const NEAR = 0.1, FAR = 10;
  const BASE_ROT_X = -0.18;
  const BASE_ROT_Z = 0.12;
  const POINTER_ROT = 0.05;
  const DRAG_SENSITIVITY = 0.15;
  const DRAG_SNAP_THRESHOLD = 0.05;
  const DRAG_SCALE = 0.02;

  const MODE_IDLE = 0, MODE_TRANSITIONING = 1, MODE_DRAGGING = 2;

  const easePower2InOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const easePower1Out = (t) => 1 - (1 - t) * (1 - t);
  const easeCubicInOut = (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

  const mat4Identity = () =>
    new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  function mat4Multiply(out, a, b) {
    const r = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let row = 0; row < 4; row++) {
        r[c * 4 + row] =
          a[row] * b[c * 4] +
          a[4 + row] * b[c * 4 + 1] +
          a[8 + row] * b[c * 4 + 2] +
          a[12 + row] * b[c * 4 + 3];
      }
    }
    out.set(r);
    return out;
  }

  function mat4PerspectiveHorizontal(out, hfov, aspect, near, far) {
    const f = 1 / Math.tan(hfov / 2);
    out.fill(0);
    out[0] = f;
    out[5] = f * aspect;
    out[10] = -(far + near) / (far - near);
    out[11] = -1;
    out[14] = -(2 * far * near) / (far - near);
    return out;
  }

  const mat4RotateX = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  };
  const mat4RotateY = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  };
  const mat4RotateZ = (a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  };

  const VERTEX_SRC = `#version 300 es
precision highp float;
in vec2 aPosition;
in vec2 aTexCoord;
in vec2 aInstance;
uniform float uProgress;
uniform float uRadius;
uniform float uStride;
uniform mat4 uMVP;
out vec3 vUv;
out vec2 vNdc;
const float PI = 3.14159265359;
void main() {
  vec2 p = aPosition * (1.0 - ${CARD_MARGIN.toFixed(2)});
  float circleProgress = -(aInstance.x + p.x * uStride) + uProgress + 0.25;
  float angle = circleProgress * 2.0 * PI;
  vec3 world = vec3(cos(angle) * uRadius, p.y, sin(angle) * uRadius * 0.5);
  gl_Position = uMVP * vec4(world, 1.0);
  vUv = vec3(aTexCoord, aInstance.y);
  vNdc = gl_Position.xy / gl_Position.w;
}`;

  const FRAGMENT_SRC = `#version 300 es
precision highp float;
uniform mediump sampler2DArray uTextures;
in vec3 vUv;
in vec2 vNdc;
out vec4 fragColor;
void main() {
  vec3 uv = vUv;
  uv.x = gl_FrontFacing ? uv.x : 1.0 - uv.x;
  float crisp = gl_FrontFacing ? 0.0 : 1.0;
  vec4 sharp = texture(uTextures, uv);
  vec4 soft = texture(uTextures, uv, 1.0);
  fragColor = mix(soft, sharp, crisp);
  fragColor.rgb *= 0.5 + crisp * 0.5;
  fragColor.a *= clamp(smoothstep(-1.0, -0.8, vNdc.y), 0.0, 1.0);
}`;

  class HeroWheelEngine {
    constructor(canvas, textureUrls, onState) {
      this.canvas = canvas;
      this.urls = textureUrls;
      this.listener = onState;
      this.cardCount = textureUrls.length;
      this.stepSize = 1 / this.cardCount;
      this.radius = 1 / (2 * Math.sin(Math.PI / this.cardCount));
      this.gl = null; this.program = null; this.vao = null; this.texture = null;
      this.uniforms = {};
      this.indexCount = 0;
      this.mode = MODE_IDLE;
      this.currentCard = 0; this.targetCard = 0;
      this.progress = 0; this.idleTime = 0; this.tween = null;
      this.dragStartCoord = [0, 0]; this.dragStartProgress = 0;
      this.dragDelta = 0; this.dragTime = 0;
      this.pointerCoord = [0, 0]; this.smoothPointer = [0, 0];
      this.wheelY = -0.1; this.width = 1; this.height = 1;
      this.raf = 0; this.lastT = 0; this.disposed = false; this.loaded = false;
      this.proj = mat4Identity();
      this.onPointerDown = this.onPointerDown.bind(this);
      this.onPointerMove = this.onPointerMove.bind(this);
      this.onPointerUp = this.onPointerUp.bind(this);
      this.frame = this.frame.bind(this);
    }

    async load() {
      const gl = this.canvas.getContext("webgl2", {
        alpha: true, premultipliedAlpha: false, antialias: true, depth: true,
      });
      if (!gl) return;
      this.gl = gl;
      this.program = this.buildProgram(gl);
      if (!this.program) return;
      for (const name of ["uProgress", "uRadius", "uStride", "uMVP", "uTextures"]) {
        this.uniforms[name] = gl.getUniformLocation(this.program, name);
      }
      this.buildGeometry(gl);
      this.resize();
      await this.loadTextures(gl);
      if (this.disposed) return;
      this.canvas.addEventListener("pointerdown", this.onPointerDown);
      this.canvas.addEventListener("pointermove", this.onPointerMove);
      this.canvas.addEventListener("pointerup", this.onPointerUp);
      this.canvas.addEventListener("pointercancel", this.onPointerUp);
      this.loaded = true;
      this.lastT = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }

    unload() {
      this.disposed = true;
      cancelAnimationFrame(this.raf);
      this.canvas.removeEventListener("pointerdown", this.onPointerDown);
      this.canvas.removeEventListener("pointermove", this.onPointerMove);
      this.canvas.removeEventListener("pointerup", this.onPointerUp);
      this.canvas.removeEventListener("pointercancel", this.onPointerUp);
      const gl = this.gl;
      if (gl) {
        if (this.texture) gl.deleteTexture(this.texture);
        if (this.program) gl.deleteProgram(this.program);
        if (this.vao) gl.deleteVertexArray(this.vao);
      }
    }

    buildProgram(gl) {
      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.error("hero wheel shader:", gl.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      };
      const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
      if (!vs || !fs) return null;
      const prg = gl.createProgram();
      gl.attachShader(prg, vs);
      gl.attachShader(prg, fs);
      gl.linkProgram(prg);
      if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        console.error("hero wheel program:", gl.getProgramInfoLog(prg));
        return null;
      }
      return prg;
    }

    buildGeometry(gl) {
      const verts = new Float32Array(COLS * 2 * 4);
      let v = 0;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < COLS; col++) {
          verts[v++] = col / (COLS - 1) - 0.5;
          verts[v++] = (row - 0.5) / CARD_ASPECT;
          verts[v++] = 1 - col / (COLS - 1);
          verts[v++] = row;
        }
      }
      const idx = new Uint16Array((COLS - 1) * 6);
      let n = 0;
      for (let col = 0; col < COLS - 1; col++) {
        const i = col, r = i + 1, s = i + COLS, o = s + 1;
        idx[n++] = i; idx[n++] = s; idx[n++] = r;
        idx[n++] = r; idx[n++] = s; idx[n++] = o;
      }
      this.indexCount = idx.length;

      const instances = new Float32Array(this.cardCount * 2);
      for (let i = 0; i < this.cardCount; i++) {
        instances[2 * i] = i / this.cardCount;
        instances[2 * i + 1] = i;
      }

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      const aPosition = gl.getAttribLocation(this.program, "aPosition");
      const aTexCoord = gl.getAttribLocation(this.program, "aTexCoord");
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aTexCoord);
      gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

      const ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

      const inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.bufferData(gl.ARRAY_BUFFER, instances, gl.STATIC_DRAW);
      const aInstance = gl.getAttribLocation(this.program, "aInstance");
      gl.enableVertexAttribArray(aInstance);
      gl.vertexAttribPointer(aInstance, 2, gl.FLOAT, false, 8, 0);
      gl.vertexAttribDivisor(aInstance, 1);

      gl.bindVertexArray(null);
      this.vao = vao;
    }

    async loadTextures(gl) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 8, gl.RGB8, TEX_W, TEX_H, this.cardCount);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      await Promise.all(
        this.urls.map(async (url, layer) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          await new Promise((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej(new Error(`hero texture failed: ${url}`));
          }).catch((e) => console.error(e));
          if (this.disposed || !img.width) return;
          let source = img;
          if (img.width !== TEX_W || img.height !== TEX_H) {
            const c = document.createElement("canvas");
            c.width = TEX_W; c.height = TEX_H;
            c.getContext("2d").drawImage(img, 0, 0, TEX_W, TEX_H);
            source = c;
          }
          gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
          gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TEX_W, TEX_H, 1, gl.RGB, gl.UNSIGNED_BYTE, source);
        }),
      );
      if (this.disposed) return;
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      this.texture = tex;
    }

    cardIndexToProgress(i) { return this.stepSize * i; }

    goTo(index, duration = 1.15) {
      this.mode = MODE_TRANSITIONING;
      this.tween = null;
      const from = this.cardIndexToProgress(this.targetCard);
      let to = this.cardIndexToProgress(index);
      if (from >= 1 - (this.stepSize + 0.01) && index === 0) to += 1;
      if (from <= this.stepSize + 0.01 && index === this.cardCount - 1) to -= 1;
      this.idleTime = 0;
      this.targetCard = index;
      this.emit();
      this.tween = {
        from: this.progress, to, start: performance.now(),
        duration: duration * 1000, ease: easePower2InOut,
        onComplete: () => {
          this.mode = MODE_IDLE;
          this.currentCard = index;
          this.progress = this.cardIndexToProgress(index);
        },
      };
    }
    goToNext() { this.goTo((this.targetCard + 1) % this.cardCount, 0.5); }
    goToPrev() { this.goTo((this.targetCard - 1 + this.cardCount) % this.cardCount, 0.5); }

    onPointerDown(e) {
      if (this.mode === MODE_TRANSITIONING) return;
      this.tween = null;
      this.mode = MODE_DRAGGING;
      this.canvas.setPointerCapture(e.pointerId);
      this.dragStartCoord = [e.clientX, e.clientY];
      this.dragStartProgress = this.progress;
      this.dragDelta = 0;
    }
    onPointerMove(e) {
      this.pointerCoord = [e.clientX, e.clientY];
      if (this.mode !== MODE_DRAGGING) return;
      this.dragDelta = ((e.clientX - this.dragStartCoord[0]) / this.width) * DRAG_SENSITIVITY;
      this.progress = (this.dragStartProgress - this.dragDelta) % 1;
    }
    onPointerUp() {
      if (this.mode !== MODE_DRAGGING) return;
      this.mode = MODE_TRANSITIONING;
      if (Math.abs(this.dragDelta) > DRAG_SNAP_THRESHOLD * this.stepSize) {
        if (Math.sign(this.dragDelta) < 0) this.goToNext();
        else this.goToPrev();
        return;
      }
      this.tween = {
        from: this.progress, to: this.dragStartProgress,
        start: performance.now(), duration: 300, ease: easePower1Out,
        onComplete: () => { this.mode = MODE_IDLE; },
      };
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      if (!w || !h) return;
      this.width = w; this.height = h;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.wheelY = w < 768 ? 0.5 : -0.1;
      mat4PerspectiveHorizontal(this.proj, HFOV, w / h, NEAR, FAR);
    }

    idle(dt) {
      this.idleTime += dt;
      const idleProgress = this.idleTime / IDLE_DURATION;
      this.progress =
        this.cardIndexToProgress(this.currentCard) + idleProgress * this.stepSize * IDLE_CREEP;
      if (idleProgress >= 1) {
        this.idleTime = 0;
        this.goTo((this.currentCard + 1) % this.cardCount);
      }
    }

    frame(now) {
      if (this.disposed || !this.gl || !this.loaded) return;
      const dt = Math.min((now - this.lastT) / 1000, 1 / 20);
      this.lastT = now;
      if (this.canvas.clientWidth !== this.width || this.canvas.clientHeight !== this.height) {
        this.resize();
      }
      if (this.mode === MODE_IDLE) this.idle(dt);
      if (this.tween) {
        const t = Math.min(1, (now - this.tween.start) / this.tween.duration);
        this.progress = this.tween.from + (this.tween.to - this.tween.from) * this.tween.ease(t);
        if (t >= 1) { const done = this.tween.onComplete; this.tween = null; if (done) done(); }
      }
      this.emit();

      this.dragTime += (this.mode === MODE_DRAGGING ? 5 : -5) * dt;
      this.dragTime = Math.max(0, Math.min(1, this.dragTime));
      const scale = 1 - DRAG_SCALE * easeCubicInOut(this.dragTime);

      this.smoothPointer[0] += (this.pointerCoord[0] - this.smoothPointer[0]) * dt * 5;
      this.smoothPointer[1] += (this.pointerCoord[1] - this.smoothPointer[1]) * dt * 5;
      const nx = (this.smoothPointer[0] / this.width) * 2 - 1;
      const ny = (this.smoothPointer[1] / this.height) * 2 - 1;

      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      if (!this.texture) { this.raf = requestAnimationFrame(this.frame); return; }

      const m = mat4Identity();
      m[12] = 0; m[13] = this.wheelY; m[14] = -(2 * this.radius) - 0.8;
      mat4Multiply(m, m, mat4RotateX(BASE_ROT_X));
      mat4Multiply(m, m, mat4RotateZ(BASE_ROT_Z));
      mat4Multiply(m, m, mat4RotateY(-POINTER_ROT * nx));
      mat4Multiply(m, m, mat4RotateX(POINTER_ROT * ny));
      for (let i = 0; i < 12; i++) m[i] *= scale;
      const mvp = mat4Identity();
      mat4Multiply(mvp, this.proj, m);

      gl.useProgram(this.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
      gl.uniform1i(this.uniforms.uTextures, 0);
      gl.uniform1f(this.uniforms.uProgress, this.progress);
      gl.uniform1f(this.uniforms.uRadius, this.radius);
      gl.uniform1f(this.uniforms.uStride, this.stepSize);
      gl.uniformMatrix4fv(this.uniforms.uMVP, false, mvp);
      gl.bindVertexArray(this.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.cardCount);
      gl.bindVertexArray(null);

      this.raf = requestAnimationFrame(this.frame);
    }

    emit() { this.listener({ activeCard: this.targetCard, idleTime: this.idleTime }); }
  }

  /* ============================================================
     CONTOUR ENGINE  (pre-baked mesh + transform-feedback springs)
     ============================================================ */
  const LINE_COLOR = [1, 1, 1];
  const LINE_OPACITY = 0.2;
  const DRAG_STRENGTH = 0.2;
  const PUSH_STRENGTH = 0.2;
  const DISP_STRENGTH = 1;
  const MESH_URL = "assets/gl/ape_bg.dat";

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

  class HeroContourEngine {
    constructor(canvas) {
      this.canvas = canvas;
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
      this.drawPrg = compileProgram(gl, DRAW_VERTEX, DRAW_FRAGMENT);
      this.tfPrg = compileProgram(gl, TF_VERTEX, TF_FRAGMENT, ["tf_disp"]);
      if (!this.drawPrg || !this.tfPrg) return;

      let buf = null;
      for (let attempt = 0; attempt < 3 && !this.disposed; attempt++) {
        const res = await fetch(MESH_URL);
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
      gl.uniform2f(gl.getUniformLocation(this.tfPrg, "uEffectsStrength"), DRAG_STRENGTH, PUSH_STRENGTH);
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
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      gl.useProgram(this.drawPrg);
      this.bindAttribs(this.drawPrg, this.dispA);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      const ratio = this.width / this.height;
      if (ratio > 1) gl.uniform2f(gl.getUniformLocation(this.drawPrg, "uVPRatio"), 1, ratio);
      else gl.uniform2f(gl.getUniformLocation(this.drawPrg, "uVPRatio"), 1 / ratio, 1);
      gl.uniform1f(gl.getUniformLocation(this.drawPrg, "uDispStrength"), DISP_STRENGTH);
      gl.uniform4f(gl.getUniformLocation(this.drawPrg, "uColor"), LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2], LINE_OPACITY);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

      this.raf = requestAnimationFrame(this.frame);
    }
  }

  /* ============================================================
     OVERLAY CONTROLLER  (TechSolux data + DOM wiring)
     ============================================================ */
  function init() {
    const ALL = window.PROJECTS || [];
    const SLUGS = ["paris-beaute", "kultu-tv", "boutique-informatique", "ar-studio-beauty", "grand-hiver", "ovote"];
    const F = SLUGS.map((s) => ALL.find((p) => p.slug === s)).filter(Boolean);
    if (!F.length) return;

    const GRAD = {
      "paris-beaute": "radial-gradient(120% 120% at 20% 20%, #f4c9d6 0%, #2a0f1c 55%, #d96a9a 100%)",
      "kultu-tv": "radial-gradient(120% 120% at 20% 20%, #f2a900 0%, #1a0306 55%, #c8102e 100%)",
      "boutique-informatique": "radial-gradient(120% 120% at 20% 20%, #27c6ff 0%, #070a1c 55%, #4353ff 100%)",
      "ar-studio-beauty": "radial-gradient(120% 120% at 25% 25%, #e8cfa3 0%, #1c1206 55%, #b88746 100%)",
      "grand-hiver": "radial-gradient(120% 120% at 25% 20%, #a8dadc 0%, #06121c 55%, #2c7fb8 100%)",
      "ovote": "radial-gradient(120% 120% at 25% 20%, #9e8bff 0%, #070a14 55%, #4353ff 100%)",
    };

    const slides = F.map((p) => ({
      slug: p.slug,
      category: (p.type + " · " + p.sector).toUpperCase(),
      title: p.name,
      description: p.tagline,
      href: `case-study.html?p=${p.slug}`,
      texture: p.image,
      bg: GRAD[p.slug] || "radial-gradient(120% 120% at 20% 20%, #1a2140 0%, #070a14 60%, #4353ff 100%)",
    }));
    const N = slides.length;

    const section = document.getElementById("top");
    const wheelCanvas = document.getElementById("hxa-wheel");
    const contourCanvas = document.getElementById("hxa-contour");
    const bgWrap = document.getElementById("hxa-bg");
    const catEl = document.getElementById("hxa-cat");
    const titleEl = document.getElementById("hxa-title");
    const descEl = document.getElementById("hxa-desc");
    const ctaEl = document.getElementById("hxa-cta");
    const ctaLabel = document.getElementById("hxa-cta-label");
    const thumbsEl = document.getElementById("hxa-thumbs");
    const prevBtn = document.getElementById("hxa-prev");
    const nextBtn = document.getElementById("hxa-next");
    if (!section || !wheelCanvas || !contourCanvas) return;

    // per-slide cross-fading gradient layers
    bgWrap.innerHTML = slides
      .map((s, i) => `<div class="hxa__bg-layer${i === 0 ? " is-on" : ""}" data-i="${i}" style="background:${s.bg}"></div>`)
      .join("");
    const bgLayers = [...bgWrap.querySelectorAll(".hxa__bg-layer")];

    // thumbnails with idle-progress bar
    thumbsEl.innerHTML = slides
      .map(
        (s, i) => `<button class="hxa__thumb${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Voir ${s.title}">
        <img src="${s.texture}" alt="${s.title}" loading="lazy">
        <span class="hxa__thumb-veil"></span>
        <span class="hxa__thumb-bar"><i></i></span>
      </button>`,
      )
      .join("");
    const thumbs = [...thumbsEl.querySelectorAll(".hxa__thumb")];

    let active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      const s = slides[i];
      // restart reveal animations by reflow
      [catEl, titleEl, descEl].forEach((el) => {
        el.classList.remove("hxa-reveal");
        void el.offsetWidth;
        el.classList.add("hxa-reveal");
      });
      catEl.textContent = s.category;
      titleEl.textContent = s.title;
      descEl.textContent = s.description;
      ctaEl.href = s.href;
      ctaLabel.textContent = F[i].cat === "mobile" ? "Voir l'app" : "Voir le projet";
      thumbs.forEach((t, k) => t.classList.toggle("is-active", k === i));
      bgLayers.forEach((l, k) => l.classList.toggle("is-on", k === i));
    }

    const onState = (st) => {
      setActive(st.activeCard);
      section.style.setProperty("--hero-idle", String(Math.min(1, st.idleTime / 5)));
    };

    const wheel = new HeroWheelEngine(wheelCanvas, slides.map((s) => s.texture), onState);
    const contour = new HeroContourEngine(contourCanvas);
    wheel.load();
    contour.load();

    nextBtn && nextBtn.addEventListener("click", () => wheel.goToNext());
    prevBtn && prevBtn.addEventListener("click", () => wheel.goToPrev());
    thumbs.forEach((t) => t.addEventListener("click", () => wheel.goTo(+t.dataset.i, 1.15)));

    setActive(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
