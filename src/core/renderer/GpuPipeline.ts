import { BeautyConfig, EffectId, FaceLandmarksData, RenderComparisonMode } from "../types";

export class GpuPipeline {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private cameraTexture: WebGLTexture | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private cameraQuadBuffer: WebGLBuffer | null = null;
  private fboQuadBuffer: WebGLBuffer | null = null;
  private beautyProgram: WebGLProgram | null = null;
  private effectsProgramMap: Map<string, WebGLProgram> = new Map();
  private passthroughProgram: WebGLProgram | null = null;
  private isSupported: boolean = false;
  private textureYFlipCompensated: boolean = true;

  // Multi-pass Framebuffer for simultaneous Beauty + Effects compositing
  private fbo: WebGLFramebuffer | null = null;
  private fboTexture: WebGLTexture | null = null;
  private fboWidth: number = 0;
  private fboHeight: number = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1280;
    this.canvas.height = 720;
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
      uniform vec2 u_resolution;

      // Beauty Controls (0 to 100)
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

      // Face Landmarks & Tracking
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

      // Local Geometric Mesh Warp (Background Remains 100% Stable)
      vec2 getDeformedUV(vec2 uv) {
        if (u_faceDetected == 0) return uv;
        vec2 warpedUV = uv;

        // 1. Eye Enlargement (Localized spherical zoom strictly in eye orbit)
        if (u_eyeScale > 0.0) {
          float eyeSpan = distance(u_leftEye, u_rightEye);
          float maxEyeRadius = min(eyeSpan * 0.35, 0.11);
          float strength = (u_eyeScale / 100.0) * 0.32;

          float dL = distance(uv, u_leftEye);
          if (dL < maxEyeRadius) {
            float f = smoothstep(maxEyeRadius, 0.0, dL);
            warpedUV = u_leftEye + (warpedUV - u_leftEye) * (1.0 - strength * f * f);
          }

          float dR = distance(uv, u_rightEye);
          if (dR < maxEyeRadius) {
            float f = smoothstep(maxEyeRadius, 0.0, dR);
            warpedUV = u_rightEye + (warpedUV - u_rightEye) * (1.0 - strength * f * f);
          }
        }

        // 2. Face Slimming (Narrows lower cheeks inward while background remains completely stable)
        if (u_faceSlim > 0.0) {
          float eyeY = (u_leftEye.y + u_rightEye.y) * 0.5;
          float chinY = u_chin.y;
          float ySpan = max(chinY - eyeY, 0.02);
          float yProgress = (uv.y - eyeY) / ySpan;

          // Only warp lower cheek band between eye level and chin level
          if (yProgress > 0.1 && yProgress < 1.05) {
            float yWeight = sin(yProgress * 3.14159);
            float faceHalfW = max(distance(u_leftCheek, u_rightCheek) * 0.5, 0.08);
            float xDiff = uv.x - u_noseTip.x;
            float normX = abs(xDiff) / faceHalfW;

            // Strict Hermite window: active within cheeks, tapers to zero at face edge so background is untouched
            if (normX > 0.18 && normX < 1.0) {
              float xWeight = smoothstep(0.18, 0.5, normX) * (1.0 - smoothstep(0.75, 1.0, normX));
              float shift = (u_faceSlim / 100.0) * 0.04 * faceHalfW * yWeight * xWeight;
              if (xDiff < 0.0) {
                warpedUV.x -= shift;
              } else {
                warpedUV.x += shift;
              }
            }
          }
        }

        // 3. Nose Slimming (Pinches nose bridge & tip horizontally, background untouched)
        if (u_noseSlim > 0.0) {
          vec2 noseDiff = uv - u_noseTip;
          float rx = max(distance(u_leftCheek, u_rightCheek) * 0.14, 0.04);
          float ry = max(distance(u_forehead, u_chin) * 0.16, 0.05);
          float dNose = length(vec2(noseDiff.x / rx, noseDiff.y / ry));
          if (dNose < 1.0) {
            float w = (1.0 - dNose * dNose);
            float pinch = (u_noseSlim / 100.0) * 0.022 * rx * w;
            if (noseDiff.x < 0.0) {
              warpedUV.x -= pinch;
            } else {
              warpedUV.x += pinch;
            }
          }
        }

        // 4. Jaw Shaping
        if (u_jaw > 0.0) {
          float dChin = distance(uv, u_chin);
          float jawR = max(distance(u_forehead, u_chin) * 0.22, 0.06);
          if (dChin < jawR) {
            float w = smoothstep(jawR, 0.0, dChin);
            warpedUV.y -= (u_jaw / 100.0) * 0.035 * jawR * w;
          }
        }

        return clamp(warpedUV, 0.0, 1.0);
      }

      void main() {
        vec2 uv = getDeformedUV(v_texCoord);
        vec4 baseColor = texture2D(u_image, uv);
        vec3 color = baseColor.rgb;

        // Digital Video Skin Chrominance Detector (ITU-R BT.601 YCbCr)
        float Y = dot(color, vec3(0.299, 0.587, 0.114));
        float Cb = dot(color, vec3(-0.1687, -0.3313, 0.5)) + 0.5;
        float Cr = dot(color, vec3(0.5, -0.4187, -0.0813)) + 0.5;
        // Broad YCbCr skin range with soft falloff; the face contour and exclusion
        // zones below prevent hair/background/eyes/lips from being blurred.
        float isSkinCb = smoothstep(0.27, 0.34, Cb) * (1.0 - smoothstep(0.56, 0.63, Cb));
        float isSkinCr = smoothstep(0.45, 0.51, Cr) * (1.0 - smoothstep(0.69, 0.75, Cr));
        float chromaSkin = isSkinCb * isSkinCr;
        float isSkin = max(chromaSkin, inFaceContour * 0.22);

        // Precise Face Region and Negative Exclusion Zones
        float inFaceContour = 0.0;
        float leftEyeExcl = 1.0;
        float rightEyeExcl = 1.0;
        float leftBrowExcl = 1.0;
        float rightBrowExcl = 1.0;
        float lipExcl = 1.0;
        float nostrilExcl = 1.0;

        if (u_faceDetected == 1) {
          vec2 faceCenter = (u_leftEye + u_rightEye + u_mouthCenter + u_forehead + u_chin) * 0.2;
          float faceRx = max(distance(u_leftCheek, u_rightCheek) * 0.52, 0.05);
          float faceRy = max(distance(u_forehead, u_chin) * 0.55, 0.06);
          vec2 diff = uv - faceCenter;
          float normFaceDist = length(vec2(diff.x / faceRx, diff.y / faceRy));
          inFaceContour = smoothstep(1.05, 0.85, normFaceDist);

          // 1. Eyes exclusion: NEVER blur eyes, eyelashes, pupils, sclera
          float eyeRadius = faceRx * 0.28;
          leftEyeExcl = smoothstep(eyeRadius * 0.35, eyeRadius * 0.88, distance(uv, u_leftEye));
          rightEyeExcl = smoothstep(eyeRadius * 0.35, eyeRadius * 0.88, distance(uv, u_rightEye));

          // 2. Eyebrows exclusion
          vec2 leftBrow = u_leftEye + vec2(0.0, -faceRy * 0.16);
          vec2 rightBrow = u_rightEye + vec2(0.0, -faceRy * 0.16);
          leftBrowExcl = smoothstep(eyeRadius * 0.25, eyeRadius * 0.75, distance(uv, leftBrow));
          rightBrowExcl = smoothstep(eyeRadius * 0.25, eyeRadius * 0.75, distance(uv, rightBrow));

          // 3. Lips exclusion for skin smoothing
          vec2 mouthDiff = uv - u_mouthCenter;
          float mouthNorm = length(vec2(mouthDiff.x / (faceRx * 0.44), mouthDiff.y / (faceRy * 0.22)));
          lipExcl = smoothstep(0.65, 1.15, mouthNorm);

          // 4. Nostrils exclusion
          float nostrilDist = distance(uv, u_noseTip + vec2(0.0, faceRy * 0.03));
          nostrilExcl = smoothstep(faceRx * 0.10, faceRx * 0.26, nostrilDist);
        }

        // Composite skin weight (0.0 on hair, eyes, eyebrows, nostrils, lips, clothing, background)
        float skinMask = inFaceContour * leftEyeExcl * rightEyeExcl * leftBrowExcl * rightBrowExcl * lipExcl * nostrilExcl * isSkin;
        if (u_faceDetected == 0) skinMask = 0.0;

        // 1. Bilateral Skin Smoothing (Strictly applied to skinMask > 0.01)
        if (u_smooth > 0.0 && skinMask > 0.01) {
          vec2 step = 1.6 / u_resolution;
          vec3 sum = vec3(0.0);
          float totalWeight = 0.0;

          vec2 taps[13];
          taps[0] = vec2(0.0);
          taps[1] = vec2(1.0, 0.0); taps[2] = vec2(-1.0, 0.0);
          taps[3] = vec2(0.0, 1.0); taps[4] = vec2(0.0, -1.0);
          taps[5] = vec2(1.0, 1.0); taps[6] = vec2(-1.0, 1.0);
          taps[7] = vec2(1.0, -1.0); taps[8] = vec2(-1.0, -1.0);
          taps[9] = vec2(2.0, 0.0); taps[10] = vec2(-2.0, 0.0);
          taps[11] = vec2(0.0, 2.0); taps[12] = vec2(0.0, -2.0);
          for (int i = 0; i < 13; i++) {
            vec2 offset = taps[i] * step;
            vec3 sampleCol = texture2D(u_image, uv + offset).rgb;
            float spatialWeight = i == 0 ? 1.0 : (i < 9 ? 0.72 : 0.38);
            float colorWeight = exp(-distance(sampleCol, color) * 18.0);
            float w = spatialWeight * colorWeight;
            sum += sampleCol * w;
            totalWeight += w;
          }

          if (totalWeight > 0.0) {
            vec3 smoothed = sum / totalWeight;
            color = mix(color, smoothed, (u_smooth / 100.0) * skinMask * 0.88);
          }
        }

        // 2. Skin Tone Enhancement (Luminous healthy undertone, zero effect on background)
        if (u_tone > 0.0 && skinMask > 0.01) {
          vec3 toneTarget = color * vec3(1.04, 0.99, 0.96) + vec3(0.015, 0.008, 0.005);
          color = mix(color, toneTarget, (u_tone / 100.0) * skinMask * 0.42);
        }

        // 3. Highlight Specular Glow (Subtle pearlescent bloom on cheekbone & forehead skin highlights)
        if (u_glow > 0.0 && skinMask > 0.01) {
          float luma = dot(color, vec3(0.299, 0.587, 0.114));
          float highlight = smoothstep(0.50, 0.86, luma);
          vec3 glowColor = vec3(1.0, 0.96, 0.92);
          color += glowColor * highlight * (u_glow / 100.0) * 0.25 * skinMask;
        }

        // 4. Sharpness (Laplacian unsharp mask)
        if (u_sharpness > 0.0) {
          vec2 step = 1.0 / u_resolution;
          vec3 n = texture2D(u_image, uv + vec2(0.0, step.y)).rgb;
          vec3 s = texture2D(u_image, uv - vec2(0.0, step.y)).rgb;
          vec3 e = texture2D(u_image, uv + vec2(step.x, 0.0)).rgb;
          vec3 w = texture2D(u_image, uv - vec2(step.x, 0.0)).rgb;
          vec3 laplacian = color * 4.0 - (n + s + e + w);
          color += laplacian * (u_sharpness / 100.0) * 0.22;
        }

        // 5. Eye whites/catchlight enhancement, localized to the eye orbits.
        if (u_eyeBright > 0.0 && u_faceDetected == 1) {
          float eyeR = max(distance(u_leftEye, u_rightEye) * 0.22, 0.025);
          float dl = distance(uv, u_leftEye);
          float dr = distance(uv, u_rightEye);
          float eyeMask = max(
            smoothstep(eyeR, eyeR * 0.15, dl),
            smoothstep(eyeR, eyeR * 0.15, dr)
          );
          float lum = dot(color, vec3(0.299, 0.587, 0.114));
          float bright = (1.0 - lum) * 0.16;
          color += vec3(bright) * eyeMask * (u_eyeBright / 100.0);
        }

        // 5. Lip Enhancement (Natural berry-rose tint and hydration gloss)
        if (u_lips > 0.0 && u_faceDetected == 1) {
          float faceRx = max(distance(u_leftCheek, u_rightCheek) * 0.52, 0.05);
          float faceRy = max(distance(u_forehead, u_chin) * 0.55, 0.06);
          vec2 mouthDiff = uv - u_mouthCenter;
          float mouthNorm = length(vec2(mouthDiff.x / (faceRx * 0.40), mouthDiff.y / (faceRy * 0.18)));
          if (mouthNorm < 1.0) {
            float lipWeight = smoothstep(1.0, 0.2, mouthNorm);
            vec3 berryLip = vec3(1.15, 0.78, 0.88);
            color = mix(color, color * berryLip, (u_lips / 100.0) * lipWeight * 0.5);
            if (mouthDiff.y > 0.0) {
              float gloss = smoothstep(0.4, 0.1, length(vec2(mouthDiff.x / (faceRx * 0.15), (mouthDiff.y - faceRy * 0.05) / (faceRy * 0.06))));
              color += vec3(0.12, 0.08, 0.08) * gloss * (u_lips / 100.0);
            }
          }
        }

        // 6. Teeth Whitening (Active ONLY when mouth is open > 0.22 and inside tooth aperture)
        if (u_teeth > 0.0 && u_faceDetected == 1 && u_mouthOpen > 0.22) {
          float faceRx = max(distance(u_leftCheek, u_rightCheek) * 0.52, 0.05);
          float faceRy = max(distance(u_forehead, u_chin) * 0.55, 0.06);
          vec2 mouthDiff = uv - u_mouthCenter;
          float mouthNorm = length(vec2(mouthDiff.x / (faceRx * 0.28), mouthDiff.y / (faceRy * 0.10)));
          if (mouthNorm < 1.0) {
            float toothWeight = smoothstep(1.0, 0.1, mouthNorm);
            float luma = dot(color, vec3(0.299, 0.587, 0.114));
            if (luma > 0.38) {
              float sat = (u_teeth / 100.0) * toothWeight * 0.75;
              vec3 desaturated = mix(color, vec3(luma * 1.12), sat);
              color = mix(color, desaturated, toothWeight);
            }
          }
        }

        // 7. Global Camera Tones (Brightness, Contrast, Saturation)
        float contrast = u_contrast / 100.0;
        float brightness = (u_brightness - 100.0) / 100.0;
        color = (color - 0.5) * contrast + 0.5 + brightness;

        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        float sat = u_saturation / 100.0;
        color = mix(vec3(gray), color, sat);

        gl_FragColor = vec4(clamp(color, 0.0, 1.0), baseColor.a);
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

    const locFace = gl.getUniformLocation(prog, "u_faceDetected");
    if (locFace) gl.uniform1i(locFace, landmarks.faceDetected ? 1 : 0);

    const locMouthOpen = gl.getUniformLocation(prog, "u_mouthOpen");
    if (locMouthOpen) gl.uniform1f(locMouthOpen, landmarks.mouthOpenness);

    const setVec2 = (name: string, p: { x: number; y: number }) => {
      const loc = gl.getUniformLocation(prog, name);
      if (loc) gl.uniform2f(loc, p.x, p.y);
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
    effectIntensity: number = 1.0
  ): HTMLCanvasElement | null {
    if (!this.gl || !this.isSupported || !video || video.readyState < 2) {
      return null;
    }

    const gl = this.gl;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    // Upload camera frame to GPU input texture
    gl.bindTexture(gl.TEXTURE_2D, this.cameraTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

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
      if (this.quadBuffer) {
        this.gl.deleteBuffer(this.quadBuffer);
        this.quadBuffer = null;
      }
    }
  }
}
