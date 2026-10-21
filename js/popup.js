/* popup.js — popup thông tin của từ: Hán tự, pinyin, Hán Việt, nghĩa, phát âm, nét viết */
let cur = "", writers = [];

function open(k) {
  cur = k; mark(k);
  $("hz").textContent = k;
  $("py").textContent = D[k].py;
  $("hv").innerHTML = D[k].hv ? "Hán Việt: <b>" + D[k].hv + "</b>" : "";
  $("mn").textContent = "(" + D[k].mn + ")";
  $("nb").classList.toggle("empty", !hasNote(k));   // notes.js
  $("pop").scrollTop = 0;
  $("ov").classList.add("on");
  show(); speak();
}
function show() {
  const wr = $("wr"); wr.innerHTML = ""; writers = [];
  if (typeof HanziWriter === "undefined") { wr.textContent = "(Không tải được thư viện nét viết)"; return }
  [...cur].forEach(ch => {
    if (!HZ[ch]) return;
    const d = document.createElement("div"); wr.appendChild(d);
    writers.push(HanziWriter.create(d, ch, {
      width: 100, height: 100, padding: 6, strokeColor: "#c0392b", radicalColor: "#168f48", outlineColor: "#ddd",
      delayBetweenStrokes: 200, charDataLoader: (c, ok) => ok(HZ[c])
    }));
  });
  play();
}
function play() { let i = 0; (function n() { if (i < writers.length) writers[i++].animateCharacter({ onComplete: n }) })() }
function speak() {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cur); u.lang = "zh-CN"; u.rate = .8;
  const v = speechSynthesis.getVoices().find(v => /zh/i.test(v.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function closePop() { $("ov").classList.remove("on"); window.speechSynthesis && speechSynthesis.cancel() }

$("sp").onclick = speak;
$("an").onclick = () => { writers.forEach(w => w.hideCharacter()); play() };
$("cl").onclick = closePop;
$("ov").onclick = e => { if (e.target.id === "ov") closePop() };
document.addEventListener("click", e => { const t = e.target.closest(".w,.w2"); if (t) open(t.dataset.k) });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($("nov").classList.contains("on")) closeNote(); else closePop();   // Esc đóng popup trên cùng trước
});
