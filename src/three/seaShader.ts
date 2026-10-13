/**
 * Raging Sea — ported from github.com/HAP2Y/Raging-Sea-Shader-3D-Web.
 *
 * Same structure as the original: two crossed sine "big waves", minus layered
 * |Perlin| "small waves", coloured by elevation between a depth and a surface
 * colour. Additions for this site:
 *   uTravel   scrolls the waves toward the camera as the world drifts
 *   uBg/uFade blend into the page background with distance (no hard horizon)
 */

// Classic Perlin 3D Noise by Stefan Gustavson (unchanged from the original repo)
const cnoise = /* glsl */ `
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`

export const seaVertex = /* glsl */ `
uniform float uTime;
uniform float uTravel;
uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uBigWavesSpeed;
uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallIterations;
varying float vElevation;
varying float vDepth;
${cnoise}
void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec2 p = vec2(modelPosition.x, modelPosition.z - uTravel);

  float elevation = sin(p.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) *
                    sin(p.y * uBigWavesFrequency.y + uTime * uBigWavesSpeed) *
                    uBigWavesElevation;

  for (float i = 1.0; i <= 4.0; i++) {
    if (i > uSmallIterations) break;
    elevation -= abs(cnoise(vec3(p * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation) / i;
  }

  modelPosition.y += elevation;
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;
  vElevation = elevation;
  vDepth = -viewPosition.z;
}
`

export const seaFragment = /* glsl */ `
uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform vec3 uBg;
uniform vec2 uFade; // near, far
varying float vElevation;
varying float vDepth;
void main() {
  float mixStrength = clamp((vElevation + uColorOffset) * uColorMultiplier, 0.0, 1.0);
  vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
  float fade = smoothstep(uFade.x, uFade.y, vDepth);
  gl_FragColor = vec4(mix(color, uBg, fade), 1.0);
  #include <colorspace_fragment>
}
`

export interface SeaParams {
  bigElevation: number
  bigFrequency: [number, number]
  bigSpeed: number
  smallElevation: number
  smallFrequency: number
  smallSpeed: number
  smallIterations: number
  colorOffset: number
  colorMultiplier: number
}

/** The original repo's defaults (plane 2×2 units). */
export const ORIGINAL: SeaParams = {
  bigElevation: 0.2,
  bigFrequency: [4, 1.5],
  bigSpeed: 0.75,
  smallElevation: 0.15,
  smallFrequency: 3,
  smallSpeed: 0.2,
  smallIterations: 4,
  colorOffset: 0.08,
  colorMultiplier: 5,
}

/** Calm, low-amplitude version scaled up for a ground plane ~240 units wide. */
export const CALM: SeaParams = {
  bigElevation: 1.1,
  bigFrequency: [0.09, 0.05],
  bigSpeed: 0.35,
  smallElevation: 0.55,
  smallFrequency: 0.09,
  smallSpeed: 0.12,
  smallIterations: 2,
  colorOffset: 0.9,
  colorMultiplier: 0.45,
}

export function seaUniforms(p: SeaParams) {
  return {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uBigWavesElevation: { value: p.bigElevation },
    uBigWavesFrequency: { value: { x: p.bigFrequency[0], y: p.bigFrequency[1] } },
    uBigWavesSpeed: { value: p.bigSpeed },
    uSmallWavesElevation: { value: p.smallElevation },
    uSmallWavesFrequency: { value: p.smallFrequency },
    uSmallWavesSpeed: { value: p.smallSpeed },
    uSmallIterations: { value: p.smallIterations },
    uDepthColor: { value: null as unknown },
    uSurfaceColor: { value: null as unknown },
    uColorOffset: { value: p.colorOffset },
    uColorMultiplier: { value: p.colorMultiplier },
    uBg: { value: null as unknown },
    uFade: { value: { x: 30, y: 140 } },
  }
}
