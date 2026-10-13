// Cook-Along Mode configuration. Values marked "validate" come from the spec's open items.
export const CONFIG = {
  recipeUrl: 'data/dal-tadka.json',
  catalogUrl: 'data/recipes.json',

  // Wake word (spec 6.1): 2–3 syllables, easy in any accent, not a food word.
  wakeWord: 'Zara',
  // Common ways speech recognition writes the default wake word.
  wakeWordAliases: ['zara', 'zarah', 'zaara', 'sara', 'sarah', 'zahra', 'zahara', 'czara', 'tsara'],
  recognitionLang: 'en-IN',
  speechLang: 'en-IN',
  speechRate: 0.95,

  // Feedback timings (spec 6.5)
  commandConfirmMs: 1500,   // "Next ✓" stays visible this long
  actionDelayMs: 350,       // confirmation shows first, then the action happens
  notUnderstoodMs: 2000,
  listeningTimeoutMs: 6000, // after the wake word alone, wait this long for a command

  holdToCancelMs: 1000,     // spec 8.4

  // Distance-adaptive layout (spec 9) — validate threshold with the legibility test
  distance: {
    thresholdCm: 100,
    bandCm: 15,
    holdMs: 1500,
    sampleMs: 200,
    faceWidthCm: 15,     // average face width used for the estimate
    cameraHFovDeg: 60,   // typical laptop/tablet front camera; calibrate in Test controls
  },

  vision: {
    bundle: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs',
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',
    model: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
  },
};
