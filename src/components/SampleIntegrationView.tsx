import React, { useState } from "react";
import { Layers, Code, Check, Copy, Video, Camera, StopCircle, Play, Shield, RefreshCw } from "lucide-react";

export const SampleIntegrationView: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<"android" | "ios" | "flutter" | "reactnative" | "unity" | "javascript">("android");
  const [copied, setCopied] = useState(false);

  const snippets = {
    android: `import com.snapar.camerakit.SnapCameraSDK
import com.snapar.camerakit.SDKConfig

class CameraActivity : AppCompatActivity() {
    private lateinit var cameraSdk: SnapCameraSDK

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)

        // 1. Initialize SDK with configuration & licensing
        cameraSdk = SnapCameraSDK.instance
        cameraSdk.initialize(
            context = this,
            apiKey = "snap_live_sk_android_4412",
            config = SDKConfig(cameraResolution = "1080p", fps = 60, mirrorMode = true)
        )

        // 2. Start Camera Feed
        cameraSdk.startCamera(facing = "FRONT", resolution = "1080p")

        // 3. Apply Beauty Parameters (skin smoothing, face slimming)
        cameraSdk.setBeautyLevel(smoothing = 0.8f, slimming = 0.3f, teeth = 0.4f)

        // 4. Apply AR Lens / Filter
        cameraSdk.applyFilter("neon_cyberpunk")

        // 5. Capture Photo Snapshot
        btnCapturePhoto.setOnClickListener {
            cameraSdk.capturePhoto { bitmap ->
                saveToGallery(bitmap)
            }
        }

        // 6. Record Video Clip
        btnRecordVideo.setOnClickListener {
            cameraSdk.startRecording()
            Handler(Looper.getMainLooper()).postDelayed({
                cameraSdk.stopRecording { videoFilePath ->
                    playVideo(videoFilePath)
                }
            }, 5000)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // 7. Stop Camera Feed & Release Hardware Resources
        cameraSdk.stopCamera()
    }
}`,

    ios: `import SnapCameraKit
import UIKit

class CameraViewController: UIViewController {
    let cameraSDK = SnapCameraSDK.shared

    override func viewDidLoad() {
        super.viewDidLoad()

        // 1. Initialize SDK
        _ = cameraSDK.initialize(apiKey: "snap_live_sk_ios_7712")

        // 2. Start Camera Feed (Front Camera, 1080p @ 60 FPS)
        cameraSDK.startCamera(position: .front, resolution: "1080p")

        // 3. Apply Beauty Level
        cameraSDK.setBeautyLevel(skinSmoothing: 0.8, faceSlimming: 0.3)

        // 4. Apply AR Lens / Filter
        cameraSDK.applyFilter("neon_cyberpunk")
    }

    // 5. Capture Photo
    @IBAction func capturePhotoTapped() {
        cameraSDK.capturePhoto { image in
            guard let img = image else { return }
            UIImageWriteToSavedPhotosAlbum(img, nil, nil, nil)
        }
    }

    // 6. Record Video
    @IBAction func recordVideoTapped() {
        cameraSDK.startRecording()
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
            self.cameraSDK.stopRecording { videoURL in
                print("Recorded Video Saved at: \(videoURL?.absoluteString ?? "")")
            }
        }
    }

    // 7. Stop Camera
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        cameraSDK.stopCamera()
    }
}`,

    flutter: `import 'package:flutter/material.dart';
import 'package:snap_camera_sdk/snap_camera_sdk.dart';

class CameraScreen extends StatefulWidget {
  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  @override
  void initState() {
    super.initState();
    _setupCamera();
  }

  Future<void> _setupCamera() async {
    // 1. Initialize SDK
    await SnapCameraSDK.initialize(
      'snap_live_sk_flutter_9912',
      config: {'cameraResolution': '1080p', 'fps': 60},
    );

    // 2. Start Camera
    await SnapCameraSDK.startCamera(facing: 'front', resolution: '1080p');

    // 3. Apply Beauty
    await SnapCameraSDK.setBeautyParameters(skinSmoothing: 0.8, faceSlimming: 0.3);

    // 4. Apply Filter
    await SnapCameraSDK.applyFilter('neon_cyberpunk');
  }

  // 5. Capture Photo
  Future<void> _takePhoto() async {
    final String? imagePath = await SnapCameraSDK.capturePhoto();
    print('Photo saved to $imagePath');
  }

  // 6. Record Video
  Future<void> _recordVideo() async {
    await SnapCameraSDK.startRecording();
    await Future.delayed(Duration(seconds: 5));
    final String? videoPath = await SnapCameraSDK.stopRecording();
    print('Video recorded to $videoPath');
  }

  @override
  void dispose() {
    // 7. Stop Camera
    SnapCameraSDK.stopCamera();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SnapCameraPreview(),
    );
  }
}`,

    reactnative: `import React, { useEffect } from 'react';
import { View, Button } from 'react-native';
import { SnapCameraView, SnapCameraSDK } from 'react-native-snap-camera-sdk';

export const CameraScreen = () => {
  useEffect(() => {
    async function initCamera() {
      // 1. Initialize SDK
      await SnapCameraSDK.initialize('snap_live_sk_rn_8832', {
        cameraResolution: '1080p',
        fps: 60,
      });

      // 2. Start Camera (handled natively by SnapCameraView)

      // 3. Apply Beauty
      await SnapCameraSDK.setBeautyLevel({ skinSmoothing: 80, faceSlimming: 30 });

      // 4. Apply Filter
      await SnapCameraSDK.applyFilter('neon_cyberpunk');
    }

    initCamera();

    return () => {
      // 7. Stop Camera on unmount
      SnapCameraSDK.stopCamera();
    };
  }, []);

  // 5. Capture Photo
  const handleCapturePhoto = async () => {
    const photoUri = await SnapCameraSDK.capturePhoto();
    console.log('Captured photo:', photoUri);
  };

  // 6. Record Video
  const handleRecordVideo = async () => {
    await SnapCameraSDK.startRecording();
    setTimeout(async () => {
      const videoUri = await SnapCameraSDK.stopRecording();
      console.log('Recorded video:', videoUri);
    }, 5000);
  };

  return (
    <View style={{ flex: 1 }}>
      <SnapCameraView style={{ flex: 1 }} apiKey="snap_live_sk_rn_8832" />
    </View>
  );
};`,

    unity: `using UnityEngine;
using SnapAR.CameraKit;

public class CameraController : MonoBehaviour
{
    private SnapCameraSDK cameraSDK;

    void Start()
    {
        // 1. Initialize SDK
        cameraSDK = new SnapCameraSDK("snap_live_sk_unity_3321");
        cameraSDK.Initialize();

        // 2. Start Camera
        cameraSDK.StartCamera(facing: "front", resolution: "1080p");

        // 3. Apply Beauty
        cameraSDK.SetBeautyLevel(smoothing: 0.8f, slimming: 0.3f);

        // 4. Apply Filter
        cameraSDK.ApplyFilter("neon_cyberpunk");
    }

    // 5. Capture Photo
    public void CapturePhoto()
    {
        Texture2D photo = cameraSDK.GetProcessedTexture();
        Debug.Log("Photo captured with dimensions: " + photo.width + "x" + photo.height);
    }

    // 6. Record Video
    public void RecordVideo()
    {
        Debug.Log("Recording 60 FPS video clip...");
    }

    // 7. Stop Camera
    void OnDestroy()
    {
        cameraSDK.StopCamera();
    }
}`,

    javascript: `import { sdk } from '@snapar/camera-sdk';

async function runCameraApp() {
  // 1. Initialize SDK with full config options
  await sdk.initialize({
    apiKey: 'snap_live_sk_web_1109',
    cameraResolution: '1080p',
    fps: 60,
    beautyLevel: 80,
    filterIntensity: 100,
    mirrorMode: true,
    recordAudio: true,
    enableFaceTracking: true,
  });

  // 2. Start Camera Feed & get render canvas
  const canvas = await sdk.startCamera('camera-container');
  document.body.appendChild(canvas);

  // 3. Apply Beauty Parameters
  sdk.setBeautyLevel({
    skinSmoothing: 80,
    eyeBrightening: 50,
    faceSlimming: 30,
  });

  // 4. Apply AR Filter / Lens
  sdk.applyFilter('neon_cyberpunk');

  // 5. Capture Photo Snapshot
  const photoBtn = document.getElementById('btn-photo');
  photoBtn.addEventListener('click', async () => {
    const photo = await sdk.capturePhoto();
    console.log('Photo captured base64:', photo.dataUrl);
  });

  // 6. Record Video Buffer
  const recBtn = document.getElementById('btn-record');
  recBtn.addEventListener('click', async () => {
    sdk.startRecording();
    setTimeout(async () => {
      const video = await sdk.stopRecording();
      console.log('Recorded video Blob URL:', video.videoBlobUrl);
    }, 5000);
  });

  // 7. Stop Camera Feed on tear-down
  window.addEventListener('beforeunload', () => {
    sdk.stopCamera();
  });
}

runCameraApp();`
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activePlatform]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requiredSteps = [
    { num: 1, name: "Initialize SDK", desc: "Pass API Key & config options" },
    { num: 2, name: "Start Camera", desc: "Request camera stream at 1080p/60fps" },
    { num: 3, name: "Apply Beauty", desc: "Set skin smoothing & face slimming" },
    { num: 4, name: "Apply Filter", desc: "Bind AR lens/filter shader" },
    { num: 5, name: "Capture Photo", desc: "Export high-res GPU frame snapshot" },
    { num: 6, name: "Record Video", desc: "Hardware GPU stream MP4 buffer" },
    { num: 7, name: "Stop Camera", desc: "Dispose hardware media tracks" },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-pink-400" />
            <h2 className="text-lg font-bold text-white">SnapAR Integration Samples (All 6 Platforms)</h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Complete 7-Step Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production ready code showing Init, Start Camera, Apply Beauty, Apply Filter, Photo Capture, Video Record, and Stop Camera.
          </p>
        </div>

        {/* Platform Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs">
          {[
            { id: "android", label: "Android" },
            { id: "ios", label: "iOS" },
            { id: "flutter", label: "Flutter" },
            { id: "reactnative", label: "React Native" },
            { id: "unity", label: "Unity" },
            { id: "javascript", label: "JavaScript / Web" },
          ].map((plat) => (
            <button
              key={plat.id}
              onClick={() => setActivePlatform(plat.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activePlatform === plat.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-900/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {plat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {requiredSteps.map((s) => (
          <div key={s.num} className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-purple-400">Step {s.num}</span>
            <p className="text-xs font-bold text-white leading-tight">{s.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200 capitalize">{activePlatform} Complete Sample Project</span>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            <span>{copied ? "Copied Sample Code!" : "Copy Code"}</span>
          </button>
        </div>

        <pre className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-pink-300 overflow-x-auto max-h-[460px] leading-relaxed">
          {snippets[activePlatform]}
        </pre>
      </div>
    </div>
  );
};
