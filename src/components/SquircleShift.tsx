"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface SquircleShiftProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  speed?: number;
  colorLayers?: number;
  gridFrequency?: number;
  gridIntensity?: number;
  waveSpeed?: number;
  waveIntensity?: number;
  spiralIntensity?: number;
  lineThickness?: number;
  falloff?: number;
  centerX?: number;
  centerY?: number;
  colorTint?: string;
  backgroundColor?: string;
  brightness?: number;
  phaseOffset?: number;
}

const vertexSrc = `
attribute vec2 a_position;
varying vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentSrc = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform int u_colorLayers;
uniform float u_gridFrequency;
uniform float u_gridIntensity;
uniform float u_waveSpeed;
uniform float u_waveIntensity;
uniform float u_spiralIntensity;
uniform float u_lineThickness;
uniform float u_falloff;
uniform float u_centerX;
uniform float u_centerY;
uniform vec3 u_colorTint;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_phaseOffset;

varying vec2 vUv;

void main() {
  float animTime = u_time * u_speed;
  vec3 colorAccum = vec3(0.0);
  float dist = 0.0;
  float depth = animTime;

  for (int layer = 0; layer < 3; layer++) {
    if (layer >= u_colorLayers) break;

    vec2 normalizedPos = vUv;
    vec2 centeredPos = vUv;
    centeredPos.x *= u_resolution.x / u_resolution.y;
    centeredPos -= vec2(u_centerX, u_centerY);

    depth += 0.05;
    dist = length(centeredPos);

    float horizontalWave = sin(centeredPos.x * u_gridFrequency + depth);
    float verticalWave = cos(centeredPos.y * u_gridFrequency + depth + u_phaseOffset);
    float gridPattern = u_gridIntensity * horizontalWave * verticalWave;

    float oscillation = sin(depth) + 1.0;
    float radialPulse = abs(sin(dist * 7.0 - depth * u_waveSpeed));
    float waveDisplacement = oscillation * radialPulse * u_waveIntensity;

    normalizedPos += (centeredPos / max(dist, 0.001)) * waveDisplacement * gridPattern;
    normalizedPos = fract(normalizedPos);

    float polarAngle = atan(centeredPos.y, centeredPos.x);
    float polarRadius = dist * 2.0;
    vec2 spiralOffset = vec2(
      cos(polarAngle * polarRadius - depth),
      sin(polarAngle * polarRadius - depth)
    ) * gridPattern * u_spiralIntensity;
    normalizedPos += spiralOffset;

    vec2 gridCell = fract(normalizedPos) - 0.5;
    float intensity = u_lineThickness / length(gridCell);

    if (layer == 0) colorAccum.r = intensity;
    else if (layer == 1) colorAccum.g = intensity;
    else colorAccum.b = intensity;
  }

  colorAccum = colorAccum / (dist + u_falloff);
  colorAccum *= u_brightness;
  vec3 tintedColor = colorAccum * u_colorTint;

  float alpha = clamp(length(colorAccum) * 0.5, 0.0, 1.0);
  vec3 finalColor = mix(u_backgroundColor, tintedColor, alpha);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function hexToRGB(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255,
  ];
}

const SquircleShift: React.FC<SquircleShiftProps> = ({
  width = "100%",
  height = "100%",
  className = "",
  speed = 0.3,
  colorLayers = 3,
  gridFrequency = 25,
  gridIntensity = 1,
  waveSpeed = 0.2,
  waveIntensity = 0.1,
  spiralIntensity = 1,
  lineThickness = 0.06,
  falloff = 1,
  centerX = 1,
  centerY = 1,
  colorTint = "#c084fc",
  backgroundColor = "#000000",
  brightness = 1.5,
  phaseOffset = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, vertexSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);

    const tint = hexToRGB(colorTint);
    const bg = hexToRGB(backgroundColor);

    let animId: number;
    const start = performance.now();

    const render = () => {
      const t = (performance.now() - start) / 1000;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      gl.uniform1f(u("u_time"), t);
      gl.uniform2f(u("u_resolution"), w, h);
      gl.uniform1f(u("u_speed"), speed);
      gl.uniform1i(u("u_colorLayers"), colorLayers);
      gl.uniform1f(u("u_gridFrequency"), gridFrequency);
      gl.uniform1f(u("u_gridIntensity"), gridIntensity);
      gl.uniform1f(u("u_waveSpeed"), waveSpeed);
      gl.uniform1f(u("u_waveIntensity"), waveIntensity);
      gl.uniform1f(u("u_spiralIntensity"), spiralIntensity);
      gl.uniform1f(u("u_lineThickness"), lineThickness);
      gl.uniform1f(u("u_falloff"), falloff);
      gl.uniform1f(u("u_centerX"), centerX);
      gl.uniform1f(u("u_centerY"), centerY);
      gl.uniform3f(u("u_colorTint"), tint[0], tint[1], tint[2]);
      gl.uniform3f(u("u_backgroundColor"), bg[0], bg[1], bg[2]);
      gl.uniform1f(u("u_brightness"), brightness);
      gl.uniform1f(u("u_phaseOffset"), phaseOffset);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [speed, colorLayers, gridFrequency, gridIntensity, waveSpeed, waveIntensity, spiralIntensity, lineThickness, falloff, centerX, centerY, colorTint, backgroundColor, brightness, phaseOffset]);

  const widthStyle = typeof width === "number" ? `${width}px` : width;
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: widthStyle, height: heightStyle }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
};

SquircleShift.displayName = "SquircleShift";
export default SquircleShift;
