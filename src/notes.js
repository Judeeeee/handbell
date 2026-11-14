// 8音階の定義 (C4 - C5)。色は KC BC-08K/MU 実物セットの並びに倣う。
// ベル本体は全体をその音の色一色で塗り、持ち手だけ白にする。
// 高いド (C5) は低いドと同色 (濃い赤) で、実物セットと同じ。
export const NOTES = [
  { index: 0, name: "ド",   en: "C4", freq: 261.63, color: "#b01e24" },
  { index: 1, name: "レ",   en: "D4", freq: 293.66, color: "#e94e1b" },
  { index: 2, name: "ミ",   en: "E4", freq: 329.63, color: "#f2cf07" },
  { index: 3, name: "ファ", en: "F4", freq: 349.23, color: "#35a83a" },
  { index: 4, name: "ソ",   en: "G4", freq: 392.0,  color: "#1f7fc2" },
  { index: 5, name: "ラ",   en: "A4", freq: 440.0,  color: "#2035b8" },
  { index: 6, name: "シ",   en: "B4", freq: 493.88, color: "#7e256f" },
  { index: 7, name: "ド",   en: "C5", freq: 523.25, color: "#b01e24" },
];
