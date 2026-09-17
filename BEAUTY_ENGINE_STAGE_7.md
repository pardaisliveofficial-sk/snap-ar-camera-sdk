# SnapAR Beauty Engine — Stage 7

## Goal
Replace the previous face-oval/chroma heuristic with an adaptive, image-derived skin probability mask. The goal is a natural automatic beauty baseline: no cheek circles, no white wash, and no manual tuning required for the basic result.

## Changes
- Added adaptive skin-color estimation from cheek + forehead camera samples.
- Skin probability now comes from actual camera pixels inside a soft face region.
- Removed the second hard chroma gate that could create isolated cheek circles.
- Added mask feathering and eye/mouth exclusion.
- Mask refresh is throttled to ~10 Hz to protect mobile performance.
- Default automatic beauty is now smoothing-focused with glow/tone/teeth disabled by default.
- Existing AR/effects architecture is unchanged.

## Validation
This stage must be validated on an actual Android/iOS browser. The required visual PASS is: original camera and Beauty ON differ naturally; there are no circles, white patches, face-oval borders, or background smoothing.
