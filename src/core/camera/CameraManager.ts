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
  private switchInProgress: Promise<"user" | "environment"> | null = null;

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
    // Never let a browser silently choose another camera when a facing direction
    // was explicitly requested. This is important on phones with multiple lenses.
    const requestedFacing = facing;

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

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.permissionState = "unsupported";
      throw new Error("Camera access is not supported by this browser/context.");
    }

    // Remember the currently active device before stopping it. If a browser does
    // not expose facingMode, we can still fall back to a different physical input.
    const previousDeviceId = this.currentStream?.getVideoTracks()[0]?.getSettings().deviceId || "";

    this.stopCamera();

    const baseVideo: MediaTrackConstraints = {
      width: { ideal: resWidth },
      height: { ideal: resHeight },
    };

    const requestExactFacing = async () => {
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...baseVideo,
          facingMode: { exact: requestedFacing },
        },
      });
    };

    try {
      let stream: MediaStream;

      try {
        // Primary path: exact facingMode, not "ideal".
        stream = await requestExactFacing();
      } catch (err: any) {
        // Some desktop/browser implementations do not support facingMode
        // selection reliably. Fall back to a different physical video input.
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError" ||
          err?.name === "SecurityError"
        ) {
          this.permissionState = "denied";
          throw err;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");

        if (videoDevices.length < 2) {
          throw err;
        }

        // Prefer labels that identify the requested side, otherwise choose a
        // different physical camera from the one that was previously active.
        const label = (d: MediaDeviceInfo) => (d.label || "").toLowerCase();
        const frontHints = ["front", "user", "facetime", "integrated", "selfie"];
        const rearHints = ["back", "rear", "environment", "world", "main", "wide", "camera 0"];

        const hints = requestedFacing === "user" ? frontHints : rearHints;
        const hinted = videoDevices.find(
          (d) => d.deviceId !== previousDeviceId && hints.some((h) => label(d).includes(h))
        );
        const different = videoDevices.find((d) => d.deviceId !== previousDeviceId);
        const selected = hinted || different || videoDevices[0];

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...baseVideo,
            deviceId: { exact: selected.deviceId },
          },
        });
      }

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.();
      const actualFacing = settings?.facingMode;

      // If the browser reports a different facing mode than requested, do not
      // pretend the switch succeeded. Release the wrong camera immediately.
      if (actualFacing && actualFacing !== requestedFacing) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error(
          `Requested ${requestedFacing === "user" ? "front" : "rear"} camera, but the browser opened ${actualFacing === "user" ? "front" : "rear"} camera.`
        );
      }

      this.currentStream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.facingMode = requestedFacing;
      this.isRunning = true;
      this.permissionState = "granted";
      return stream;
    } catch (err: any) {
      this.isRunning = false;
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        this.permissionState = "denied";
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
    // Prevent double-taps from racing two getUserMedia requests.
    if (this.switchInProgress) return this.switchInProgress;

    const targetFacing = this.facingMode === "user" ? "environment" : "user";
    this.switchInProgress = (async () => {
      await this.startCamera(targetFacing, this.targetResolution.label);
      return this.facingMode;
    })();

    try {
      return await this.switchInProgress;
    } finally {
      this.switchInProgress = null;
    }
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
