import { BeautyConfig, EffectId, FaceLandmarksData, RenderComparisonMode } from "../types";

export class GpuPipeline {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private cameraTexture: WebGLTexture | null = null;
  private skinMaskTexture: WebGLTexture | null = null;
  private skinMaskCanvas: HTMLCanvasElement;
  private skinMaskCtx: CanvasRenderingContext2D | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private cameraQuadBuffer: WebGLBuffer | null = null;
  private fboQuadBuffer: WebGLBuffer | null = null;
  private beautyProgram: WebGLProgram | null = null;
  private effectsProgramMap: Map<string, WebGLProgram> = new Map();
  private passthroughProgram: WebGLProgram | null = null;
  private isSupported: boolean = false;
  private textureYFlipCompensated: boolean = true;
  private lastSkinMaskUpdateTime = 0;

  // Multi-pass Framebuffer for simultaneous Beauty + Effects compositing
  private fbo: WebGLFramebuffer | null = null;
  private fboTexture: WebGLTexture | null = null;
  private fboWidth: number = 0;
  private fboHeight: number = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.skinMaskCanvas = document.createElement("canvas");
    this.skinMaskCanvas.width = 256;
    this.skinMaskCanvas.height = 256;
    this.skinMaskCtx = this.skinMaskCanvas.getContext("2d", { willReadFrequently: true });
    this.initWebGL();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public isAvailable(): boolean {
    return this.isSupported && !!this.gl;
  }

  public isTextureYFlipActive(): boolean {
    return this.textureYFlipCompensated && !!this.fboQuadBuffer;
  }

  private initWebGL(): void {
    try {
      this.gl =
        (this.canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGL2RenderingContext) ||
        (this.canvas.getContext("webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext);

      if (!this.gl) {
        this.isSupported = false;
        return;
      }

      const gl = this.gl;

      // 1. Camera quad buffer: Map raw camera video (row 0 at top, t=0.0) to upright screen
      this.cameraQuadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.cameraQuadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1, 0, 1,
           1, -1, 1, 1,
          -1,  1, 0, 0,
          -1,  1, 0, 0,
           1, -1, 1, 1,
           1,  1, 1, 0,
        ]),
        gl.STATIC_DRAW
      );

      // 2. FBO quad buffer: In WebGL FBO textures, row 0 (t=0.0) is the bottom of the FBO, and row H (t=1.0) is the top.
      // To sample the FBO texture upright onto the output canvas, at gl_Position.y = +1.0 (top) we sample t = 1.0,
      // and at gl_Position.y = -1.0 (bottom) we sample t = 0.0. This completely eliminates 180° / Y-flip inversion!
      this.fboQuadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fboQuadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1, 0, 0,
           1, -1, 1, 0,
          -1,  1, 0, 1,
          -1,  1, 0, 1,
           1, -1, 1, 0,
           1,  1, 1, 1,
        ]),
        gl.STATIC_DRAW
      );

      this.quadBuffer = this.cameraQuadBuffer;

      // Camera input texture
      this.cameraTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Low-resolution face/skin mask. It is generated from the same 478-point
      // tracker and sampled by the beauty shader; this prevents smoothing from
      // spilling into hair, beard, eyes and lips.
      this.skinMaskTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.skinMaskTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      this.buildShaders();
      this.isSupported = true;
    } catch (err) {
      this.isSupported = false;
    }
  }

  private buildShaders(): void {
    if (!this.gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      varying vec2 v_screenCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        // Screen coordinates: (0,0) is top-left, (1,1) is bottom-right
        v_screenCoord = vec2(a_position.x * 0.5 + 0.5, -a_position.y * 0.5 + 0.5);
      }
    `;

    // 1. PASSTHROUGH
    const passthroughFs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `;
    this.passthroughProgram = this.compileProgram(vsSource, passthroughFs);

    // 2. REAL BEAUTY SHADER (Bilateral smoothing, geometric warp deformation, tone, glow, sharpness, lips, teeth)
    const beautyFs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform sampler2D u_skinMask;
      uniform vec2 u_resolution;
      uniform float u_smooth;
      uniform float u_glow;
      uniform float u_tone;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_sharpness;
      uniform float u_faceSlim;
      uniform float u_eyeScale;
      uniform float u_noseSlim;
      uniform float u_jaw;
      uniform float u_lips;
      uniform float u_teeth;
      uniform float u_eyeBright;
      uniform float u_noiseReduction;
      uniform float u_vibrance;
      uniform int u_faceDetected;
      uniform vec2 u_leftEye;
      uniform vec2 u_rightEye;
      uniform vec2 u_noseTip;
      uniform vec2 u_mouthCenter;
      uniform vec2 u_leftCheek;
      uniform vec2 u_rightCheek;
      uniform vec2 u_forehead;
      uniform vec2 u_chin;
      uniform float u_mouthOpen;

      float ellipseMask(vec2 uv, vec2 center, vec2 radius) {
        vec2 d = (uv - center) / radius;
        float q = dot(d, d);
        return 1.0 - smoothstep(0.70, 1.05, q);
      }

      vec2 warpFace(vec2 uv) {
        if (u_faceDetected == 0) return uv;
        vec2 outUv = uv;
        float faceW = max(distance(u_leftCheek, u_rightCheek), 0.20);
        float faceH = max(distance(u_forehead, u_chin), 0.30);

        if (u_eyeScale > 0.0) {
          float r = max(faceW * 0.16, 0.045);
          float s = (u_eyeScale / 100.0) * 0.24;
          float dl = distance(uv, u_leftEye);
          float dr = distance(uv, u_rightEye);
          if (dl < r) {
            float w = pow(1.0 - smoothstep(0.0, r, dl), 2.0);
            outUv = mix(outUv, u_leftEye + (outUv - u_leftEye) * (1.0 + s), w);
          }
          if (dr < r) {
            float w = pow(1.0 - smoothstep(0.0, r, dr), 2.0);
            outUv = mix(outUv, u_rightEye + (outUv - u_rightEye) * (1.0 + s), w);
          }
        }

        if (u_faceSlim > 0.0) {
          float y0 = (u_leftEye.y + u_rightEye.y) * 0.5;
          float y1 = u_chin.y;
          float yp = clamp((uv.y - y0) / max(y1 - y0, 0.20), 0.0, 1.0);
          float yw = sin(yp * 3.1415926);
          float halfW = max(faceW * 0.52, 0.12);
          float dx = uv.x - u_noseTip.x;
          float nx = abs(dx) / halfW;
          float xw = 1.0 - smoothstep(0.35, 1.0, nx);
          float shift = (u_faceSlim / 100.0) * 0.035 * yw * xw;
          outUv.x += dx < 0.0 ? -shift : shift;
        }

        if (u_noseSlim > 0.0) {
          vec2 d = uv - u_noseTip;
          float rx = max(faceW * 0.105, 0.025);
          float ry = max(faceH * 0.15, 0.045);
          float q = dot(vec2(d.x / rx, d.y / ry), vec2(d.x / rx, d.y / ry));
          if (q < 1.0) {
            float w = 1.0 - smoothstep(0.0, 1.0, q);
            float pinch = (u_noseSlim / 100.0) * 0.018 * w;
            outUv.x += d.x < 0.0 ? -pinch : pinch;
          }
        }

        if (u_jaw > 0.0) {
          float r = max(faceW * 0.28, 0.07);
          float d = distance(uv, u_chin);
          if (d < r) {
            float w = 1.0 - smoothstep(0.0, r, d);
            outUv.y += (u_jaw / 100.0) * 0.018 * w;
          }
        }
        return clamp(outUv, 0.0, 1.0);
      }

      void main() {
        vec2 uv = warpFace(v_texCoord);
        vec4 base = texture2D(u_image, uv);
        vec3 color = base.rgb;

        float faceMask = 0.0;
        float skinMask = 0.0;
        if (u_faceDetected == 1) {
          vec2 center = (u_leftCheek + u_rightCheek + u_forehead + u_chin) * 0.25;
          vec2 radius = vec2(max(distance(u_leftCheek, u_rightCheek) * 0.58, 0.13),
                             max(distance(u_forehead, u_chin) * 0.56, 0.18));
          faceMask = ellipseMask(uv, center, radius);

          float Y = dot(color, vec3(0.299, 0.587, 0.114));
          float Cb = dot(color, vec3(-0.168736, -0.331264, 0.5)) + 0.5;
          float Cr = dot(color, vec3(0.5, -0.418688, -0.081312)) + 0.5;
          // Broad YCbCr skin classifier. The tracked face mask is the primary
          // geometry constraint; chroma only decides which face pixels are skin.
          // Unlike the previous max(chroma, 0.62) fallback, this does not blur
          // beard/hair simply because they sit inside the face oval.
          // Conservative skin chroma confidence. This is intentionally a
          // confidence mask, not a color wash: neutral/white pixels and dark
          // beard/hair should not become beauty targets.
          float cbBand = smoothstep(0.28, 0.36, Cb) * (1.0 - smoothstep(0.58, 0.66, Cb));
          float crBand = smoothstep(0.44, 0.50, Cr) * (1.0 - smoothstep(0.78, 0.84, Cr));
          float warmBias = smoothstep(0.02, 0.16, Cr - Cb);
          float luminanceGate = smoothstep(0.07, 0.24, Y) * (1.0 - smoothstep(0.88, 0.98, Y));
          float chromaSkin = clamp(cbBand * crBand * warmBias * luminanceGate * 2.4, 0.0, 1.0);
          float trackedSkin = texture2D(u_skinMask, uv).r;

          float eyeR = max(distance(u_leftEye, u_rightEye) * 0.15, 0.035);
          float eyeCut = max(ellipseMask(uv, u_leftEye, vec2(eyeR * 1.5, eyeR)),
                             ellipseMask(uv, u_rightEye, vec2(eyeR * 1.5, eyeR)));
          float mouthCut = ellipseMask(uv, u_mouthCenter, vec2(radius.x * 0.38, radius.y * 0.18));
          float browCut = max(ellipseMask(uv, u_leftEye + vec2(0.0, -radius.y * 0.18), vec2(eyeR * 1.7, eyeR * 0.65)),
                              ellipseMask(uv, u_rightEye + vec2(0.0, -radius.y * 0.18), vec2(eyeR * 1.7, eyeR * 0.65)));
          // The face ellipse is only a fallback support mask; chroma + facial
          // feature exclusions keep the enhancement on skin and off hair/eyes/lips.
          // Beauty must be skin-only. Do not use the whole face oval as a fallback
          // because that makes hair/beard/background look like a color filter.
          // Use chroma as a hard gate and keep a soft geometric falloff around it.
          // trackedSkin is now an image-derived adaptive skin probability mask.
          // Do not multiply it by another hard chroma classifier here: doing so
          // was the source of isolated cheek circles under difficult lighting.
          float geometryMask = faceMask * trackedSkin;
          skinMask = geometryMask;
          skinMask *= (1.0 - eyeCut * 0.995) * (1.0 - mouthCut * 0.98) * (1.0 - browCut * 0.96);
          skinMask = smoothstep(0.025, 0.22, skinMask);
        }

        // Stage 2 skin retouch: stronger multi-radius edge-aware smoothing.
        if (u_smooth > 0.0 && skinMask > 0.01) {
          vec2 px = 1.0 / u_resolution;
          // Large-radius bilateral-like skin smoothing. The previous 2/4px pass
          // was visually too weak on phone previews. Keep edge-aware weighting so
          // eyes/lips/nose details survive while pores/noise are visibly reduced.
          vec3 sum = color * 2.5;
          float total = 2.5;
          for (int i = 0; i < 16; i++) {
            float a = 0.392699 * float(i);
            float radius = (i < 8 ? 4.0 : 8.0);
            vec2 off = vec2(cos(a), sin(a)) * px * radius;
            vec3 sampleColor = texture2D(u_image, uv + off).rgb;
            float colorDistance = distance(sampleColor, color);
            float cw = exp(-colorDistance * 22.0);
            sum += sampleColor * cw;
            total += cw;
          }
          vec3 smooth = sum / total;
          float level = smoothstep(0.0, 1.0, u_smooth / 100.0);
          float strength = level * skinMask * (0.48 + 0.16 * level);
          color = mix(color, smooth, strength);
          vec3 localDetail = color - smooth;
          float detailKeep = 0.28 + (u_sharpness / 100.0) * 0.24;
          color += localDetail * detailKeep * skinMask;
          if (u_noiseReduction > 0.0) {
            float denoise = (u_noiseReduction / 100.0) * skinMask * 0.22;
            color = mix(color, smooth, denoise);
          }
        }

        if (u_tone > 0.0 && skinMask > 0.01) {
          vec3 healthy = color * vec3(1.012, 1.006, 0.998) + vec3(0.003, 0.002, 0.001);
          color = mix(color, healthy, (u_tone / 100.0) * skinMask * 0.18);
        }

        if (u_glow > 0.0 && skinMask > 0.01) {
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          float hi = smoothstep(0.38, 0.82, lum);
          color += vec3(1.0, 0.985, 0.97) * hi * (u_glow / 100.0) * skinMask * 0.035;
        }

        if (u_eyeBright > 0.0 && u_faceDetected == 1) {
          float r = max(distance(u_leftEye, u_rightEye) * 0.13, 0.025);
          float e = max(ellipseMask(uv, u_leftEye, vec2(r * 1.65, r)), ellipseMask(uv, u_rightEye, vec2(r * 1.65, r)));
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          color += vec3(0.16) * e * (1.0 - lum) * (u_eyeBright / 100.0);
        }

        if (u_lips > 0.0 && u_faceDetected == 1) {
          float lip = ellipseMask(uv, u_mouthCenter, vec2(max(distance(u_leftCheek, u_rightCheek) * 0.22, 0.06),
                                                          max(distance(u_forehead, u_chin) * 0.065, 0.025)));
          vec3 lipTone = vec3(1.08, 0.72, 0.82);
          color = mix(color, color * lipTone, lip * (u_lips / 100.0) * 0.32);
        }

        if (u_teeth > 0.0 && u_faceDetected == 1 && u_mouthOpen > 0.20) {
          float tooth = ellipseMask(uv, u_mouthCenter,
                                    vec2(max(distance(u_leftCheek, u_rightCheek) * 0.16, 0.045),
                                         max(distance(u_forehead, u_chin) * 0.045, 0.018)));
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          if (lum > 0.30) color = mix(color, vec3(max(lum, 0.72)), tooth * (u_teeth / 100.0) * 0.55);
        }

        // Camera enhancement pass. Native social cameras usually add a small
        // computational-photography lift before beauty: recover shadows, open
        // midtones and roll off highlights. This is global and remains subtle.
        float sceneLum = dot(color, vec3(0.299, 0.587, 0.114));
        float shadowLift = (1.0 - smoothstep(0.08, 0.50, sceneLum)) * 0.075;
        float midLift = smoothstep(0.16, 0.46, sceneLum) * (1.0 - smoothstep(0.56, 0.90, sceneLum)) * 0.018;
        color += shadowLift + midLift;

        float contrast = max(u_contrast / 100.0, 0.01);
        float brightness = (u_brightness - 100.0) / 100.0;
        color = (color - 0.5) * contrast + 0.5 + brightness;
        // Gentle highlight compression prevents bright skin from clipping after
        // enhancement, which is especially useful on inexpensive phone cameras.
        float postLum = dot(color, vec3(0.299, 0.587, 0.114));
        float hiCompress = smoothstep(0.76, 1.0, postLum) * 0.08;
        color = mix(color, color / max(1.0 + hiCompress, 0.001), hiCompress);

        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        float vib = max(u_vibrance / 100.0, 0.0);
        float chroma = max(max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b)), 0.0);
        color += (color - vec3(gray)) * vib * (1.0 - chroma) * 0.08;
        color = mix(vec3(gray), color, max(u_saturation / 100.0, 0.0));

        if (u_sharpness > 0.0) {
          vec2 p = 1.0 / u_resolution;
          vec3 n = texture2D(u_image, uv + vec2(0.0, p.y)).rgb;
          vec3 s = texture2D(u_image, uv - vec2(0.0, p.y)).rgb;
          vec3 e = texture2D(u_image, uv + vec2(p.x, 0.0)).rgb;
          vec3 w = texture2D(u_image, uv - vec2(p.x, 0.0)).rgb;
          vec3 edge = color * 5.0 - n - s - e - w;
          color += (edge - color) * (u_sharpness / 100.0) * 0.18;
        }

        gl_FragColor = vec4(clamp(color, 0.0, 1.0), base.a);
      }
    `;
    this.beautyProgram = this.compileProgram(vsSource, beautyFs);

    // 3. EFFECTS SHADERS
    this.compileEffectShaders(vsSource);
  }

  private compileEffectShaders(vsSource: string): void {
    const effects = [
      {
        id: "pink_glow",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec3 pink = vec3(1.05, 0.88, 0.96);
            float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
            vec3 tinted = col.rgb * pink + vec3(0.08, 0.02, 0.06) * (1.0 - luma);
            gl_FragColor = vec4(mix(col.rgb, tinted, u_intensity), col.a);
          }
        `,
      },
      {
        id: "soft_glow",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
            vec3 glow = col.rgb + vec3(0.12, 0.1, 0.08) * smoothstep(0.4, 0.9, luma);
            gl_FragColor = vec4(mix(col.rgb, glow, u_intensity), col.a);
          }
        `,
      },
      {
        id: "dream",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform vec2 u_resolution;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec2 step = 3.0 / u_resolution;
            vec4 blur = (
              texture2D(u_image, v_texCoord + vec2(-step.x, -step.y)) +
              texture2D(u_image, v_texCoord + vec2( step.x, -step.y)) +
              texture2D(u_image, v_texCoord + vec2(-step.x,  step.y)) +
              texture2D(u_image, v_texCoord + vec2( step.x,  step.y))
            ) * 0.25;
            vec3 dreamCol = mix(col.rgb, blur.rgb, 0.55);
            dreamCol += vec3(0.06, 0.04, 0.08);
            gl_FragColor = vec4(mix(col.rgb, dreamCol, u_intensity), col.a);
          }
        `,
      },
      {
        id: "vintage",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec3 sepia = vec3(
              dot(col.rgb, vec3(0.393, 0.769, 0.189)),
              dot(col.rgb, vec3(0.349, 0.686, 0.168)),
              dot(col.rgb, vec3(0.272, 0.534, 0.131))
            );
            // Vignette
            vec2 uv = v_texCoord - 0.5;
            float vig = 1.0 - dot(uv, uv) * 0.9;
            vec3 result = sepia * vig;
            gl_FragColor = vec4(mix(col.rgb, result, u_intensity), col.a);
          }
        `,
      },
      {
        id: "warm",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec3 warm = col.rgb * vec3(1.15, 1.02, 0.88) + vec3(0.04, 0.02, 0.0);
            gl_FragColor = vec4(mix(col.rgb, warm, u_intensity), col.a);
          }
        `,
      },
      {
        id: "cool",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec3 cool = col.rgb * vec3(0.88, 1.02, 1.2) + vec3(0.0, 0.02, 0.05);
            gl_FragColor = vec4(mix(col.rgb, cool, u_intensity), col.a);
          }
        `,
      },
      {
        id: "neon",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform float u_time;
          void main() {
            vec2 uv = v_texCoord;
            float shift = 0.005;
            float r = texture2D(u_image, uv + vec2(shift, 0.0)).r;
            float g = texture2D(u_image, uv).g;
            float b = texture2D(u_image, uv - vec2(shift, 0.0)).b;
            vec3 neon = vec3(r * 1.2 + 0.1, g * 0.9, b * 1.35 + 0.15);
            // Scanlines
            float scan = sin(uv.y * 600.0) * 0.04;
            neon -= scan;
            vec4 original = texture2D(u_image, uv);
            gl_FragColor = vec4(mix(original.rgb, neon, u_intensity), original.a);
          }
        `,
      },
      {
        id: "cinematic",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            // Teal & Orange grading
            vec3 graded = col.rgb;
            graded.r = pow(graded.r, 0.9) * 1.1;
            graded.g = graded.g * 1.02;
            graded.b = pow(graded.b, 1.1) * 1.15;
            float luma = dot(graded, vec3(0.299, 0.587, 0.114));
            graded = mix(graded, vec3(graded.r * 1.1, graded.g, graded.b * 1.25), 0.35);
            // Letterbox shadow hint
            vec2 uv = v_texCoord - 0.5;
            float vig = 1.0 - dot(uv, uv) * 0.6;
            graded *= vig;
            gl_FragColor = vec4(mix(col.rgb, graded, u_intensity), col.a);
          }
        `,
      },
      {
        id: "sparkle",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          varying vec2 v_screenCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform float u_time;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            float luma = dot(col.rgb, vec3(0.299, 0.587, 0.114));
            // Highlight glint sparkle
            float glint = pow(luma, 4.0) * (sin(u_time * 6.0 + v_screenCoord.x * 20.0 + v_screenCoord.y * 20.0) * 0.5 + 0.5);
            vec3 result = col.rgb + vec3(glint * 0.5, glint * 0.45, glint * 0.6);
            gl_FragColor = vec4(mix(col.rgb, result, u_intensity), col.a);
          }
        `,
      },
      {
        id: "snow",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          varying vec2 v_screenCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform float u_time;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec2 p = v_screenCoord;
            float snow = 0.0;
            // Procedural GPU snow particle generator
            for (int i = 1; i <= 6; i++) {
              float fi = float(i);
              float speed = 0.2 + fi * 0.08;
              float yPos = fract(p.y + u_time * speed * 0.3 + fi * 0.17);
              float xPos = fract(sin(fi * 78.233 + floor((p.y + u_time * speed * 0.3 + fi * 0.17))) * 43758.5453);
              float d = distance(p, vec2(xPos, yPos));
              snow += smoothstep(0.018, 0.002, d);
            }
            vec3 winterCol = col.rgb * vec3(0.92, 0.96, 1.05) + vec3(snow * 0.85);
            gl_FragColor = vec4(mix(col.rgb, winterCol, u_intensity), col.a);
          }
        `,
      },
      {
        id: "black_and_white",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            float gray = dot(col.rgb, vec3(0.299, 0.587, 0.114));
            // High contrast noir monochrome
            float noir = smoothstep(0.1, 0.9, gray);
            gl_FragColor = vec4(mix(col.rgb, vec3(noir), u_intensity), col.a);
          }
        `,
      },
      {
        id: "blur",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform vec2 u_resolution;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            vec2 step = 4.0 / u_resolution;
            vec4 blur = (
              texture2D(u_image, v_texCoord + vec2(-step.x, 0.0)) +
              texture2D(u_image, v_texCoord + vec2( step.x, 0.0)) +
              texture2D(u_image, v_texCoord + vec2(0.0, -step.y)) +
              texture2D(u_image, v_texCoord + vec2(0.0,  step.y)) +
              texture2D(u_image, v_texCoord + vec2(-step.x * 2.0, 0.0)) +
              texture2D(u_image, v_texCoord + vec2( step.x * 2.0, 0.0)) +
              texture2D(u_image, v_texCoord + vec2(0.0, -step.y * 2.0)) +
              texture2D(u_image, v_texCoord + vec2(0.0,  step.y * 2.0))
            ) * 0.125;
            gl_FragColor = vec4(mix(col.rgb, blur.rgb, u_intensity), col.a);
          }
        `,
      },
      {
        id: "light_leak",
        fs: `
          precision mediump float;
          varying vec2 v_texCoord;
          varying vec2 v_screenCoord;
          uniform sampler2D u_image;
          uniform float u_intensity;
          uniform float u_time;
          void main() {
            vec4 col = texture2D(u_image, v_texCoord);
            float dist = distance(v_screenCoord, vec2(0.1 + sin(u_time * 0.4) * 0.05, 0.1));
            float leak = smoothstep(0.8, 0.0, dist);
            vec3 leakCol = vec3(1.0, 0.6, 0.2) * leak * 0.6;
            gl_FragColor = vec4(mix(col.rgb, col.rgb + leakCol, u_intensity), col.a);
          }
        `,
      },
    ];

    for (const eff of effects) {
      const prog = this.compileProgram(vsSource, eff.fs);
      if (prog) {
        this.effectsProgramMap.set(eff.id, prog);
      }
    }
  }

  private compileProgram(vsSrc: string, fsSrc: string): WebGLProgram | null {
    if (!this.gl) return null;
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return null;
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return null;
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return null;
    }
    return prog;
  }

  private ensureFbo(w: number, h: number): boolean {
    if (!this.gl) return false;
    const gl = this.gl;
    if (this.fbo && this.fboTexture && this.fboWidth === w && this.fboHeight === h) {
      return true;
    }

    if (this.fboTexture) gl.deleteTexture(this.fboTexture);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);

    this.fbo = gl.createFramebuffer();
    this.fboTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTexture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.fboWidth = w;
    this.fboHeight = h;
    return status === gl.FRAMEBUFFER_COMPLETE;
  }

  private bindQuadAttributes(prog: WebGLProgram, isFboSource: boolean = false): void {
    if (!this.gl) return;
    const gl = this.gl;
    const buf = isFboSource ? (this.fboQuadBuffer || this.cameraQuadBuffer) : this.cameraQuadBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const aPos = gl.getAttribLocation(prog, "a_position");
    const aTex = gl.getAttribLocation(prog, "a_texCoord");

    if (aPos !== -1) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    }
    if (aTex !== -1) {
      gl.enableVertexAttribArray(aTex);
      gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);
    }
  }

  private static smoothstepCPU(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x-edge0)/((edge1-edge0)||1)));
    return t*t*(3-2*t);
  }

  // Automatic skin segmentation from the actual camera pixels. This is the
  // foundation of the custom SnapAR Beauty Engine: tracking supplies the face
  // geometry, while the image supplies the skin probability. No third-party
  // beauty SDK is used.
  private updateSkinMask(video: HTMLVideoElement, landmarks: FaceLandmarksData): void {
    if (!this.gl || !this.skinMaskTexture || !this.skinMaskCtx) return;
    const now = performance.now();
    // The mask does not need to be regenerated at display refresh rate. Updating
    // it 10x/sec keeps the mask responsive while avoiding a CPU bottleneck.
    if (now - this.lastSkinMaskUpdateTime < 100) return;
    this.lastSkinMaskUpdateTime = now;

    const ctx = this.skinMaskCtx;
    const size = 256;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (!landmarks.faceDetected || !landmarks.points468 || landmarks.points468.length < 200) return;

    ctx.drawImage(video, 0, 0, size, size);
    const image = ctx.getImageData(0, 0, size, size);
    const data = image.data;
    const out = new Uint8ClampedArray(size * size * 4);

    const cx = ((landmarks.leftCheek.x + landmarks.rightCheek.x) * 0.5) * size;
    const cy = ((landmarks.forehead.y + landmarks.chin.y) * 0.5) * size;
    const rx = Math.max(18, Math.hypot(landmarks.rightCheek.x - landmarks.leftCheek.x, 0) * size * 0.72);
    const ry = Math.max(24, Math.abs(landmarks.chin.y - landmarks.forehead.y) * size * 0.58);

    const rgbToYCbCr = (r: number, g: number, b: number) => ({
      y: 0.299*r + 0.587*g + 0.114*b,
      cb: -0.168736*r - 0.331264*g + 0.5*b + 128,
      cr: 0.5*r - 0.418688*g - 0.081312*b + 128,
    });

    // Estimate the person's current skin color from multiple face locations.
    // This makes the mask adapt to warm/cool lighting and different skin tones.
    const seeds = [landmarks.leftCheek, landmarks.rightCheek, landmarks.forehead];
    let sy=0, scb=0, scr=0, count=0;
    for (const seed of seeds) {
      const sx=Math.max(2,Math.min(size-3,Math.round(seed.x*size)));
      const syy=Math.max(2,Math.min(size-3,Math.round(seed.y*size)));
      for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) {
        const i=((syy+dy)*size+(sx+dx))*4;
        const c=rgbToYCbCr(data[i],data[i+1],data[i+2]);
        if(c.y>12 && c.y<245){sy+=c.y;scb+=c.cb;scr+=c.cr;count++;}
      }
    }
    if(!count) return;
    sy/=count;scb/=count;scr/=count;

    // Only evaluate the face bounding region. A soft geometric boundary plus
    // adaptive color likelihood creates one continuous skin region rather than
    // the isolated cheek circles produced by the old hard chroma classifier.
    const minX=Math.max(0,Math.floor(cx-rx-8)), maxX=Math.min(size-1,Math.ceil(cx+rx+8));
    const minY=Math.max(0,Math.floor(cy-ry-8)), maxY=Math.min(size-1,Math.ceil(cy+ry+8));
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const dx=(x-cx)/rx, dy=(y-cy)/ry;
      const geo=1-Math.min(1,Math.sqrt(dx*dx+dy*dy));
      if(geo<=0) continue;
      const i=(y*size+x)*4;
      const c=rgbToYCbCr(data[i],data[i+1],data[i+2]);
      const dY=Math.abs(c.y-sy), dCb=Math.abs(c.cb-scb), dCr=Math.abs(c.cr-scr);
      const colorMatch=Math.exp(-(dY*dY)/(2*38*38) -(dCb*dCb)/(2*25*25) -(dCr*dCr)/(2*30*30));
      const broadSkin = this.smoothstepCPU(105, 88, c.cb) * this.smoothstepCPU(118, 138, c.cr) * this.smoothstepCPU(-2, 18, c.cr-c.cb);
      const relativeLuma = this.smoothstepCPU(Math.max(8, sy*0.38), Math.max(20, sy*0.58), c.y)
        * (1-this.smoothstepCPU(Math.min(245, sy*1.55), Math.min(255, sy*1.85), c.y));
      const p=Math.min(1, (colorMatch*0.82 + broadSkin*0.18) * relativeLuma * (0.35 + geo*0.65));
      out[i+3]=Math.round(p*255);
      out[i]=255;out[i+1]=255;out[i+2]=255;
    }

    // Feather the mask slightly so its boundary is invisible in the final image.
    const alpha=new Uint8ClampedArray(size*size);
    for(let i=0;i<alpha.length;i++) alpha[i]=out[i*4+3];
    const feather=new Uint8ClampedArray(alpha.length);
    for(let y=1;y<size-1;y++) for(let x=1;x<size-1;x++) {
      let sum=0;
      for(let ky=-1;ky<=1;ky++) for(let kx=-1;kx<=1;kx++) sum+=alpha[(y+ky)*size+(x+kx)];
      feather[y*size+x]=Math.round(sum/9);
    }
    for(let i=0;i<alpha.length;i++) out[i*4+3]=feather[i]<18?0:Math.min(255,Math.round(feather[i]*1.22));

    ctx.putImageData(new ImageData(out,size,size),0,0);
    ctx.globalCompositeOperation='destination-out';
    const cut=(px:number,py:number,rx2:number,ry2:number)=>{
      ctx.beginPath();ctx.ellipse(px*size,py*size,rx2*size,ry2*size,0,0,Math.PI*2);ctx.fill();
    };
    const ed=Math.max(Math.hypot(landmarks.rightEye.x-landmarks.leftEye.x,landmarks.rightEye.y-landmarks.leftEye.y),0.05);
    cut(landmarks.leftEye.x,landmarks.leftEye.y,ed*0.22,ed*0.13);
    cut(landmarks.rightEye.x,landmarks.rightEye.y,ed*0.22,ed*0.13);
    cut(landmarks.mouthCenter.x,landmarks.mouthCenter.y,ed*0.40,ed*0.20);
    ctx.globalCompositeOperation='source-over';

    const gl=this.gl;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.skinMaskTexture);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,this.skinMaskCanvas);
  }

  private setBeautyUniforms(
    prog: WebGLProgram,
    w: number,
    h: number,
    beauty: BeautyConfig,
    landmarks: FaceLandmarksData
  ): void {
    if (!this.gl) return;
    const gl = this.gl;

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    if (uRes) gl.uniform2f(uRes, w, h);
    const uSkinMask = gl.getUniformLocation(prog, "u_skinMask");
    if (uSkinMask) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.skinMaskTexture);
      gl.uniform1i(uSkinMask, 1);
      gl.activeTexture(gl.TEXTURE0);
    }

    const setFloat = (name: string, val: number) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) gl.uniform1f(loc, val);
    };

    setFloat("u_smooth", beauty.smooth);
    setFloat("u_glow", beauty.glow);
    setFloat("u_tone", beauty.tone);
    setFloat("u_brightness", beauty.brightness);
    setFloat("u_contrast", beauty.contrast);
    setFloat("u_saturation", beauty.saturation);
    setFloat("u_sharpness", beauty.sharpness);
    setFloat("u_faceSlim", beauty.faceSlim);
    setFloat("u_eyeScale", beauty.eyeScale);
    setFloat("u_noseSlim", beauty.noseSlim);
    setFloat("u_jaw", beauty.jaw);
    setFloat("u_lips", beauty.lips);
    setFloat("u_teeth", beauty.teeth);
    setFloat("u_eyeBright", beauty.eyeBright ?? 0);
    setFloat("u_noiseReduction", beauty.noiseReduction ?? 0);
    setFloat("u_vibrance", beauty.vibrance ?? 0);

    const locFace = gl.getUniformLocation(prog, "u_faceDetected");
    if (locFace) gl.uniform1i(locFace, landmarks.faceDetected ? 1 : 0);

    const locMouthOpen = gl.getUniformLocation(prog, "u_mouthOpen");
    if (locMouthOpen) gl.uniform1f(locMouthOpen, landmarks.mouthOpenness);

    const setVec2 = (name: string, p: { x: number; y: number }) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) {
        // Camera texture coordinates are vertically flipped relative to
        // FaceLandmarker/video coordinates. Keep every facial anchor in the
        // same coordinate space as the sampled camera image.
        gl.uniform2f(loc, p.x, 1 - p.y);
      }
    };

    setVec2("u_leftEye", landmarks.leftEye);
    setVec2("u_rightEye", landmarks.rightEye);
    setVec2("u_noseTip", landmarks.noseTip);
    setVec2("u_mouthCenter", landmarks.mouthCenter);
    setVec2("u_leftCheek", landmarks.leftCheek);
    setVec2("u_rightCheek", landmarks.rightCheek);
    setVec2("u_forehead", landmarks.forehead);
    setVec2("u_chin", landmarks.chin);
  }

  private setEffectUniforms(
    prog: WebGLProgram,
    w: number,
    h: number,
    intensity: number
  ): void {
    if (!this.gl) return;
    const gl = this.gl;
    const uInt = gl.getUniformLocation(prog, "u_intensity");
    if (uInt) gl.uniform1f(uInt, intensity);
    const uTime = gl.getUniformLocation(prog, "u_time");
    if (uTime) gl.uniform1f(uTime, performance.now() / 1000);
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    if (uRes) gl.uniform2f(uRes, w, h);
  }

  public render(
    video: HTMLVideoElement,
    beauty: BeautyConfig,
    beautyEnabled: boolean,
    effectId: EffectId,
    effectsEnabled: boolean,
    landmarks: FaceLandmarksData,
    mode: RenderComparisonMode,
    effectIntensity: number = 1.0,
    processingMaxWidth: number = 0
  ): HTMLCanvasElement | null {
    if (!this.gl || !this.isSupported || !video || video.readyState < 2) {
      return null;
    }

    const gl = this.gl;
    const sourceW = video.videoWidth || 1280;
    const sourceH = video.videoHeight || 720;
    // Process at a bounded internal resolution. Camera capture can stay 720p/1080p,
    // while the GPU beauty pass avoids spending the full shader cost on every source pixel.
    const maxW = processingMaxWidth > 0 ? processingMaxWidth : sourceW;
    const w = Math.min(sourceW, maxW);
    const h = Math.max(1, Math.round((sourceH / sourceW) * w));

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Upload camera frame to GPU input texture
    gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    if (beautyEnabled && landmarks.faceDetected) {
      this.updateSkinMask(video, landmarks);
    }

    // Determine active pipeline stages based on comparison mode
    const isBeautyMode =
      mode === "beauty" ||
      mode === "beauty_effects" ||
      mode === "beauty_ar" ||
      mode === "combined";

    const isEffectMode =
      mode === "effects" ||
      mode === "beauty_effects" ||
      mode === "effects_ar" ||
      mode === "combined";

    const useBeauty = isBeautyMode && beautyEnabled && !!this.beautyProgram;
    const useEffect =
      isEffectMode &&
      effectsEnabled &&
      effectId !== "none" &&
      this.effectsProgramMap.has(effectId);

    // =========================================================================
    // MULTI-PASS GPU PIPELINE
    // =========================================================================

    if (useBeauty && useEffect) {
      // -----------------------------------------------------------------------
      // PASS 1: Camera Input Texture -> Beauty Shader -> Framebuffer Object (FBO)
      // -----------------------------------------------------------------------
      this.ensureFbo(w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, w, h);

      gl.useProgram(this.beautyProgram!);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);

      this.bindQuadAttributes(this.beautyProgram!);
      this.setBeautyUniforms(this.beautyProgram!, w, h, beauty, landmarks);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // -----------------------------------------------------------------------
      // PASS 2: FBO Beauty Texture -> Effect Shader -> Final Output Canvas
      // Sample FBO texture using fboQuadBuffer for upright orientation compensation
      // -----------------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);

      const effectProg = this.effectsProgramMap.get(effectId)!;
      gl.useProgram(effectProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);

      this.bindQuadAttributes(effectProg, true);
      this.setEffectUniforms(effectProg, w, h, effectIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (useBeauty) {
      // -----------------------------------------------------------------------
      // SINGLE PASS: Camera Input Texture -> Beauty Shader -> Output Canvas
      // -----------------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);

      gl.useProgram(this.beautyProgram!);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);

      this.bindQuadAttributes(this.beautyProgram!);
      this.setBeautyUniforms(this.beautyProgram!, w, h, beauty, landmarks);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else if (useEffect) {
      // -----------------------------------------------------------------------
      // SINGLE PASS: Camera Input Texture -> Effect Shader -> Output Canvas
      // -----------------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);

      const effectProg = this.effectsProgramMap.get(effectId)!;
      gl.useProgram(effectProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);

      this.bindQuadAttributes(effectProg);
      this.setEffectUniforms(effectProg, w, h, effectIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } else {
      // -----------------------------------------------------------------------
      // PASSTHROUGH: Camera Input Texture -> Raw Output Canvas
      // -----------------------------------------------------------------------
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);

      const prog = this.passthroughProgram;
      if (prog) {
        gl.useProgram(prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);
        this.bindQuadAttributes(prog);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    return this.canvas;
  }

  // Sample rendered pixels directly from GPU buffer for physical pixel verification
  public readPixelSample(x: number = 0, y: number = 0, w: number = 64, h: number = 64): Uint8Array | null {
    if (!this.gl) return null;
    const gl = this.gl;
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  // Compare two pixel buffers to verify real physical transformations
  public comparePixelBuffers(
    bufA: Uint8Array,
    bufB: Uint8Array,
    thresholdDelta: number = 3
  ): {
    totalSamples: number;
    differentPixels: number;
    differenceScore: number;
    isDifferent: boolean;
  } {
    const len = Math.min(bufA.length, bufB.length);
    let diffCount = 0;
    let sumDelta = 0;
    const samples = len / 4;

    for (let i = 0; i < len; i += 4) {
      const dr = Math.abs(bufA[i] - bufB[i]);
      const dg = Math.abs(bufA[i + 1] - bufB[i + 1]);
      const db = Math.abs(bufA[i + 2] - bufB[i + 2]);
      const delta = (dr + dg + db) / 3;
      sumDelta += delta;
      if (delta >= thresholdDelta) {
        diffCount++;
      }
    }

    const avgDelta = samples > 0 ? sumDelta / samples : 0;
    return {
      totalSamples: samples,
      differentPixels: diffCount,
      differenceScore: Math.round(avgDelta * 100) / 100,
      isDifferent: diffCount > samples * 0.05,
    };
  }

  public destroy(): void {
    if (this.gl) {
      if (this.fboTexture) {
        this.gl.deleteTexture(this.fboTexture);
        this.fboTexture = null;
      }
      if (this.fbo) {
        this.gl.deleteFramebuffer(this.fbo);
        this.fbo = null;
      }
      if (this.cameraTexture) {
        this.gl.deleteTexture(this.cameraTexture);
        this.cameraTexture = null;
      }
      if (this.skinMaskTexture) {
        this.gl.deleteTexture(this.skinMaskTexture);
        this.skinMaskTexture = null;
      }
      if (this.quadBuffer) {
        this.gl.deleteBuffer(this.quadBuffer);
        this.quadBuffer = null;
      }
    }
  }
}
