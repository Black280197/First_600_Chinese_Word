// server.js - Tự động tương thích định dạng Từ điển Object { "北京": { py, mn, hv, ch, note } }
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'stories.json');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. API: Lấy dữ liệu
  if (req.method === 'GET' && req.url === '/api/data') {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Không tìm thấy file stories.json trong thư mục!' }));
        return;
      }

      let raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
      raw = raw.replace(/^(const|var|let)\s+\w+\s*=\s*/, '').replace(/;\s*$/, '');
      const parsed = JSON.parse(raw);
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(parsed));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Lỗi đọc file: ' + err.message }));
    }
    return;
  }

  // 2. API: Ghi đè dữ liệu
  if (req.method === 'POST' && req.url === '/api/save') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 1), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Đã lưu thành công vào file stories.json!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Dữ liệu không hợp lệ: ' + err.message }));
      }
    });
    return;
  }

  // 3. Web UI
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quản Lý Ghi Chú Hán Tự</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --accent: #dc2626;
      --success: #16a34a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 24px 16px; }
    .container { max-width: 1100px; margin: 0 auto; }
    
    header {
      background: var(--surface);
      padding: 20px 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    h1 { font-size: 20px; font-weight: 700; color: var(--text); }
    .status-badge {
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 20px;
      background: #ecfdf5;
      color: var(--success);
      font-weight: 600;
    }

    .toolbar {
      background: var(--surface);
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    select, input[type="text"] {
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    select:focus, input[type="text"]:focus { border-color: var(--primary); }
    .search-box { flex: 1; min-width: 240px; }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-save-all { margin-left: auto; background: var(--success); color: white; }
    .btn-save-all:hover { opacity: 0.9; }

    .word-list { display: flex; flex-direction: column; gap: 14px; }
    .word-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
      display: grid;
      grid-template-columns: 140px 200px 1fr 90px;
      gap: 16px;
      align-items: center;
      transition: box-shadow 0.2s;
    }
    .word-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .hanzi-box {
      font-size: 26px;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 2px;
    }
    .pinyin-box {
      font-size: 15px;
      font-weight: 600;
      color: var(--primary);
    }
    .meaning-box {
      font-size: 13.5px;
      color: var(--text);
      margin-top: 3px;
    }
    .hv-box {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .ch-badge {
      display: inline-block;
      font-size: 11px;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
    }
    .note-textarea {
      width: 100%;
      height: 72px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13.5px;
      line-height: 1.5;
      resize: vertical;
      outline: none;
    }
    .note-textarea:focus { border-color: var(--primary); }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      pointer-events: none;
      z-index: 1000;
    }
    .toast.show { opacity: 1; transform: translateY(0); }

    @media (max-width: 768px) {
      .word-card { grid-template-columns: 1fr; gap: 10px; }
      .btn-save-all { width: 100%; margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Trình Biên Tập Ghi Chú Hán Tự</h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Đọc & ghi đè trực tiếp vào file <code>stories.json</code></p>
      </div>
      <div id="statusBadge" class="status-badge">Đang tải...</div>
    </header>

    <div class="toolbar">
      <select id="chapterSelect" onchange="renderWords()"></select>
      <input type="text" id="searchInput" class="search-box" placeholder="Tìm theo chữ Hán, Pinyin, nghĩa hoặc Hán Việt..." oninput="renderWords()">
      <button class="btn btn-save-all" onclick="saveAll()">Lưu Toàn Bộ Vào stories.json</button>
    </div>

    <div id="wordContainer" class="word-list"></div>
  </div>

  <div id="toast" class="toast">Đã lưu thành công!</div>

  <script>
    let rawData = {};
    let isDictMode = true;

    async function loadData() {
      try {
        const res = await fetch('/api/data');
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || ('Lỗi HTTP ' + res.status));
        }

        rawData = await res.json();
        const chapterSelect = document.getElementById('chapterSelect');
        chapterSelect.innerHTML = '';

        if (typeof rawData === 'object' && !Array.isArray(rawData)) {
          isDictMode = true;
          const chapters = new Set();
          Object.values(rawData).forEach(item => {
            if (item && item.ch !== undefined) chapters.add(item.ch);
          });
          const sortedChapters = Array.from(chapters).sort((a, b) => a - b);

          const optAll = document.createElement('option');
          optAll.value = 'all';
          optAll.textContent = \`Tất cả các chương (\${Object.keys(rawData).length} từ)\`;
          chapterSelect.appendChild(optAll);

          sortedChapters.forEach(ch => {
            const count = Object.values(rawData).filter(i => i.ch === ch).length;
            const opt = document.createElement('option');
            opt.value = ch;
            opt.textContent = \`Chương \${ch} (\${count} từ)\`;
            chapterSelect.appendChild(opt);
          });

          document.getElementById('statusBadge').textContent = \`Đã nạp \${Object.keys(rawData).length} từ vựng\`;
        } else if (Array.isArray(rawData)) {
          isDictMode = false;
          rawData.forEach((story, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = \`\${idx + 1}. \${story.t || 'Truyện ' + (idx + 1)} (\${story.w ? story.w.length : 0} từ)\`;
            chapterSelect.appendChild(opt);
          });
          document.getElementById('statusBadge').textContent = \`Đã nạp \${rawData.length} truyện\`;
        }

        renderWords();
      } catch (err) {
        alert('Lỗi tải dữ liệu: ' + err.message);
        document.getElementById('statusBadge').textContent = 'Lỗi nạp dữ liệu';
        document.getElementById('statusBadge').style.background = '#fef2f2';
        document.getElementById('statusBadge').style.color = '#dc2626';
      }
    }

    function renderWords() {
      const selectedCh = document.getElementById('chapterSelect').value;
      const query = document.getElementById('searchInput').value.trim().toLowerCase();
      const container = document.getElementById('wordContainer');
      container.innerHTML = '';

      let count = 0;

      if (isDictMode) {
        for (const [hanzi, item] of Object.entries(rawData)) {
          if (!item) continue;
          
          if (selectedCh !== 'all' && String(item.ch) !== String(selectedCh)) {
            continue;
          }

          const py = item.py || '';
          const mn = item.mn || '';
          const hv = item.hv || '';
          const note = item.note || '';
          const ch = item.ch !== undefined ? item.ch : '';

          if (query) {
            const match = hanzi.toLowerCase().includes(query) ||
                          py.toLowerCase().includes(query) ||
                          mn.toLowerCase().includes(query) ||
                          hv.toLowerCase().includes(query);
            if (!match) continue;
          }

          count++;
          const card = document.createElement('div');
          card.className = 'word-card';
          card.dataset.hanzi = hanzi;
          card.innerHTML = \`
            <div>
              <div class="hanzi-box">\${hanzi}</div>
              <span class="ch-badge">Chương \${ch}</span>
            </div>
            <div>
              <div class="pinyin-box">\${py}</div>
              <div class="meaning-box"><b>Nghĩa:</b> \${mn}</div>
              <div class="hv-box"><b>Hán Việt:</b> \${hv}</div>
            </div>
            <div>
              <textarea class="note-textarea" placeholder="Nhập gợi nhớ chiết tự bộ thủ...">\${note}</textarea>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-primary" style="padding: 8px 14px; font-size: 13px;" onclick="saveSingleDict('\${hanzi}', this)">Lưu</button>
            </div>
          \`;
          container.appendChild(card);
        }
      } else {
        const storyIdx = parseInt(selectedCh) || 0;
        if (!rawData[storyIdx] || !rawData[storyIdx].w) return;
        const words = rawData[storyIdx].w;

        words.forEach((item, wIdx) => {
          const hanzi = item[0] || '';
          const py = item[1] || '';
          const mn = item[2] || '';
          const note = item[3] || '';

          if (query && !hanzi.toLowerCase().includes(query) && !py.toLowerCase().includes(query) && !mn.toLowerCase().includes(query)) {
            return;
          }

          count++;
          const card = document.createElement('div');
          card.className = 'word-card';
          card.dataset.idx = wIdx;
          card.innerHTML = \`
            <div>
              <div class="hanzi-box">\${hanzi}</div>
              <span class="ch-badge">#\${wIdx + 1}</span>
            </div>
            <div>
              <div class="pinyin-box">\${py}</div>
              <div class="meaning-box">\${mn}</div>
            </div>
            <div>
              <textarea class="note-textarea" placeholder="Nhập gợi nhớ chiết tự bộ thủ...">\${note}</textarea>
            </div>
            <div style="text-align: right;">
              <button class="btn btn-primary" style="padding: 8px 14px; font-size: 13px;" onclick="saveSingleArray(\${storyIdx}, \${wIdx}, this)">Lưu</button>
            </div>
          \`;
          container.appendChild(card);
        });
      }

      if (count === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Không tìm thấy từ nào phù hợp.</div>';
      }
    }

    async function saveSingleDict(hanzi, btn) {
      const textarea = btn.closest('.word-card').querySelector('textarea');
      if (rawData[hanzi]) {
        rawData[hanzi].note = textarea.value;
        await persistToServer();
      }
    }

    async function saveSingleArray(storyIdx, wordIdx, btn) {
      const textarea = btn.closest('.word-card').querySelector('textarea');
      if (rawData[storyIdx] && rawData[storyIdx].w[wordIdx]) {
        rawData[storyIdx].w[wordIdx][3] = textarea.value;
        await persistToServer();
      }
    }

    async function saveAll() {
      const cards = document.querySelectorAll('.word-card');
      if (isDictMode) {
        cards.forEach(card => {
          const hanzi = card.dataset.hanzi;
          const noteVal = card.querySelector('textarea').value;
          if (rawData[hanzi]) {
            rawData[hanzi].note = noteVal;
          }
        });
      } else {
        const storyIdx = parseInt(document.getElementById('chapterSelect').value) || 0;
        cards.forEach(card => {
          const wIdx = parseInt(card.dataset.idx);
          const noteVal = card.querySelector('textarea').value;
          if (rawData[storyIdx] && rawData[storyIdx].w[wIdx]) {
            rawData[storyIdx].w[wIdx][3] = noteVal;
          }
        });
      }
      await persistToServer();
    }

    async function persistToServer() {
      try {
        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawData)
        });
        const result = await res.json();
        if (result.success) {
          showToast('Đã lưu và ghi đè vào file stories.json!');
        } else {
          alert('Lỗi khi lưu: ' + result.error);
        }
      } catch (err) {
        alert('Lỗi kết nối server: ' + err.message);
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2500);
    }

    loadData();
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
