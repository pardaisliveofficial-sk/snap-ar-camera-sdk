# Camera SDK Integration Guide

This guide provides engineering integration instructions for consuming the Camera SDK across Web, Android, iOS, Flutter, React Native, and Unity.

---

## 1. Web Integration (JavaScript / TypeScript)

### Installation
```bash
npm install @snap-ar/camera-sdk
```

### Quickstart
```html
<!-- index.html -->
<canvas id="camera-viewport" width="1280" height="720"></canvas>
```

```typescript
import { SnapCameraSDK } from '@snap-ar/camera-sdk';

const canvas = document.getElementById('camera-viewport') as HTMLCanvasElement;
const sdk = new SnapCameraSDK(canvas);

await sdk.initialize();
await sdk.startCamera('user', '1080p');

// Apply Beauty
sdk.setBeautyParameter('smooth', 60);
sdk.setBeautyParameter('faceSlim', 25);

// Apply Effect
sdk.setEffect('cinematic');

// Apply AR Filter
sdk.setARFilter('cat');
```

---

## 2. Android (.aar) Integration

### Gradle Setup
Add the `.aar` package to your app module's `libs` directory:
```groovy
// app/build.gradle
dependencies {
    implementation files('libs/snap-camera-sdk-release.aar')
    implementation 'androidx.camera:camera-camera2:1.3.1'
    implementation 'androidx.camera:camera-lifecycle:1.3.1'
    implementation 'androidx.camera:camera-view:1.3.1'
}
```

### Kotlin Implementation
```kotlin
import com.snapar.camera.SnapCameraSDK
import com.snapar.camera.model.BeautyConfig
import com.snapar.camera.model.EffectType
import com.snapar.camera.model.ArFilterType

class CameraActivity : AppCompatActivity() {
    private lateinit var cameraSdk: SnapCameraSDK

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_camera)

        cameraSdk = SnapCameraSDK.Builder(this)
            .setSurfaceView(findViewById(R.id.glSurfaceView))
            .build()

        cameraSdk.startCamera(lifecycleOwner = this)
        cameraSdk.setBeautyParameter("smooth", 65f)
        cameraSdk.setEffect(EffectType.PINK_GLOW)
        cameraSdk.setARFilter(ArFilterType.GLASSES)
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraSdk.destroy()
    }
}
```

---

## 3. iOS (.xcframework) Integration

### Swift Package Manager / Framework Linking
Drag `SnapCameraSDK.xcframework` into **Frameworks, Libraries, and Embedded Content**.

```swift
import UIKit
import SnapCameraSDK
import AVFoundation

class CameraViewController: UIViewController {
    private var cameraSDK: SnapCameraSDK!
    @IBOutlet weak var previewView: MTKView! // MetalKit View

    override func viewDidLoad() {
        super.viewDidLoad()

        cameraSDK = SnapCameraSDK(metalView: previewView)
        cameraSDK.startCamera(position: .front) { success in
            if success {
                self.cameraSDK.setBeautyParameter(.smooth, value: 0.6)
                self.cameraSDK.setEffect(.cinematic)
                self.cameraSDK.setARFilter(.crown)
            }
        }
    }
}
```

---

## 4. Flutter Plugin Integration

### pubspec.yaml
```yaml
dependencies:
  flutter:
    sdk: flutter
  snap_camera_sdk: ^1.0.0
```

### Dart Usage
```dart
import 'package:flutter/material.dart';
import 'package:snap_camera_sdk/snap_camera_sdk.dart';

class CameraScreen extends StatefulWidget {
  @override
  _CameraScreenState createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  late SnapCameraController _controller;

  @override
  void initState() {
    super.initState();
    _controller = SnapCameraController(
      resolution: ResolutionPreset.high,
      lensDirection: CameraLensDirection.front,
    );
    _controller.initialize().then((_) {
      setState(() {});
      _controller.setBeautyParameter(BeautyParameter.smooth, 70);
      _controller.setEffect(Effect.pinkGlow);
      _controller.setARFilter(ARFilter.cat);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_controller.isInitialized) return Container();
    return SnapCameraPreview(controller: _controller);
  }
}
```

---

## 5. React Native Plugin Integration

### Installation
```bash
npm install react-native-snap-camera
cd ios && pod install
```

### Component Usage
```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SnapCameraView, SnapCameraRef } from 'react-native-snap-camera';

export default function App() {
  const cameraRef = useRef<SnapCameraRef>(null);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.startCamera('front');
      cameraRef.current.setBeautyParameter('smooth', 60);
      cameraRef.current.setEffect('vintage');
      cameraRef.current.setARFilter('dog');
    }
  }, []);

  return (
    <View style={styles.container}>
      <SnapCameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        onFaceDetected={(detected) => console.log('Face detected:', detected)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
});
```

---

## 6. Unity Package Integration

### C# Usage
```csharp
using UnityEngine;
using SnapAR.Camera;

public class CameraController : MonoBehaviour
{
    [SerializeField] private Material targetMaterial;
    private SnapCameraSDK cameraSdk;

    void Start()
    {
        cameraSdk = new SnapCameraSDK();
        cameraSdk.Initialize(targetMaterial);
        cameraSdk.StartCamera(CameraFacing.Front);
        cameraSdk.SetBeautyParameter("smooth", 0.75f);
        cameraSdk.SetEffect("neon");
        cameraSdk.SetARFilter("crown");
    }

    void OnDestroy()
    {
        cameraSdk?.Destroy();
    }
}
```
