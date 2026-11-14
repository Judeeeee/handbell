// DeviceMotionEvent による「振る」検知。
// 加速度の大きさの変化量がしきい値を超え、かつクールダウンを過ぎた時だけ発火する。

export const SHAKE_THRESHOLD = 22;   // 感度調整はこの1か所で
export const SHAKE_COOLDOWN_MS = 400;

export class ShakeDetector {
  constructor(onShake) {
    this.onShake = onShake;
    this.last = null;
    this.lastFired = 0;
    this.handler = (e) => this.#handle(e);
  }

  // iOS 13+ はユーザー操作から requestPermission() を呼ぶ必要がある。
  // 許可APIが無い環境 (Android等) ではそのまま開始する。
  async start() {
    if (typeof DeviceMotionEvent === "undefined") return false;
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== "granted") return false;
    }
    window.addEventListener("devicemotion", this.handler);
    return true;
  }

  stop() {
    window.removeEventListener("devicemotion", this.handler);
  }

  #handle(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (this.last === null) { this.last = mag; return; }
    const delta = Math.abs(mag - this.last);
    this.last = mag;
    const now = Date.now();
    if (delta > SHAKE_THRESHOLD && now - this.lastFired > SHAKE_COOLDOWN_MS) {
      this.lastFired = now;
      this.onShake();
    }
  }
}
