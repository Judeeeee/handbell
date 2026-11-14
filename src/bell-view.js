// ベルの見た目: 音に応じた色替え、鳴った時の揺れと波紋。

export class BellView {
  constructor({ bellEl, bodyEl, noteNameEl, rippleHost }) {
    this.bellEl = bellEl;
    this.bodyEl = bodyEl;
    this.noteNameEl = noteNameEl;
    this.rippleHost = rippleHost;
  }

  showNote(note) {
    // ベル本体全体をその音の色一色にする。持ち手は白のまま変えない。
    // 表示はカナのみ (高いドは ド↑)。英語音名・周波数は画面に出さない。
    this.bodyEl.setAttribute("fill", note.color);
    this.noteNameEl.textContent = note.name + (note.index === 7 ? "↑" : "");
    this.noteNameEl.style.color = note.color;
    document.documentElement.style.setProperty("--note-color", note.color);
  }

  ring() {
    this.bellEl.classList.remove("ringing");
    void this.bellEl.offsetWidth; // アニメーション再開始
    this.bellEl.classList.add("ringing");
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    this.rippleHost.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }
}
