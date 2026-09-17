export interface CameraResolution {
  width: number;
  height: number;
  label: "720p" | "1080p" | "4k";
}

export class CameraManager {
  private videoElement: HTMLVideoElement;
  private currentStream: MediaStream | null = null;
  private facingMode: "user" | "environment" = "user";
  private targetResolution: CameraResolution = { width: 1920, height: 1080, label: "1080p" };
  private isRunning: boolean = false;
  private permissionState: "prompt" | "granted" | "denied" | "unsupported" = "prompt";
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;

  constructor() {
    this.videoElement = document.createElement("video");
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
  }

  public getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  public getFacingMode(): "user" | "environment" {
    return this.facingMode;
  }

  public isFrontFacing(): boolean {
    return this.facingMode === "user";
  }

  public isActive(): boolean {
    return this.isRunning && !!this.currentStream && this.currentStream.active;
  }

  public getPermissionState(): string {
    return this.permissionState;
  }

  public getResolutionString(): string {
    if (this.videoElement && this.videoElement.videoWidth > 0) {
      return `${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`;
    }
    return "Not available";
  }

  public async startCamera(
    facing: "user" | "environment" = this.facingMode,
    resolution: "720p" | "1080p" | "4k" = "1080p"
  ): Promise<MediaStream> {
    this.facingMode = facing;

    let resWidth = 1920;
    let resHeight = 1080;
    if (resolution === "720p") {
      resWidth = 1280;
      resHeight = 720;
    } else if (resolution === "4k") {
      resWidth = 3840;
      resHeight = 2160;
    }
    this.targetResolution = { width: resWidth, height: resHeight, label: resolution };

    // Stop any existing tracks
    this.stopCamera();

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.permissionState = "unsupported";
      throw new Error("navigator.mediaDevices.getUserMedia is not supported on this browser or context.");
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: resWidth },
          height: { ideal: resHeight },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.isRunning = true;
      this.permissionState = "granted";
      return stream;
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.permissionState = "denied";
      } else {
        // Retry with basic fallback constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
          this.currentStream = fallbackStream;
          this.videoElement.srcObject = fallbackStream;
          await this.videoElement.play();
          this.isRunning = true;
          this.permissionState = "granted";
          return fallbackStream;
        } catch (fallbackErr: any) {
          this.permissionState = "denied";
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  public stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore cleanup errors
        }
      });
      this.currentStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isRunning = false;
  }

  public async switchCamera(): Promise<"user" | "environment"> {
    const targetFacing = this.facingMode === "user" ? "environment" : "user";
    await this.startCamera(targetFacing, this.targetResolution.label);
    return this.facingMode;
  }

  public startRecording(canvasSource: HTMLCanvasElement): void {
    if (!canvasSource) throw new Error("Canvas source required for recording.");
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    const stream = canvasSource.captureStream(30);
    const mimeTypes = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];

    let selectedMime = "";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const options = selectedMime ? { mimeType: selectedMime } : undefined;
    this.mediaRecorder = new MediaRecorder(stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
  }

  public stopRecording(): Promise<{ blobUrl: string; durationMs: number; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        reject(new Error("MediaRecorder is not recording."));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "video/webm";
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const durationMs = Date.now() - this.recordingStartTime;
        resolve({ blobUrl, durationMs, blob });
      };

      this.mediaRecorder.stop();
    });
  }

  public isRecording(): boolean {
    return !!this.mediaRecorder && this.mediaRecorder.state === "recording";
  }

  public destroy(): void {
    this.stopCamera();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }
  }
}
