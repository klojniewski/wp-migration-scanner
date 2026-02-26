"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform vec3 u_bg_color;

float patternThreshold(vec2 fragCoord, float gray) {
  float scale = 4.5;
  vec2 cell = floor(fragCoord / scale);
  float charIdx = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  vec2 local = mod(fragCoord, scale) / scale;
  float ch;
  if (gray < 0.15) { ch = 0.0; }
  else if (gray < 0.3) {
    ch = step(0.45, local.x) * step(local.x, 0.55) * step(0.3, local.y) * step(local.y, 0.7);
  } else if (gray < 0.45) {
    float h = step(0.2, local.x) * step(local.x, 0.8) * step(0.45, local.y) * step(local.y, 0.55);
    float v = step(0.45, local.x) * step(local.x, 0.55) * step(0.2, local.y) * step(local.y, 0.8);
    ch = max(h, v);
  } else if (gray < 0.6) {
    float ring = abs(length(local - 0.5) - 0.25);
    ch = step(ring, 0.08);
  } else if (gray < 0.75) {
    float h1 = step(0.2, local.x) * step(local.x, 0.8) * step(0.2, local.y) * step(local.y, 0.3);
    float h2 = step(0.2, local.x) * step(local.x, 0.8) * step(0.45, local.y) * step(local.y, 0.55);
    float h3 = step(0.2, local.x) * step(local.x, 0.8) * step(0.7, local.y) * step(local.y, 0.8);
    float vl = step(0.2, local.x) * step(local.x, 0.3) * step(0.2, local.y) * step(local.y, 0.8);
    ch = max(max(h1, h2), max(h3, vl));
  } else {
    float vl = step(0.2, local.x) * step(local.x, 0.3) * step(0.2, local.y) * step(local.y, 0.8);
    float vr = step(0.7, local.x) * step(local.x, 0.8) * step(0.2, local.y) * step(local.y, 0.8);
    float ht = step(0.2, local.x) * step(local.x, 0.8) * step(0.2, local.y) * step(local.y, 0.3);
    float hb = step(0.2, local.x) * step(local.x, 0.8) * step(0.7, local.y) * step(local.y, 0.8);
    float hm = step(0.2, local.x) * step(local.x, 0.8) * step(0.45, local.y) * step(local.y, 0.55);
    ch = max(max(max(vl, vr), max(ht, hb)), hm);
  }
  return ch;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
    p += vec2(1.7, 9.2);
  }
  return val;
}

void mainImage(out vec4 col, in vec2 pc) {
  float time = u_time * 0.85;
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 uv = pc / u_resolution.xy * aspect;
  float ns = 5.0;
  float wi = 6.0;

  vec2 q = vec2(
    fbm(uv * ns + vec2(0.0, 0.0) + time * 0.3),
    fbm(uv * ns + vec2(5.2, 1.3) - time * 0.2)
  );
  vec2 r = vec2(
    fbm(uv * ns + wi * q + vec2(1.7, 9.2) + time * 0.15),
    fbm(uv * ns + wi * q + vec2(8.3, 2.8) - time * 0.25)
  );
  float f = fbm(uv * ns + wi * r);

  float ridges = abs(sin(f * 12.0 + time));
  ridges = pow(ridges, 0.6);
  float veins = length(q - r) * 1.8;
  veins = smoothstep(0.0, 1.5, veins);
  float pattern = mix(ridges, veins, 0.4 + 0.2 * sin(time * 0.7));
  pattern = pow(pattern, 1.2);
  pattern = smoothstep(0.1, 0.95, pattern);
  col = vec4(vec3(pattern), 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  vec4 baseRaw;
  mainImage(baseRaw, fragCoord);
  float baseGray = dot(baseRaw.rgb, vec3(0.299, 0.587, 0.114));
  float baseBw = patternThreshold(fragCoord, baseGray);
  vec3 color = mix(u_bg_color, u_color, baseBw);

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function ShaderBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const gl =
      canvas.getContext("webgl2", { alpha: false }) ||
      canvas.getContext("webgl", { alpha: false });
    if (!gl || gl.isContextLost()) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    gl.useProgram(program);

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uColor = gl.getUniformLocation(program, "u_color");
    const uBgColor = gl.getUniformLocation(program, "u_bg_color");

    // #f5333f -> normalized RGB
    gl.uniform3f(uColor, 0.96, 0.2, 0.247);
    // #000000
    gl.uniform3f(uBgColor, 0.0, 0.0, 0.0);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uResolution, canvas!.width, canvas!.height);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let rafId: number;
    const startTime = performance.now();

    function draw() {
      const elapsed = (performance.now() - startTime) / 1000;
      gl!.uniform1f(uTime, elapsed);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
