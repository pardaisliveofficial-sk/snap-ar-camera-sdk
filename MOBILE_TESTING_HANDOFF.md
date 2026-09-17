# SnapAR Mobile Camera Test Mode — Beauty / Filter QA Build

This build is intentionally focused on **real phone validation before SaaS production hardening**.

## What is now in the mobile test surface
- Full-screen mobile camera preview with safe-area handling.
- Snap AR branding in the camera header.
- Front/back camera switch with front mirror / rear non-mirror behavior.
- Filters, Beauty and Adjust bottom tabs.
- Search + category chips.
- Featured AR lenses plus the complete 165-item built-in filter catalog.
- Built-in filter cards are selectable and immediately applied through the mobile test renderer; category-specific procedural overlays make every catalog item visibly testable.
- Beauty presets and live controls for smoothing, glow, face slim, eye bright/size, nose, lips and teeth.
- Scrollable filter grid and vertically scrollable Beauty/Adjust controls.
- Photo and video capture remain available above the bottom sheet.
- PWA manifest, icons, service worker and Chrome `beforeinstallprompt` install action are included.

## Beauty-engine correction
The previous GPU beauty fragment shader had a shader-order bug (`inFaceContour` was referenced before declaration), which could cause the beauty program to fail compilation and leave the preview effectively unchanged. The shader has been replaced with a simpler mobile-safe face-local pipeline: skin-region masking, weighted multi-tap smoothing, tone/glow, eye brightening, lip enhancement, teeth whitening, and localized face/eye/nose/jaw warps.

## QA requirement
Do not treat the 165 catalog entries as 165 unique photographic/3D asset packages. They are a test catalog backed by procedural/category render logic until individual production assets are supplied. The goal of this build is to verify that selection, loading state, renderer path, beauty processing and mobile UX work end-to-end.
