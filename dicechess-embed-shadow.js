
(() => {
  const FILE_TO_COL = (f) => f.toLowerCase().charCodeAt(0) - 97;
  const RANK_TO_ROW = (r) => 8 - Number(r);
  const COL_TO_FILE = (c) => String.fromCharCode(97 + Number(c));
  const ROW_TO_RANK = (r) => String(8 - Number(r));

  const ROT = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(-90deg) rotateY(0deg)",
    3: "rotateY(-90deg)",
    4: "rotateY(90deg)",
    5: "rotateX(90deg) rotateY(0deg)",
    6: "rotateX(180deg) rotateY(0deg)",
  };

  const PIPS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
  };

  const CSS = `
    :host{all:initial}
    .dc{all:initial;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111}
    .dc *{box-sizing:border-box}
    .dc-wrap{display:grid;gap:10px;max-width:100%}
    .dc-board-wrap{width:min(92vw,420px);aspect-ratio:1/1;position:relative}
    .dc-board{width:100%;height:100%;display:grid;grid-template-columns:repeat(8,1fr);border:1px solid rgba(0,0,0,.2);overflow:hidden}
    .dc-cell{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .dc-light{background:rgba(235,236,208,.94)}
    .dc-dark{background:rgba(177,177,177,.94)}
    .dc-selected{outline:3px solid rgba(255,215,0,.9);outline-offset:-3px}
    .dc-piece{width:88%;height:88%;position:relative;transform-style:preserve-3d;transform-origin:center;border-radius:8px}
    .dc-face{position:absolute;width:100%;height:100%;border:1px solid rgba(0,0,0,.25);display:flex;flex-wrap:wrap;align-items:center;justify-content:center;backface-visibility:hidden}
    .dc-pip{width:6px;height:6px;margin:2px;border-radius:999px}
    .dc-front{transform:rotateY(0deg) translateZ(15px)}
    .dc-back{transform:rotateY(180deg) translateZ(15px)}
    .dc-right{transform:rotateY(90deg) translateZ(15px)}
    .dc-left{transform:rotateY(-90deg) translateZ(15px)}
    .dc-top{transform:rotateX(90deg) translateZ(15px)}
    .dc-bottom{transform:rotateX(-90deg) translateZ(15px)}
    .dc-controls{display:grid;gap:8px;padding:10px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:transparent}
    .dc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:center}
    .dc-btn{appearance:none;border:1px solid rgba(0,0,0,.18);background:rgba(255,255,255,.92);color:#111;border-radius:999px;padding:8px 12px;font-size:14px;line-height:1;cursor:pointer;user-select:none}
    .dc-btn:disabled{opacity:.45;cursor:not-allowed}
    .dc-input{width:100%;min-height:64px;border:1px solid rgba(0,0,0,.2);border-radius:10px;padding:8px;resize:vertical;background:rgba(255,255,255,.96);color:#111;font-size:12px}
    .dc-status,.dc-note{font-size:12px;text-align:center;word-break:break-word}
    .dc-status{min-height:1.4em;color:rgba(0,0,0,.72)}
    .dc-note{color:rgba(0,0,0,.62)}
    .dc-hidden{display:none !important}
  `;

  function createPiece(top, player, isKing=false) {
    let d;
    switch (top) {
      case 1: d = { top:1,bottom:6,left:4,right:3,front:2,back:5 }; break;
      case 2: d = { top:2,bottom:5,left:4,right:3,front:6,back:1 }; break;
      case 3: d = { top:3,bottom:4,left:6,right:1,front:2,back:5 }; break;
      case 4: d = { top:4,bottom:3,left:1,right:6,front:2,back:5 }; break;
      case 5: d = { top:5,bottom:2,left:4,right:3,front:1,back:6 }; break;
      case 6: d = { top:6,bottom:1,left:4,right:3,front:5,back:2 }; break;
      default: throw new Error("Invalid top");
    }
    if (player === "black") {
      [d.left, d.right] = [d.right, d.left];
      [d.front, d.back] = [d.back, d.front];
    }
    return { ...d, player, isKing };
  }

  function rollDie(die, dir) {
    const n = { ...die };
    switch (dir) {
      case "up":
        n.top = die.back; n.bottom = die.front; n.front = die.top; n.back = die.bottom; break;
      case "down":
        n.top = die.front; n.bottom = die.back; n.front = die.bottom; n.back = die.top; break;
      case "left":
        n.top = die.right; n.bottom = die.left; n.left = die.top; n.right = die.bottom; break;
      case "right":
        n.top = die.left; n.bottom = die.right; n.left = die.bottom; n.right = die.top; break;
    }
    return n;
  }

  function moveDie(piece, dx, dy) {
    let d = { ...piece };
    const step = (dir, count) => { for (let i=0;i<count;i++) d = rollDie(d, dir); };
    if (dy < 0) step("up", -dy); else if (dy > 0) step("down", dy);
    if (dx < 0) step("left", -dx); else if (dx > 0) step("right", dx);
    return d;
  }

  function initialBoard() {
    const setup = [
      [5,3,3,2,6,3,3,5],
      [1,1,1,1,1,1,1,1],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [1,1,1,1,1,1,1,1],
      [5,3,3,6,2,3,3,5],
    ];
    return setup.map((row,r)=>row.map((v,c)=> {
      const p = r < 2 ? "black" : r > 5 ? "white" : null;
      return v == null || !p ? null : createPiece(v, p, v === 2);
    }));
  }

  function cloneBoard(board) {
    return board.map(row => row.map(p => p ? { ...p } : null));
  }

  function parseSquare(s) {
    const m = String(s).trim().match(/^([a-hA-H])([1-8])$/);
    if (!m) return null;
    return { row: RANK_TO_ROW(m[2]), col: FILE_TO_COL(m[1]) };
  }

  function squareText(row, col) {
    return `${COL_TO_FILE(col)}${ROW_TO_RANK(row)}`;
  }

  function parseKifu(text) {
    const raw = String(text || "").replace(/\u3000/g, " ").trim();
    if (!raw) return [];
    return raw.split(/[;\n]+/).map(s => s.trim()).filter(Boolean).map(tok => {
      const clean = tok.replace(/^dc\d+\s*:/i, "");
      const m = clean.match(/^(?:([WB])\s*:\s*)?([a-hA-H][1-8])\s*-\s*([a-hA-H][1-8])(?:\s*:\s*.+)?$/);
      if (!m) throw new Error(`棋譜の形式を読み取れません: ${tok}`);
      const from = parseSquare(m[2]);
      const to = parseSquare(m[3]);
      if (!from || !to) throw new Error(`座標が不正です: ${tok}`);
      return { player: m[1] || "", from, to };
    });
  }

  function buildStates(kifu) {
    const moves = parseKifu(kifu);
    const states = [initialBoard()];
    const meta = [];
    for (const mv of moves) {
      const prev = cloneBoard(states[states.length - 1]);
      const piece = prev[mv.from.row][mv.from.col];
      if (!piece) throw new Error(`駒がありません: ${squareText(mv.from.row, mv.from.col)}`);
      const next = cloneBoard(prev);
      const dx = mv.to.col - mv.from.col;
      const dy = mv.to.row - mv.from.row;
      const after = moveDie(piece, dx, dy);
      next[mv.from.row][mv.from.col] = null;
      next[mv.to.row][mv.to.col] = { ...piece, ...after };
      states.push(next);
      meta.push({ from: mv.from, to: mv.to, piece, text: `${(mv.player || piece.player).toUpperCase()}:${squareText(mv.from.row,mv.from.col)}-${squareText(mv.to.row,mv.to.col)}` });
    }
    return { states, meta };
  }

  function makeDice(piece) {
    const d = document.createElement("div");
    d.className = "dc-piece";
    d.style.transform = ROT[Number(piece.top)] || ROT[1];
    const face = piece.player === "white" ? "#fff" : "#222";
    const pip = piece.player === "white" ? "#000" : "#fff";
    const border = piece.player === "white" ? "#999" : "#444";
    const fm = { front:1, back:6, right:3, left:4, top:2, bottom:5 };
    for (const side of ["front","back","right","left","top","bottom"]) {
      const f = document.createElement("div");
      f.className = `dc-face dc-${side}`;
      f.style.background = piece.isKing ? (piece.player === "white" ? "#c00" : "#06c") : face;
      f.style.borderColor = border;
      for (const _ of PIPS[fm[side]]) {
        const p = document.createElement("div");
        p.className = "dc-pip";
        p.style.background = pip;
        f.appendChild(p);
      }
      d.appendChild(f);
    }
    return d;
  }

  function renderBoard(boardEl, state) {
    boardEl.innerHTML = "";
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const cell = document.createElement("div");
      cell.className = `dc-cell ${(r+c)%2===0 ? "dc-light" : "dc-dark"}`;
      const p = state[r][c];
      if (p) cell.appendChild(makeDice(p));
      boardEl.appendChild(cell);
    }
  }

  function initOne(host) {
    if (host.__dicechess_inited) return;
    host.__dicechess_inited = true;

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${CSS}</style>
      <div class="dc">
        <div class="dc-wrap">
          <div class="dc-board-wrap"><div class="dc-board"></div></div>
          <div class="dc-controls">
            <div class="dc-row">
              <button type="button" class="dc-btn dc-prev">⏮</button>
              <button type="button" class="dc-btn dc-play">▶</button>
              <button type="button" class="dc-btn dc-next">⏭</button>
            </div>
            <div class="dc-row">
              <textarea class="dc-input" placeholder="W:e2-e4;B:e7-e5;W:d2-d4"></textarea>
            </div>
            <div class="dc-row">
              <button type="button" class="dc-btn dc-load">棋譜を読む</button>
            </div>
            <div class="dc-status"></div>
            <div class="dc-note"></div>
          </div>
        </div>
      </div>`;

    const boardEl = shadow.querySelector(".dc-board");
    const prevBtn = shadow.querySelector(".dc-prev");
    const playBtn = shadow.querySelector(".dc-play");
    const nextBtn = shadow.querySelector(".dc-next");
    const loadBtn = shadow.querySelector(".dc-load");
    const inputEl = shadow.querySelector(".dc-input");
    const statusEl = shadow.querySelector(".dc-status");
    const noteEl = shadow.querySelector(".dc-note");
    const defaultKifu = host.getAttribute("data-kifu") || host.dataset.kifu || "";

    inputEl.value = defaultKifu;

    let states = [initialBoard()];
    let meta = [];
    let idx = 0;
    let timer = null;
    let playing = false;

    function refresh() {
      renderBoard(boardEl, states[idx]);
      prevBtn.disabled = idx <= 0;
      nextBtn.disabled = idx >= states.length - 1;
      playBtn.textContent = playing ? "⏸" : "▶";
      statusEl.textContent = idx === 0 ? "初期局面" : `${idx}. ${meta[idx - 1].text}`;
      noteEl.textContent = inputEl.value.trim() ? `棋譜: ${inputEl.value.trim()}` : "";
    }

    function stop() {
      playing = false;
      if (timer) clearInterval(timer);
      timer = null;
      refresh();
    }

    function play() {
      if (playing) return;
      playing = true;
      refresh();
      timer = setInterval(() => {
        if (idx >= states.length - 1) { stop(); return; }
        idx += 1;
        refresh();
      }, 700);
    }

    function load(kifu) {
      const built = buildStates(kifu);
      states = built.states;
      meta = built.meta;
      idx = 0;
      stop();
      refresh();
    }

    prevBtn.onclick = () => { if (idx > 0) { idx -= 1; refresh(); } };
    nextBtn.onclick = () => { if (idx < states.length - 1) { idx += 1; refresh(); } };
    playBtn.onclick = () => playing ? stop() : play();
    loadBtn.onclick = () => {
      try { load(inputEl.value.trim()); }
      catch (e) { statusEl.textContent = `棋譜を読み込めませんでした: ${e.message}`; }
    };

    try {
      if (inputEl.value.trim()) load(inputEl.value.trim());
      else refresh();
    } catch (e) {
      statusEl.textContent = `棋譜を読み込めませんでした: ${e.message}`;
      noteEl.textContent = "";
      renderBoard(boardEl, initialBoard());
    }

    host._dicechess = { load, play, stop };
  }

  function initAll() {
    document.querySelectorAll("[data-dicechess-embed], .dicechess-embed").forEach(initOne);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();

  window.DiceChessEmbed = { init: initAll };
})();
