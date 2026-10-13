// Distance estimate from the front camera (spec 9). Frames are processed on device
// by MediaPipe Face Detection and are never stored or sent anywhere.
export class DistanceSensor extends EventTarget {
  constructor(cfg, vision, calibrationK) {
    super();
    this.cfg = cfg;
    this.vision = vision;
    this.calibrationK = calibrationK || null;
    this.state = 'far';          // spec: default to far until proven close
    this.candidate = null;
    this.candidateSince = 0;
    this.widths = [];
    this.lastCm = null;
    this.status = 'pending';
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) return this._setStatus('unavailable');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
    } catch (e) {
      return this._setStatus(e && e.name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.autoplay = true;
    video.srcObject = stream;
    try { await video.play(); } catch { /* autoplay with muted video is allowed */ }
    this.video = video;

    try {
      const vision = await import(this.vision.bundle);
      const files = await vision.FilesetResolver.forVisionTasks(this.vision.wasm);
      this.detector = await vision.FaceDetector.createFromOptions(files, {
        baseOptions: { modelAssetPath: this.vision.model, delegate: 'CPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch (e) {
      console.warn('Face detection could not load', e);
      stream.getTracks().forEach((t) => t.stop());
      return this._setStatus('unavailable');
    }
    this._setStatus('on');
    this.timer = setInterval(() => this._sample(), this.cfg.sampleMs);
  }

  /** Distance constant: cm = k / faceWidthPx. */
  get k() {
    if (this.calibrationK) return this.calibrationK;
    const w = this.video?.videoWidth || 640;
    const focalPx = (w / 2) / Math.tan((this.cfg.cameraHFovDeg * Math.PI) / 360);
    return this.cfg.faceWidthCm * focalPx;
  }

  /** Call while standing 1 m from the tablet. Returns the new constant or null. */
  calibrate() {
    if (this.widths.length < 3) return null;
    const sorted = [...this.widths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    this.calibrationK = this.cfg.thresholdCm * median;
    return this.calibrationK;
  }

  _sample() {
    const v = this.video;
    if (!v || v.readyState < 2 || !this.detector) return;
    let res;
    try { res = this.detector.detectForVideo(v, performance.now()); } catch { return; }
    const faces = res?.detections || [];
    if (!faces.length) {
      // Cook left the camera view: hold the last state.
      this.candidate = null;
      this.lastCm = null;
      this._emit('reading', null);
      return;
    }
    const width = Math.max(...faces.map((d) => d.boundingBox?.width || 0));
    this.widths.push(width);
    if (this.widths.length > 7) this.widths.shift();
    const sorted = [...this.widths].sort((a, b) => a - b);
    const cm = Math.round(this.k / sorted[Math.floor(sorted.length / 2)]);
    this.lastCm = cm;
    this._emit('reading', cm);
    this._evaluate(cm);
  }

  _evaluate(cm) {
    const { thresholdCm: T, bandCm: B, holdMs } = this.cfg;
    const target = cm > T + B ? 'far' : cm < T - B ? 'close' : null;
    const now = performance.now();
    if (target && target !== this.state) {
      if (this.candidate !== target) { this.candidate = target; this.candidateSince = now; }
      else if (now - this.candidateSince >= holdMs) {
        this.state = target;
        this.candidate = null;
        this._emit('state', target);
      }
    } else {
      this.candidate = null;
    }
  }

  _setStatus(s) { this.status = s; this._emit('status', s); }
  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
}
