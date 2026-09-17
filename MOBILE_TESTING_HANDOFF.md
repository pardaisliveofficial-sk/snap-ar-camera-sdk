# SnapAR Mobile Camera Test Mode

This build adds a dedicated mobile-first camera testing surface.

## Test flow
- Open the app: Mobile Camera Test opens first.
- Camera fills the phone viewport.
- Front/back switch is a physical camera switch using exact `facingMode` first, then an `ideal` fallback.
- Front camera is mirrored; rear camera is not.
- Bottom sheet has Filters, Beauty, and Adjust tabs.
- Filter cards scroll horizontally.
- Beauty and Adjust controls scroll vertically inside the sheet.
- Photo/record controls remain above the sheet.
- Exit returns to the developer Test Lab.

## Important validation
This UI is a test harness. It does not claim that every beauty operation is visually production-grade. Validate the actual face-processing output on real Android/iOS devices before moving to SaaS production hardening.
