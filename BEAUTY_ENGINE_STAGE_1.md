# SnapAR Beauty Engine — Stage 1

Goal: establish a real, visible, face-local beauty baseline before adding/validating authored AR lenses.

Changes:
- Added a 256x256 tracked face mask generated from MediaPipe's dense 478 landmarks.
- Excludes eyes, mouth and nose detail from smoothing.
- Removed the old `max(chromaSkin, 0.62)` fallback that caused hair/beard/background pixels inside the face oval to be treated as skin.
- Added broad YCbCr skin gating.
- Improved edge-preserving smoothing and micro-detail recovery.
- Corrected localized eye enlargement and face/nose slimming warp directions.
- Removed the mobile auto-beauty mutation when a built-in filter is merely selected. Filter activation remains explicit.
- Removed the visible Before/After comparison control.

Validation requirement:
- Test on real Android/iOS HTTPS camera.
- Compare Beauty OFF vs default Beauty ON visually.
- Confirm background/hair/beard are not smeared.
- Confirm eye/face/nose controls produce visible but natural changes.

Important: this is still a web GPU implementation, not a claim of parity with a native OEM/major social-app camera ISP. If the desired quality is not reached on-device, the next engineering stage should introduce a dedicated face/skin segmentation model and a multi-pass temporal beauty pipeline rather than adding more UI or decorative filters.
