/* reader.js — dựng 6 chương, thanh điều hướng, tiến độ học, tuỳ chọn hiển thị
   Mỗi từ trong D: D["北京"] = { py, mn, hv, ch }  (ghi chú nằm ở stories.json, xem notes.js) */
const $ = id => document.getElementById(id);
const D = {}, IDX = {};
const seen = new Set(), bk = $("bk"), nv = $("nv");

CH.forEach((c, i) => {
  c.w.forEach(([k, p, m]) => { D[k] = { py: p, mn: m, hv: HV[k] || "", ch: i + 1 }; IDX[k] = i });
  c.re = new RegExp(c.w.map(x => x[0]).sort((a, b) => b.length - a.length).join("|"), "g");
});

CH.forEach((c, i) => {
  const b = document.createElement("button");
  b.dataset.i = i; b.innerHTML = `Chương ${i + 1}<small id="n${i}">0/100</small>`; nv.appendChild(b);
  const sec = document.createElement("section"); sec.className = "ch"; sec.id = "c" + i;
  let h = `<h1>${c.t}</h1><div class="sub">Chương ${i + 1}/6 · bấm vào chữ đỏ để học</div>`;
  c.s.forEach(t => h += "<p>" + t.replace(c.re, m =>
    `<span class="w" data-k="${m}"><ruby class="rh">${m}<rt>${D[m].py}</rt></ruby><ruby class="rp">${D[m].py}<rt>${m}</rt></ruby><small>(${D[m].mn})</small></span>`) + "</p>");
  h += `<div class="pn"><button class="g" data-go="${i - 1}" ${i ? "" : "style=visibility:hidden"}>← Chương ${i}</button><button data-go="${i + 1}" ${i < 5 ? "" : "style=visibility:hidden"}>Chương ${i + 2} →</button></div>`;
  h += `<h2>100 từ của chương ${i + 1}</h2><div class="grid">` +
    c.w.map(([k, p, m]) => `<button class="w2" data-k="${k}"><span>${k}</span><small>${m}</small></button>`).join("") + "</div>";
  if (i == 5) h += `<div class="cnt" style="margin-top:2em">❄ Hết ❄ — cảm ơn bạn đã đọc đến cuối.</div>`;
  sec.innerHTML = h; bk.appendChild(sec);
});

function go(i) {
  i = Math.max(0, Math.min(5, i));
  document.querySelectorAll(".ch").forEach((e, j) => e.classList.toggle("on", j == i));
  nv.querySelectorAll("button").forEach((e, j) => e.classList.toggle("on", j == i));
  history.replaceState(null, "", "#c" + (i + 1)); window.scrollTo(0, 0);
}
function upd() {
  $("prog").querySelector("b").textContent = seen.size;
  CH.forEach((c, i) => $("n" + i).textContent = c.w.filter(x => seen.has(x[0])).length + "/100");
}
function mark(k) {
  seen.add(k);
  document.querySelectorAll(`[data-k="${k}"]`).forEach(e => e.classList.add("done"));
  upd();
}

document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) return go(+g.dataset.go);
  const n = e.target.closest("#nv button"); if (n) go(+n.dataset.i);
});

/* ---- tuỳ chọn hiển thị (lưu localStorage) ---- */
const B = document.body, PK = "hsk600-prefs";
function save() {
  try { localStorage.setItem(PK, JSON.stringify({ m: B.classList.contains("mp") ? "p" : "h", py: $("tp").checked, hz: $("th").checked, mn: $("tm").checked })) } catch (_) {}
}
function setMode(m) {
  B.classList.toggle("mh", m !== "p"); B.classList.toggle("mp", m === "p");
  $("md").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === (m === "p" ? "p" : "h")));
}
$("md").onclick = e => { const b = e.target.closest("button"); if (!b) return; setMode(b.dataset.m); save() };
$("tp").onchange = e => { B.classList.toggle("nopy", !e.target.checked); save() };
$("th").onchange = e => { B.classList.toggle("noyh", !e.target.checked); save() };
$("tm").onchange = e => { B.classList.toggle("nomean", !e.target.checked); save() };
try {
  const p = JSON.parse(localStorage.getItem(PK) || "null");
  if (p) {
    setMode(p.m);
    $("tp").checked = p.py !== false; $("th").checked = p.hz !== false; $("tm").checked = p.mn !== false;
    B.classList.toggle("nopy", !$("tp").checked); B.classList.toggle("noyh", !$("th").checked); B.classList.toggle("nomean", !$("tm").checked);
  }
} catch (_) {}
go((parseInt((location.hash || "#c1").slice(2)) || 1) - 1);
