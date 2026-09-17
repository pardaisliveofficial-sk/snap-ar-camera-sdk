# SnapAR Beauty Engine — Stage 5

## Visual correction
- Removed the previous whole-face-oval fallback from the active beauty mask.
- Beauty smoothing now requires the tracked face region AND a skin-chroma confidence gate.
- Strengthened the skin smoothing radius from 2/4px to 4/8px with 16 edge-aware samples.
- Increased smoothing/denoise strength while reducing detail recovery so the effect is visibly measurable.
- Kept eyes, brows, mouth and nose detail excluded.
- Tone/glow remain skin-only.

## Important validation
Test Beauty OFF vs ON on a real Android/iPhone camera. The expected result is visibly smoother skin while eyes, brows, lips, hair and background remain comparatively sharp.
Do not claim production quality or Snapchat/TikTok parity until this is visually verified on real devices.
