# SnapAR Beauty Engine — Stage 8

## Why this stage exists
Stage 7 still showed no useful beauty improvement and the preview could show circular/half-frame artifacts. This stage removes the remaining coordinate mismatch and hard split rendering path.

## Changes
- FaceLandmarker normalized Y coordinates are passed to the beauty shader without an incorrect `1-y` flip.
- Adaptive skin mask confidence is less brittle and remains constrained by face geometry.
- Skin-only smoothing strength is increased while preserving feature exclusions.
- Default automatic skin smoothing is 72/100 so Beauty has a visible baseline without requiring manual slider tuning.
- Legacy before/after split rendering is disabled in production `FilterEngine` output so no hard vertical divider/half-shaded frame can leak into camera/SDK output.

## Validation
Required on a real phone: Beauty OFF vs automatic Beauty ON. PASS requires a continuous image with no divider/circles/white patches and visibly cleaner skin.
