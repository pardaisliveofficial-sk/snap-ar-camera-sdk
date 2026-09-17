# SnapAR Beauty Engine — Stage 6

## Goal
Natural automatic beauty output before AR/effects. The user should not need to tune sliders to remove a mask/white-overlay artifact.

## Critical correction
FaceLandmarker coordinates are video-space (Y top-down), while the WebGL camera texture uses vertically flipped texture coordinates. Stage 6 converts both the GPU facial uniforms and the raster skin mask to the same texture-space coordinate system.

## Beauty changes
- Conservative YCbCr skin confidence instead of broad color wash.
- Natural smoothing strength with detail preservation.
- Tone/glow reduced to avoid whitening/halo artifacts.
- Global shadow/midtone lift kept subtle.
- Default beauty profile is automatic/natural: smoothing 46, tone/glow 10, no default face reshaping, low vibrance.

## Validation
Compare raw camera and Beauty ON on the same phone/lighting. PASS requires: no circular cheek patches, no white face layer, eyes/lips/beard/hair remain sharp, skin is visibly cleaner, and the result remains stable while the head moves.
