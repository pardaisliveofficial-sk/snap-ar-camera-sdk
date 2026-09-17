# Snap AR — Mobile Beauty Result QA

## Intended behavior
- Camera starts in **Natural Camera** with no AR filter automatically selected.
- Beauty processing is always the first image-processing layer.
- A filter/lens is applied only after the user taps it.
- AR/lens overlays follow the real-time face tracking landmarks and head roll.
- Beauty/Makeup library entries modify the face-aware beauty engine; they are not just decorative color blobs.

## Test sequence
1. Open Mobile Camera Test on a real HTTPS device.
2. Compare Natural Camera with the device camera.
3. Open Beauty → set Skin Smoothing to 0, capture a reference.
4. Set Skin Smoothing 70–80, Glow 30–40, Eye Bright 50–60 and compare.
5. Test Face Slim, Eye Size and Nose Slim independently at low values.
6. Test a Beauty library filter such as Glass Skin Silk.
7. Turn the head left/right/up/down and verify the beauty mask stays on the face.
8. Select an AR filter manually and verify it follows the face; it must not appear before selection.
9. Switch front/back camera and verify mirror behavior separately.
10. Repeat in bright and low-light conditions.

## Pass criteria
- Skin texture is softened without blurring the background.
- Eyes, brows, nostrils and lips remain defined.
- Enhancement is visible but natural; no global gray/pink wash.
- Face reshaping remains localized to the tracked face.
- AR assets remain attached during head movement.
