import { NOTES } from "./notes.js";
import { AudioEngine } from "./audio.js";
import { ShakeDetector } from "./shake.js";
import { BellView } from "./bell-view.js";

const state = { current: 4, enabled: false }; // 初期音は「ソ」

const slider = document.getElementById("note-slider");
const labels = document.getElementById("note-labels");
const enableBtn = document.getElementById("enable-btn");
const statusEl = document.getElementById("sensor-status");

const view = new BellView({
  bellEl: document.getElementById("bell"),
  bodyEl: document.getElementById("bell-body"),
  noteNameEl: document.getElementById("note-name"),
  rippleHost: document.getElementById("bell-stage"),
});
const audio = new AudioEngine();

function setNote(i) {
  state.current = Math.max(0, Math.min(NOTES.length - 1, i));
  slider.value = String(state.current);
  view.showNote(NOTES[state.current]);
  [...labels.children].forEach((el, j) =>
    el.classList.toggle("active", j === state.current),
  );
}

function playCurrent() {
  audio.play(NOTES[state.current]);
  view.ring();
  if (navigator.vibrate) navigator.vibrate(30);
}

const shake = new ShakeDetector(playCurrent);

// 音階ラベルを生成 (ラベル自体もタップで切替可能)
NOTES.forEach((n, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = n.name + (n.index === 7 ? "↑" : "");
  b.style.setProperty("--c", n.color);
  b.setAttribute("aria-label", `${n.name} (${n.en})`);
  b.addEventListener("click", () => setNote(i));
  labels.appendChild(b);
});

slider.addEventListener("input", () => setNote(Number(slider.value)));

// タッチ / クリックで演奏
document
  .getElementById("bell-stage")
  .addEventListener("pointerdown", async () => {
    if (!state.enabled) await enable();
    playCurrent();
  });

// PCフォールバック: スペースキー
window.addEventListener("keydown", async (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!state.enabled) await enable();
    playCurrent();
  }
  if (e.code === "ArrowRight") setNote(state.current + 1);
  if (e.code === "ArrowLeft") setNote(state.current - 1);
});

// 初回ボタン: 音声の解放 + センサー許可を1タップに集約
async function enable() {
  // ★順番が重要: センサー許可 (requestPermission) を一番先に呼ぶ。
  //   先に audio.unlock() を await すると Safari がユーザー操作扱いを外し、
  //   許可ダイアログが出ないまま失敗することがある。
  //   shake.start() の呼び出し自体は同期的 (await は結果待ちだけ後ろに回す)。
  const shakePromise = shake.start();
  const okAudio = await audio.unlock();
  const okShake = await shakePromise.catch(() => false);
  state.enabled = okAudio;
  if (okShake) {
    statusEl.textContent = "センサー ON";
  } else if (shake.lastResult === "denied") {
    statusEl.textContent = "センサー許可が拒否されました";
  } else if (shake.lastResult === "unsupported") {
    statusEl.textContent = "このブラウザはセンサー非対応です";
  } else if (shake.lastResult && shake.lastResult.startsWith("error:")) {
    statusEl.textContent = `センサーエラー (${shake.lastResult.slice(6)})`;
  } else {
    statusEl.textContent = "タップで演奏";
  }
  statusEl.classList.toggle("on", !!okShake);
  enableBtn.hidden = okAudio && okShake;
  if (okAudio) playCurrent();
}
enableBtn.addEventListener("click", enable);

// スリープ復帰後に AudioContext が止まっていたら次回タップで復活する
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.enabled) audio.unlock();
});

setNote(state.current);
