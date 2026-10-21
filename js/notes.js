/* notes.js — nạp ghi chú gợi nhớ từ stories.json (cùng thư mục với index.html)
   và hiển thị trong popup riêng khi bấm nút "📝 Ghi chú" ở popup của từ.
   stories.json: { "北京": { "py":…, "mn":…, "hv":…, "ch":1, "note":"…" }, … }  — chỉ đọc field "note". */
const NO_NOTE = "Chưa có ghi chú gợi nhớ";
let STORIES = null, storiesError = "";

fetch("./stories.json", { cache: "no-store" })
  .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() })
  .then(j => { STORIES = j; if (cur && $("ov").classList.contains("on")) $("nb").classList.toggle("empty", !hasNote(cur)) })
  .catch(err => {
    storiesError = location.protocol === "file:"
      ? "Không đọc được stories.json vì trang đang mở trực tiếp bằng file:// (trình duyệt chặn). Hãy chạy một máy chủ cục bộ trong thư mục này, ví dụ:\n\npython -m http.server 8000\n\nrồi mở http://localhost:8000"
      : "Không tải được stories.json (" + err.message + "). Kiểm tra file có nằm cùng thư mục với index.html và đúng định dạng JSON không.";
  });

function noteOf(k) {
  const v = STORIES && STORIES[k];
  const n = typeof v === "string" ? v : (v && v.note) || "";
  return typeof n === "string" ? n.trim() : "";
}
function hasNote(k) { return !!noteOf(k) }

function openNote(k) {
  $("nhz").textContent = k; $("npy").textContent = D[k].py; $("nmn").textContent = "(" + D[k].mn + ")";
  const b = $("nbody"), n = noteOf(k);
  b.className = ""; b.scrollTop = 0;
  if (!STORIES && storiesError) { b.textContent = storiesError; b.className = "err" }
  else if (!STORIES) { b.textContent = "Đang tải ghi chú…"; b.className = "empty" }
  else if (n) b.textContent = n;
  else { b.textContent = NO_NOTE; b.className = "empty" }
  $("nov").classList.add("on");
}
function closeNote() { $("nov").classList.remove("on") }

$("nb").onclick = () => { if (cur) openNote(cur) };
$("ncl").onclick = closeNote;
$("nov").onclick = e => { if (e.target.id === "nov") closeNote() };
