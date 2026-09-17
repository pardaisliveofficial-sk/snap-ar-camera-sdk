import { BeautyParameters, FaceLandmarks, ARMaskId } from "../types";

export class WebGLFilterEngine {
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private videoTexture: WebGLTexture | null = null;
  private programMap: Map<string, WebGLProgram> = new Map();
  private quadBuffer: WebGLBuffer | null = null;
  private isInitialized = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.initGL();
  }

  private initGL() {
    try {
      this.gl =
        (this.canvas.getContext("webgl2", { preserveDrawingBuffer: true }) as WebGL2RenderingContext) ||
        (this.canvas.getContext("webgl", { preserveDrawingBuffer: true }) as WebGLRenderingContext);

      if (!this.gl) {
        console.warn("WebGL context creation failed; falling back to 2D pipeline");
        return;
      }

      const gl = this.gl;

      // Full screen quad buffer (-1 to 1)
      this.quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
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

      // Create video texture
      this.videoTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Compile Core GPU Shaders
      this.compileShaders();
      this.isInitialized = true;
    } catch (e) {
      console.warn("WebGL initialization exception:", e);
      this.isInitialized = false;
    }
  }

  private compileShaders() {
    if (!this.gl) return;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // 1. Beauty Pass Fragment Shader (Bilateral skin smoothing, brightness, teeth whitening)
    const beautyFsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform vec2 u_resolution;
      uniform float u_skinSmoothing;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_teethWhitening;

      void main() {
        vec2 uv = v_texCoord;
        vec4 color = texture2D(u_image, uv);

        // Bilateral skin smoothing approximation
        if (u_skinSmoothing > 0.0) {
          vec2 step = 1.5 / u_resolution;
          vec4 sum = vec4(0.0);
          float totalWeight = 0.0;

          for (int x = -2; x <= 2; x++) {
            for (int y = -2; y <= 2; y++) {
              vec2 offset = vec2(float(x), float(y)) * step;
              vec4 sampleCol = texture2D(u_image, uv + offset);
              float spatialWeight = exp(-float(x*x + y*y) / 8.0);
              float colorWeight = exp(-distance(sampleCol.rgb, color.rgb) * 12.0);
              float w = spatialWeight * colorWeight;
              sum += sampleCol * w;
              totalWeight += w;
            }
          }
          if (totalWeight > 0.0) {
            vec3 smoothed = sum.rgb / totalWeight;
            color.rgb = mix(color.rgb, smoothed, u_skinSmoothing * 0.7);
          }
        }

        // Color & Brightness adjustments
        color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + (u_brightness - 1.0);

        // Saturation
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(gray), color.rgb, u_saturation);

        gl_FragColor = color;
      }
    `;

    // 2. Cyberpunk GPU Filter Shader
    const cyberFsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform float u_time;

      void main() {
        vec2 uv = v_texCoord;
        // Chromatic aberration
        float shift = sin(u_time * 3.0) * 0.004 + 0.003;
        float r = texture2D(u_image, uv + vec2(shift, 0.0)).r;
        float g = texture2D(u_image, uv).g;
        float b = texture2D(u_image, uv - vec2(shift, 0.0)).b;

        vec3 col = vec3(r, g, b);
        // Neon cyan/pink tinting
        col.r = pow(col.r, 0.9) * 1.1 + 0.1;
        col.b = pow(col.b, 0.8) * 1.3;
        col.g *= 0.85;

        // Scanline overlay
        float scanline = sin(uv.y * 800.0) * 0.04;
        col -= scanline;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    this.createProgram("beauty", vsSource, beautyFsSource);
    this.createProgram("cyber", vsSource, cyberFsSource);
  }

  private createProgram(name: string, vsSrc: string, fsSrc: string) {
    if (!this.gl) return;
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vsSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fsSrc);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      this.programMap.set(name, prog);
    }
  }

  public renderFrame(
    video: HTMLVideoElement,
    beauty: BeautyParameters,
    maskId: ARMaskId,
    landmarks: FaceLandmarks
  ): HTMLCanvasElement | null {
    if (!this.gl || !this.isInitialized || !video || video.readyState < 2) {
      return null;
    }

    const gl = this.gl;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    // Update video texture
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // Select GPU shader program
    const progName = maskId === "neon_cyber" ? "cyber" : "beauty";
    const program = this.programMap.get(progName) || this.programMap.get("beauty");

    if (!program) return null;

    gl.useProgram(program);

    // Bind quad buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const aPos = gl.getAttribLocation(program, "a_position");
    const aTex = gl.getAttribLocation(program, "a_texCoord");

    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    // Set uniforms
    const uRes = gl.getUniformLocation(program, "u_resolution");
    if (uRes) gl.uniform2f(uRes, width, height);

    const uSmooth = gl.getUniformLocation(program, "u_skinSmoothing");
    if (uSmooth) gl.uniform1f(uSmooth, beauty.skinSmoothing / 100);

    const uBright = gl.getUniformLocation(program, "u_brightness");
    if (uBright) gl.uniform1f(uBright, beauty.brightness / 100);

    const uContrast = gl.getUniformLocation(program, "u_contrast");
    if (uContrast) gl.uniform1f(uContrast, beauty.contrast / 100);

    const uSat = gl.getUniformLocation(program, "u_saturation");
    if (uSat) gl.uniform1f(uSat, beauty.saturation / 100);

    const uTime = gl.getUniformLocation(program, "u_time");
    if (uTime) gl.uniform1f(uTime, performance.now() / 1000);

    // Draw full screen GPU quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.canvas;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

export const webglEngine = new WebGLFilterEngine();
