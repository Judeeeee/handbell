// DeviceMotionEvent による「振る」検知。
// 重力込み加速度の大きさ (静止時 ≒ 9.8) がしきい値を超えたら発火する。
// ※ 以前は「前サンプルとの差 delta > 22」で判定していたが、約60Hz の
//   サンプリングでは 1 サンプル間に 22 m/s² も跳ね上がることはほぼ無く、
//   実機で振っても発火しなかった。そのため大きさそのものを見る方式に変更。

export const SHAKE_THRESHOLD = 22; // 静止時 9.8 に対して十分大きな値。感度調整はここで
export const SHAKE_COOLDOWN_MS = 400;

export class ShakeDetector {
  constructor(onShake) {
    this.onShake = onShake;
    this.lastFired = 0;
    this.started = false;
    // start() の結果の詳細。失敗理由を画面に出すために保持する。
    // "granted" | "denied" | "unsupported" | "error:<内容>" | null
    this.lastResult = null;
    this.handler = (e) => this.#handle(e);
  }

  // iOS 13+ はユーザー操作から requestPermission() を呼ぶ必要がある。
  // ★必ずクリック等のイベントハンドラの先頭 (同期的) で呼ぶこと。
  //   先に別の await を挟むと Safari がユーザー操作扱いを外し、
  //   ダイアログが出ないまま denied / 例外になることがある。
  // 許可APIが無い環境 (Android等) ではそのまま開始する。
  async start() {
    if (this.started) {
      this.lastResult = "granted";
      return true;
    }
    if (typeof DeviceMotionEvent === "undefined") {
      this.lastResult = "unsupported";
      return false;
    }
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      let res;
      try {
        res = await DeviceMotionEvent.requestPermission();
      } catch (err) {
        this.lastResult = `error:${(err && err.name) || err}`;
        return false;
      }
      if (res !== "granted") {
        this.lastResult = "denied";
        return false;
      }
    }
    window.addEventListener("devicemotion", this.handler);
    this.started = true;
    this.lastResult = "granted";
    return true;
  }

  stop() {
    window.removeEventListener("devicemotion", this.handler);
    this.started = false;
  }

  #handle(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    const now = Date.now();
    if (mag > SHAKE_THRESHOLD && now - this.lastFired > SHAKE_COOLDOWN_MS) {
      this.lastFired = now;
      this.onShake();
    }
  }
}
