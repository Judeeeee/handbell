// Web Audio API によるベル音の合成。
// 録音ファイルを使わず、基音 + 倍音を指数減衰させることでベルらしく響かせる。
// 将来は play() の中身だけをサンプル再生に差し替え可能。

const PARTIALS = [
  { ratio: 1.0,  gain: 1.0,  decay: 2.5 },
  { ratio: 2.02, gain: 0.5,  decay: 1.8 },
  { ratio: 2.74, gain: 0.25, decay: 1.0 },
  { ratio: 5.4,  gain: 0.1,  decay: 0.5 },
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
  }

  // ユーザー操作 (初回タップ) の中で呼ぶこと。iOS の自動再生制限対策。
  async unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      // 簡易リバーブ: 生成したインパルス応答を使う Convolver
      const verb = this.ctx.createConvolver();
      verb.buffer = this.#impulse(1.4, 2.2);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
      this.master.connect(verb);
      verb.connect(wet);
      wet.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx.state === "running";
  }

  #impulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buffer;
  }

  play(note) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime;
    for (const p of PARTIALS) {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = note.freq * p.ratio;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35 * p.gain, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t);
      osc.stop(t + p.decay + 0.05);
    }
  }
}
