export type QaTestStatus = "PASS" | "FAIL" | "NOT TESTED";

export type QaGroupCategory =
  | "1. CAMERA"
  | "2. FACE TRACKING"
  | "3. BEAUTY"
  | "4. EFFECTS"
  | "5. AR FILTERS"
  | "6. BEAUTY + EFFECT"
  | "7. BEAUTY + AR"
  | "8. EFFECT + AR"
  | "9. FULL COMBINED"
  | "10. PHOTO CAPTURE"
  | "11. VIDEO RECORDING"
  | "12. PERFORMANCE";

export interface QaTestItem {
  id: string;
  name: string;
  group: QaGroupCategory;
  userAction: string;
  expectedResult: string;
  quickActionLabel?: string;
  quickActionType?:
    | "cam_front"
    | "cam_back"
    | "cam_mirror"
    | "cam_switch"
    | "cam_toggle"
    | "beauty_level"
    | "effect_apply"
    | "ar_apply"
    | "combo_beauty_effect"
    | "combo_beauty_ar"
    | "combo_effect_ar"
    | "combo_full"
    | "photo_capture"
    | "video_record"
    | "mode_switch";
  quickActionPayload?: any;
}

export const QA_GROUPS: QaGroupCategory[] = [
  "1. CAMERA",
  "2. FACE TRACKING",
  "3. BEAUTY",
  "4. EFFECTS",
  "5. AR FILTERS",
  "6. BEAUTY + EFFECT",
  "7. BEAUTY + AR",
  "8. EFFECT + AR",
  "9. FULL COMBINED",
  "10. PHOTO CAPTURE",
  "11. VIDEO RECORDING",
  "12. PERFORMANCE",
];

export const MANUAL_QA_TESTS: QaTestItem[] = [
  // ==========================================
  // 1. CAMERA
  // ==========================================
  {
    id: "cam_front",
    name: "Front camera",
    group: "1. CAMERA",
    userAction: "Activate front-facing selfie camera using the camera selector or switch button.",
    expectedResult: "Front camera stream initializes cleanly without inverted rotation or black screen.",
    quickActionLabel: "Switch to Front Camera",
    quickActionType: "cam_front",
  },
  {
    id: "cam_back",
    name: "Back camera",
    group: "1. CAMERA",
    userAction: "Switch to rear/environment camera sensor.",
    expectedResult: "Rear camera captures external environment cleanly with correct aspect ratio.",
    quickActionLabel: "Switch to Rear Camera",
    quickActionType: "cam_back",
  },
  {
    id: "cam_orientation",
    name: "Camera orientation",
    group: "1. CAMERA",
    userAction: "Observe video feed orientation in portrait and landscape or rotate device.",
    expectedResult: "Camera stream is 100% UPRIGHT with no upside-down display or stretched aspect ratio.",
  },
  {
    id: "cam_front_mirroring",
    name: "Front mirroring",
    group: "1. CAMERA",
    userAction: "Toggle Front Mirroring button while raising right hand.",
    expectedResult: "When Mirroring is ON, feed mirrors like a selfie mirror (right hand on right side); when OFF, true unmirrored feed is rendered.",
    quickActionLabel: "Toggle Mirroring",
    quickActionType: "cam_mirror",
  },
  {
    id: "cam_resolution",
    name: "Resolution",
    group: "1. CAMERA",
    userAction: "Inspect active hardware stream resolution in telemetry badge (e.g. 1920x1080 or 1280x720).",
    expectedResult: "Resolution matches requested HD/FHD profile without pixel distortion or squishing.",
  },
  {
    id: "cam_start_stop",
    name: "Camera start/stop",
    group: "1. CAMERA",
    userAction: "Click 'Stop Camera' to release media tracks, then click 'Start Camera' to resume.",
    expectedResult: "Stream pauses/halts cleanly upon Stop without freezing WebGL, and starts promptly upon Start.",
    quickActionLabel: "Toggle Camera Start/Stop",
    quickActionType: "cam_toggle",
  },
  {
    id: "cam_switching",
    name: "Camera switching",
    group: "1. CAMERA",
    userAction: "Click 'Switch (Front/Rear)' twice in succession.",
    expectedResult: "Camera switches between front and rear cameras cleanly without WebGL context loss or pipeline stalls.",
    quickActionLabel: "Switch Camera",
    quickActionType: "cam_switch",
  },

  // ==========================================
  // 2. FACE TRACKING
  // ==========================================
  {
    id: "track_detected",
    name: "Face detected",
    group: "2. FACE TRACKING",
    userAction: "Position face directly in front of the camera in ordinary lighting.",
    expectedResult: "Face detection indicator lights up green, HUD displays 'DETECTED', and landmark count reflects tracked points (>0, up to 478).",
  },
  {
    id: "track_lost",
    name: "Face lost",
    group: "2. FACE TRACKING",
    userAction: "Cover camera lens or step completely out of frame.",
    expectedResult: "HUD transitions to 'NOT DETECTED' and AR overlays gracefully hide without residual artifacts.",
  },
  {
    id: "track_reacquired",
    name: "Face reacquired",
    group: "2. FACE TRACKING",
    userAction: "Step back into camera frame after face was lost.",
    expectedResult: "Face tracking immediately rebinds within <100ms, resuming landmark coordinates without camera restart.",
  },
  {
    id: "track_head_left_right",
    name: "Head left/right",
    group: "2. FACE TRACKING",
    userAction: "Turn head smoothly to the left (~45°) and then to the right (~45°) (yaw movement).",
    expectedResult: "Mesh landmarks track head yaw smoothly across rotation angles without sudden snapping or detachment.",
  },
  {
    id: "track_head_up_down",
    name: "Head up/down",
    group: "2. FACE TRACKING",
    userAction: "Tilt chin upwards toward ceiling and downwards toward chest (pitch movement).",
    expectedResult: "Forehead, nose bridge, and chin landmarks maintain precise vertical alignment with facial features.",
  },
  {
    id: "track_head_rotation",
    name: "Head rotation",
    group: "2. FACE TRACKING",
    userAction: "Tilt head sideways toward left and right shoulders (roll movement).",
    expectedResult: "Facial landmarks and AR filters dynamically rotate matching head roll angle in real-time.",
  },
  {
    id: "track_face_distance",
    name: "Face closer/farther",
    group: "2. FACE TRACKING",
    userAction: "Move head close to camera (30 cm) and move back to arm's length (1.5 m).",
    expectedResult: "Landmark mesh scales smoothly with distance; AR elements maintain proportional sizing to face width.",
  },
  {
    id: "track_eye_movement",
    name: "Eye movement",
    group: "2. FACE TRACKING",
    userAction: "Blink eyes individually, widen eyes, and gaze left and right.",
    expectedResult: "Upper/lower eyelid landmarks and eye centers track blink states and eye contours accurately.",
  },
  {
    id: "track_mouth_movement",
    name: "Mouth movement",
    group: "2. FACE TRACKING",
    userAction: "Open mouth wide, smile broadly, and pucker lips.",
    expectedResult: "Lip vermilion landmarks and chin boundary flex dynamically in response to mouth openness and width.",
  },

  // ==========================================
  // 3. BEAUTY (9 controls tested at 0%, 50%, 100%)
  // ==========================================
  {
    id: "beauty_smooth",
    name: "Smooth (Skin Bilateral)",
    group: "3. BEAUTY",
    userAction: "Test Smooth slider at 0%, 50%, and 100%. Inspect skin texture, forehead, and cheek pores.",
    expectedResult: "0%: Raw skin texture untouched. 50%: Subtle skin smoothing while retaining edge detail. 100%: Silky smooth skin with facial mask boundary preserved (background, eyes, and hair remain sharp).",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "smooth" },
  },
  {
    id: "beauty_glow",
    name: "Glow (Highlight Bloom)",
    group: "3. BEAUTY",
    userAction: "Test Glow slider at 0%, 50%, and 100%. Inspect cheekbones, bridge of nose, and forehead.",
    expectedResult: "0%: No bloom. 50%: Soft luminous highlight sheen on facial high-points. 100%: Radiant specular glow restricted to facial skin mask.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "glow" },
  },
  {
    id: "beauty_tone",
    name: "Tone (Radiant Undermix)",
    group: "3. BEAUTY",
    userAction: "Test Tone slider at 0%, 50%, and 100%. Observe facial skin chrominance vs background.",
    expectedResult: "0%: Natural camera skin tones. 50%: Healthier warm radiant undertone. 100%: Vibrant porcelain/rosy tone enhancement on facial skin only.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "tone" },
  },
  {
    id: "beauty_faceslim",
    name: "Face Slim (Mesh Warp)",
    group: "3. BEAUTY",
    userAction: "Test Face Slim slider at 0%, 50%, and 100%. Observe lower cheek width and jawline silhouette.",
    expectedResult: "0%: Natural cheek width. 50%: Natural slender contouring of lower cheeks. 100%: Defined V-line jaw contour without bending background walls or doorframes.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "faceSlim" },
  },
  {
    id: "beauty_eye",
    name: "Eye (Scale & Zoom)",
    group: "3. BEAUTY",
    userAction: "Test Eye slider at 0%, 50%, and 100%. Observe eye size relative to facial geometry.",
    expectedResult: "0%: Natural eye proportions. 50%: Subtle 10-15% enlargement centered on iris. 100%: Bright, visibly enlarged anime-like eye aperture.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "eyeScale" },
  },
  {
    id: "beauty_nose",
    name: "Nose (Slim Pinch Warp)",
    group: "3. BEAUTY",
    userAction: "Test Nose slider at 0%, 50%, and 100%. Observe nasal alar base and nose bridge width.",
    expectedResult: "0%: Natural nose shape. 50%: Refined narrowing of nasal flare. 100%: High-definition sculpted nose profile with nostril symmetry maintained.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "noseSlim" },
  },
  {
    id: "beauty_jaw",
    name: "Jaw (Contour Contraction)",
    group: "3. BEAUTY",
    userAction: "Test Jaw slider at 0%, 50%, and 100%. Observe mandibular angle under ears down to chin.",
    expectedResult: "0%: Natural jawline. 50%: Mild firming along the jaw boundary. 100%: Tapered mandibular angle contraction with smooth transition to neck.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "jaw" },
  },
  {
    id: "beauty_lips",
    name: "Lips (Tint & Plump)",
    group: "3. BEAUTY",
    userAction: "Test Lips slider at 0%, 50%, and 100%. Observe vermilion border and lip saturation.",
    expectedResult: "0%: Natural lip color. 50%: Natural rose tint and plumping. 100%: Rich velvety lip tint enhancement adhering strictly to mouth landmarks.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "lips" },
  },
  {
    id: "beauty_teeth",
    name: "Teeth (Whitening)",
    group: "3. BEAUTY",
    userAction: "Smile with teeth exposed, test Teeth slider at 0%, 50%, and 100%.",
    expectedResult: "0%: Natural enamel tone. 50%: Reduced yellow saturation on dental surface. 100%: Bright clean dental whitening localized strictly within open mouth cavity.",
    quickActionType: "beauty_level",
    quickActionPayload: { param: "teeth" },
  },

  // ==========================================
  // 4. EFFECTS
  // ==========================================
  {
    id: "fx_pink_glow",
    name: "Pink Glow",
    group: "4. EFFECTS",
    userAction: "Select 'Pink Glow' shader effect. Observe viewport lighting and tone.",
    expectedResult: "Warm magenta/rose atmospheric bloom with soft highlight glow across the frame.",
    quickActionLabel: "Apply Pink Glow",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "pink_glow" },
  },
  {
    id: "fx_snow",
    name: "Snow",
    group: "4. EFFECTS",
    userAction: "Select 'Snow' shader effect. Observe particle animation.",
    expectedResult: "Procedural snowflake particles drift downwards across viewport with winter coolness grading.",
    quickActionLabel: "Apply Snow",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "snow" },
  },
  {
    id: "fx_sparkle",
    name: "Sparkle",
    group: "4. EFFECTS",
    userAction: "Select 'Sparkle' shader effect. Move head in front of light source.",
    expectedResult: "Dynamic 4-point specular star glints glimmering across bright reflections and high-contrast edges.",
    quickActionLabel: "Apply Sparkle",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "sparkle" },
  },
  {
    id: "fx_neon",
    name: "Neon",
    group: "4. EFFECTS",
    userAction: "Select 'Neon' shader effect. Observe color saturation and edges.",
    expectedResult: "Cyberpunk chromatic aberration with vivid violet and electric cyan color accents and edge glow.",
    quickActionLabel: "Apply Neon",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "neon" },
  },
  {
    id: "fx_warm",
    name: "Warm",
    group: "4. EFFECTS",
    userAction: "Select 'Warm' shader effect. Observe white balance.",
    expectedResult: "Golden-hour amber color temperature shift warming skin tones and ambient shadows.",
    quickActionLabel: "Apply Warm",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "warm" },
  },
  {
    id: "fx_cool",
    name: "Cool",
    group: "4. EFFECTS",
    userAction: "Select 'Cool' shader effect. Observe white balance.",
    expectedResult: "Nordic arctic-blue color shift producing crisp cyan tones in highlights and cool shadows.",
    quickActionLabel: "Apply Cool",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "cool" },
  },
  {
    id: "fx_vintage",
    name: "Vintage",
    group: "4. EFFECTS",
    userAction: "Select 'Vintage' shader effect. Observe shadows and grain.",
    expectedResult: "Warm sepia film emulation with lifted shadows, subtle film grain, and soft peripheral vignette.",
    quickActionLabel: "Apply Vintage",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "vintage" },
  },
  {
    id: "fx_dream",
    name: "Dream",
    group: "4. EFFECTS",
    userAction: "Select 'Dream' shader effect. Observe image diffusion.",
    expectedResult: "Ethereal pastel soft-focus diffusion creating a whimsical dreamy mood.",
    quickActionLabel: "Apply Dream",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "dream" },
  },
  {
    id: "fx_cinematic",
    name: "Cinematic",
    group: "4. EFFECTS",
    userAction: "Select 'Cinematic' shader effect. Observe color grading contrast.",
    expectedResult: "High-contrast Hollywood teal-and-orange grading with punchy deep blacks and warm skin highlights.",
    quickActionLabel: "Apply Cinematic",
    quickActionType: "effect_apply",
    quickActionPayload: { effect: "cinematic" },
  },

  // ==========================================
  // 5. AR FILTERS
  // ==========================================
  {
    id: "ar_cat",
    name: "Cat",
    group: "5. AR FILTERS",
    userAction: "Select 'Cat' AR filter. Tilt and rotate head sideways.",
    expectedResult: "Feline cat ears positioned atop forehead, animated whiskers on cheeks, and pink nose tip follow head roll and distance.",
    quickActionLabel: "Apply Cat",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "cat" },
  },
  {
    id: "ar_dog",
    name: "Dog",
    group: "5. AR FILTERS",
    userAction: "Select 'Dog' AR filter. Nod and rotate face.",
    expectedResult: "Floppy puppy ears anchored above forehead and animated puppy snout positioned over nose and mouth tracking face angle.",
    quickActionLabel: "Apply Dog",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "dog" },
  },
  {
    id: "ar_elephant",
    name: "Elephant",
    group: "5. AR FILTERS",
    userAction: "Select 'Elephant' AR filter. Move face around.",
    expectedResult: "Curved elephant ears anchored to temples and playful trunk attached to nose bridge tracking head motion.",
    quickActionLabel: "Apply Elephant",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "elephant" },
  },
  {
    id: "ar_glasses",
    name: "Glasses",
    group: "5. AR FILTERS",
    userAction: "Select 'Glasses' AR filter. Turn head left, right, up, down.",
    expectedResult: "Designer sunglasses rest squarely over eye orbits and nose bridge, tilting naturally with perspective.",
    quickActionLabel: "Apply Glasses",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "glasses" },
  },
  {
    id: "ar_crown",
    name: "Crown",
    group: "5. AR FILTERS",
    userAction: "Select 'Crown' AR filter. Tilt head sideways.",
    expectedResult: "Golden royal crown rests steadily above forehead hairline, rotating with head roll and scaling with distance.",
    quickActionLabel: "Apply Crown",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "crown" },
  },
  {
    id: "ar_mask",
    name: "Mask",
    group: "5. AR FILTERS",
    userAction: "Select 'Mask' AR filter. Tilt head in 3D.",
    expectedResult: "Decorative masquerade eye mask fits snugly over bridge of nose and upper cheekbones.",
    quickActionLabel: "Apply Mask",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "mask" },
  },
  {
    id: "ar_makeup",
    name: "Makeup",
    group: "5. AR FILTERS",
    userAction: "Select 'Makeup' AR filter. Blink and smile.",
    expectedResult: "Eyeliner wings, cheek blush gradients, and lip tint align precisely to facial contours.",
    quickActionLabel: "Apply Makeup",
    quickActionType: "ar_apply",
    quickActionPayload: { filter: "makeup" },
  },

  // ==========================================
  // 6. BEAUTY + EFFECT
  // ==========================================
  {
    id: "combo_beauty_effect",
    name: "Beauty + Effect",
    group: "6. BEAUTY + EFFECT",
    userAction: "Enable Beauty (Smooth 60, Tone 30) AND Effect (Pink Glow 70%), with AR disabled. Set comparison mode to 'Beauty + FX'.",
    expectedResult: "Both facial skin bilateral smoothing AND GPU pink glow bloom are visibly active together without suppressing each other.",
    quickActionLabel: "Configure Beauty + Effect",
    quickActionType: "combo_beauty_effect",
  },

  // ==========================================
  // 7. BEAUTY + AR
  // ==========================================
  {
    id: "combo_beauty_ar",
    name: "Beauty + AR",
    group: "7. BEAUTY + AR",
    userAction: "Enable Beauty (Smooth 60, Face Slim 30) AND AR (Cat filter), with Effects disabled. Set mode to 'Beauty + AR'.",
    expectedResult: "Facial skin is smoothed and slimmed, while Cat ears and whiskers overlay precisely onto the warped facial landmarks.",
    quickActionLabel: "Configure Beauty + AR",
    quickActionType: "combo_beauty_ar",
  },

  // ==========================================
  // 8. EFFECT + AR
  // ==========================================
  {
    id: "combo_effect_ar",
    name: "Effect + AR",
    group: "8. EFFECT + AR",
    userAction: "Enable Effect (Pink Glow 70%) AND AR (Cat filter), with Beauty disabled. Set mode to 'FX + AR'.",
    expectedResult: "Viewport and camera background receive Pink Glow grading, while AR Cat ears and nose render cleanly on top with accurate face tracking.",
    quickActionLabel: "Configure Effect + AR",
    quickActionType: "combo_effect_ar",
  },

  // ==========================================
  // 9. FULL COMBINED
  // ==========================================
  {
    id: "combo_full_combined",
    name: "Beauty + Effect + AR (FULL COMBINED)",
    group: "9. FULL COMBINED",
    userAction: "Apply exact preset: Beauty: Smooth 70, Glow 50, Tone 30, Face Slim 20; Effect: Pink Glow 50; AR: Cat. Set comparison mode to 'Combined'.",
    expectedResult: "The final live camera image visibly contains all three layers simultaneously: (1) smoothed and slimmed face, (2) pink glow bloom color grading, and (3) tracked Cat ears and whiskers.",
    quickActionLabel: "Apply FULL COMBINED Preset",
    quickActionType: "combo_full",
  },
  {
    id: "visual_quality_review",
    name: "VISUAL QUALITY REVIEW",
    group: "9. FULL COMBINED",
    userAction:
      "Evaluate the 5 visual rendering modes: (1) ORIGINAL (pure camera feed), (2) BEAUTY (looks like a better camera, no full-screen pink wash, eyes/hair/background preserved), (3) EFFECT (clean GPU post-processing), (4) AR (realistic original vector assets tracking head movement), (5) FULL COMBINED (all 3 layers harmoniously blended in correct pipeline order).",
    expectedResult:
      "All 5 modes demonstrate high visual craft: realistic AR filter assets (Cat, Dog, Elephant, Glasses, Crown, Mask, Makeup) anchor firmly and tilt with face; Beauty enhances skin naturally without background blur or pink tint; performance maintains smooth frame rate.",
    quickActionLabel: "Apply Full Combined for Review",
    quickActionType: "combo_full",
  },

  // ==========================================
  // 10. PHOTO CAPTURE
  // ==========================================
  {
    id: "capture_photo_qa",
    name: "Full Combined Photo Capture",
    group: "10. PHOTO CAPTURE",
    userAction: "Ensure FULL COMBINED preset is active. Click 'Capture Photo'. Inspect the captured preview below and download.",
    expectedResult: "Captured JPEG image contains Beauty (smoothing/slim), Effect (Pink Glow), and AR (Cat filter) with correct upright orientation.",
    quickActionLabel: "Capture Photo Now",
    quickActionType: "photo_capture",
  },

  // ==========================================
  // 11. VIDEO RECORDING
  // ==========================================
  {
    id: "record_video_qa",
    name: "Full Combined Video Recording",
    group: "11. VIDEO RECORDING",
    userAction: "Ensure FULL COMBINED is active. Click 'Start Recording', move head for 4 seconds, then click 'Stop Recording'. Play video preview.",
    expectedResult: "Saved WebM/MP4 video plays smoothly with correct orientation, sharp camera feed, visible beauty smoothing, visible pink glow, visible AR cat, and audio track.",
    quickActionLabel: "Toggle Video Recording",
    quickActionType: "video_record",
  },

  // ==========================================
  // 12. PERFORMANCE
  // ==========================================
  {
    id: "perf_telemetry_qa",
    name: "Real Hardware Performance Telemetry",
    group: "12. PERFORMANCE",
    userAction: "Inspect real-time telemetry panel while all 3 layers run. Verify metrics reflect actual hardware execution (not mock numbers).",
    expectedResult: "Camera FPS, Tracking FPS (~25-30), Render FPS (~30-60), Processing Latency (ms), and native stream resolution display accurate measured live values.",
  },
];
