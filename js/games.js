/* ============================================================
   🎮 미니게임 9종 (감각 조절 · 인지 연습용, 저자극 디자인)
============================================================ */

/* 1) 버블 팝 */
function seedBubbleGame() {
  const wrap = document.getElementById('bubbleGame');
  if (!wrap) return;
  wrap.innerHTML = '';
  const count = 14;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.style.left = Math.random() * 90 + '%';
    b.style.top = Math.random() * 80 + '%';
    b.style.animationDelay = (Math.random() * 2) + 's';
    b.addEventListener('click', () => {
      b.classList.add('popped');
      gameSpeak('펑!');
      setTimeout(() => {
        b.style.left = Math.random() * 90 + '%';
        b.style.top = Math.random() * 80 + '%';
        b.classList.remove('popped');
      }, 350);
    });
    wrap.appendChild(b);
  }
}

/* 2) 동그라미 따라 그리기 (캔버스) */
function initCircleGame() {
  const canvas = document.getElementById('circleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  let drawing = false;

  function drawGuide() {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#d8d2c8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  drawGuide();

  function pos(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: cx * (w / rect.width), y: cy * (h / rect.height) };
  }
  function start(e) {
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e) {
    if (!drawing) return;
    const p = pos(e);
    ctx.strokeStyle = '#7c9885';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); });
  canvas.addEventListener('touchend', end);

  document.getElementById('circleResetBtn')?.addEventListener('click', drawGuide);
}

/* 3) 패턴 기억 게임 */
const patternGameState = { seq: [], userSeq: [], showing: false };
function initPatternGame() {
  const grid = document.getElementById('patternGrid');
  const startBtn = document.getElementById('patternStartBtn');
  const statusEl = document.getElementById('patternStatus');
  if (!grid || !startBtn) return;
  const cells = Array.from(grid.querySelectorAll('.pattern-cell'));

  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => {
      if (patternGameState.showing || !patternGameState.seq.length) return;
      flashCell(cell);
      patternGameState.userSeq.push(idx);
      const i = patternGameState.userSeq.length - 1;
      if (patternGameState.userSeq[i] !== patternGameState.seq[i]) {
        statusEl.textContent = '다시 도전해봐요! 😊';
        gameSpeak('다시 도전해봐요');
        patternGameState.seq = [];
        return;
      }
      if (patternGameState.userSeq.length === patternGameState.seq.length) {
        statusEl.textContent = '정답이에요! 🎉';
        gameSpeak('정답이에요');
        setTimeout(() => nextPatternRound(cells, statusEl), 900);
      }
    });
  });

  startBtn.addEventListener('click', () => {
    patternGameState.seq = [];
    nextPatternRound(cells, statusEl);
  });
}
function nextPatternRound(cells, statusEl) {
  patternGameState.seq.push(Math.floor(Math.random() * cells.length));
  patternGameState.userSeq = [];
  patternGameState.showing = true;
  statusEl.textContent = '순서를 잘 봐요…';
  let i = 0;
  const showNext = () => {
    if (i >= patternGameState.seq.length) {
      patternGameState.showing = false;
      statusEl.textContent = '이제 따라해봐요!';
      return;
    }
    flashCell(cells[patternGameState.seq[i]]);
    i++;
    setTimeout(showNext, 700);
  };
  setTimeout(showNext, 500);
}
function flashCell(cell) {
  cell.classList.add('lit');
  setTimeout(() => cell.classList.remove('lit'), 400);
}

/* 4) 분류하기 게임 (드래그 또는 클릭) */
const SORT_ITEMS = [
  { emoji: '🍎', cat: 'food' }, { emoji: '🥕', cat: 'food' }, { emoji: '🍞', cat: 'food' },
  { emoji: '🐶', cat: 'animal' }, { emoji: '🐱', cat: 'animal' }, { emoji: '🐦', cat: 'animal' },
  { emoji: '🚗', cat: 'vehicle' }, { emoji: '🚲', cat: 'vehicle' }, { emoji: '✈️', cat: 'vehicle' },
];
function initSortGame() {
  const pool = document.getElementById('sortPool');
  const bins = document.querySelectorAll('.sort-bin');
  if (!pool || !bins.length) return;
  pool.innerHTML = '';
  const shuffled = [...SORT_ITEMS].sort(() => Math.random() - 0.5);
  shuffled.forEach((item) => {
    const chip = document.createElement('button');
    chip.className = 'sort-chip';
    chip.textContent = item.emoji;
    chip.dataset.cat = item.cat;
    chip.addEventListener('click', () => {
      chip.classList.add('sort-selected');
      chip.dataset.selected = '1';
    });
    pool.appendChild(chip);
  });
  bins.forEach((bin) => {
    bin.addEventListener('click', () => {
      const selected = pool.querySelector('.sort-chip[data-selected="1"]');
      if (!selected) return;
      const correct = selected.dataset.cat === bin.dataset.cat;
      if (correct) {
        gameSpeak('맞았어요');
        selected.remove();
      } else {
        gameSpeak('다시 생각해봐요');
        selected.classList.remove('sort-selected');
        selected.dataset.selected = '';
      }
    });
  });
}

/* 5) 리듬 따라치기 */
let rhythmSeq = [];
let rhythmUserIdx = 0;
function initRhythmGame() {
  const btn = document.getElementById('rhythmTapBtn');
  const startBtn = document.getElementById('rhythmStartBtn');
  const statusEl = document.getElementById('rhythmStatus');
  if (!btn || !startBtn) return;

  startBtn.addEventListener('click', () => {
    rhythmSeq = Array.from({ length: 4 }, () => 300 + Math.floor(Math.random() * 3) * 250);
    rhythmUserIdx = 0;
    statusEl.textContent = '리듬을 들어보세요…';
    playRhythmSeq(0);
  });

  let lastTapAt = null;
  let tapIntervals = [];
  btn.addEventListener('click', () => {
    const now = Date.now();
    if (lastTapAt) tapIntervals.push(now - lastTapAt);
    lastTapAt = now;
    btn.classList.add('tap-active');
    setTimeout(() => btn.classList.remove('tap-active'), 150);
    rhythmUserIdx++;
    if (rhythmUserIdx >= rhythmSeq.length) {
      statusEl.textContent = '잘했어요! 🎵';
      gameSpeak('잘했어요');
      lastTapAt = null; tapIntervals = [];
    }
  });
}
function playRhythmSeq(i) {
  const statusEl = document.getElementById('rhythmStatus');
  if (i >= rhythmSeq.length) { if (statusEl) statusEl.textContent = '이제 따라 쳐보세요!'; return; }
  const dot = document.getElementById('rhythmDot');
  dot?.classList.add('pulse');
  setTimeout(() => dot?.classList.remove('pulse'), 200);
  setTimeout(() => playRhythmSeq(i + 1), rhythmSeq[i]);
}

/* 6) 다른 그림 찾기 */
const DIFFERENCE_SETS = [
  { emoji: '🌻', count: 8, oddIdx: 3, odd: '🌼' },
  { emoji: '🍀', count: 8, oddIdx: 5, odd: '☘️' },
  { emoji: '⭐', count: 8, oddIdx: 2, odd: '🌟' },
];
function initDifferenceGame() {
  const grid = document.getElementById('differenceGrid');
  const statusEl = document.getElementById('differenceStatus');
  if (!grid) return;
  let round = 0;
  function renderRound() {
    const set = DIFFERENCE_SETS[round % DIFFERENCE_SETS.length];
    grid.innerHTML = '';
    for (let i = 0; i < set.count; i++) {
      const cell = document.createElement('button');
      cell.className = 'diff-cell';
      cell.textContent = i === set.oddIdx ? set.odd : set.emoji;
      cell.addEventListener('click', () => {
        if (i === set.oddIdx) {
          statusEl.textContent = '찾았어요! 🎉';
          gameSpeak('찾았어요');
          round++;
          setTimeout(renderRound, 900);
        } else {
          statusEl.textContent = '다시 살펴봐요';
        }
      });
      grid.appendChild(cell);
    }
  }
  renderRound();
}

/* 7) 순서 만들기 (루프 빌더) */
const LOOP_STEPS = ['👋 인사하기', '👀 눈 마주치기', '🗣️ 이름 말하기', '❓ 질문하기'];
function initLoopGame() {
  const pool = document.getElementById('loopPool');
  const track = document.getElementById('loopTrack');
  const checkBtn = document.getElementById('loopCheckBtn');
  const statusEl = document.getElementById('loopStatus');
  if (!pool || !track) return;

  function render() {
    pool.innerHTML = '';
    const shuffled = [...LOOP_STEPS].sort(() => Math.random() - 0.5);
    shuffled.forEach((step) => {
      const chip = document.createElement('button');
      chip.className = 'loop-chip';
      chip.textContent = step;
      chip.addEventListener('click', () => {
        track.appendChild(chip.cloneNode(true));
        chip.remove();
        bindTrackChip(track.lastChild);
      });
      pool.appendChild(chip);
    });
    track.innerHTML = '';
  }
  function bindTrackChip(chip) {
    chip.classList.add('loop-chip-placed');
    chip.addEventListener('click', () => {
      pool.appendChild(chip);
      chip.classList.remove('loop-chip-placed');
    });
  }
  checkBtn?.addEventListener('click', () => {
    const order = Array.from(track.children).map((c) => c.textContent);
    const correct = order.length === LOOP_STEPS.length && order.every((v, i) => v === LOOP_STEPS[i]);
    statusEl.textContent = correct ? '순서가 정확해요! 🎉' : '순서를 다시 맞춰볼까요?';
    if (correct) gameSpeak('순서가 정확해요');
  });
  document.getElementById('loopResetBtn')?.addEventListener('click', render);
  render();
}

/* 8) 안전하게 클릭하기 (충동 조절) */
function initSafeClickGame() {
  const area = document.getElementById('safeClickArea');
  const statusEl = document.getElementById('safeClickStatus');
  if (!area) return;
  let score = 0, misses = 0;
  function spawn() {
    if (!area.isConnected) return;
    const target = document.createElement('button');
    const isSafe = Math.random() > 0.3;
    target.className = 'safe-target' + (isSafe ? '' : ' unsafe');
    target.textContent = isSafe ? '✅' : '⛔';
    target.style.left = Math.random() * 85 + '%';
    target.style.top = Math.random() * 80 + '%';
    target.addEventListener('click', () => {
      if (isSafe) { score++; gameSpeak('좋아요'); } else { misses++; gameSpeak('잠깐, 멈춰요'); }
      statusEl.textContent = `잘함 ${score} · 다시 생각해볼 것 ${misses}`;
      target.remove();
    });
    area.appendChild(target);
    setTimeout(() => target.remove(), 2200);
  }
  const timer = setInterval(spawn, 1400);
  area.dataset.timerId = timer;
}

/* 9) 감정 표정 짝맞추기 */
const EMOTION_PAIRS = [
  { face: '😊', label: '기쁨' }, { face: '😢', label: '슬픔' },
  { face: '😠', label: '화남' }, { face: '😲', label: '놀람' },
  { face: '😌', label: '편안함' }, { face: '😟', label: '걱정' },
];
function initEmotionGame() {
  const grid = document.getElementById('emotionGrid');
  const statusEl = document.getElementById('emotionStatus');
  if (!grid) return;
  let selected = null;
  function render() {
    const cards = [...EMOTION_PAIRS, ...EMOTION_PAIRS]
      .map((p, i) => ({ ...p, uid: i }))
      .sort(() => Math.random() - 0.5);
    grid.innerHTML = '';
    let matched = 0;
    cards.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'emotion-card';
      btn.textContent = '❓';
      btn.addEventListener('click', () => {
        if (btn.classList.contains('matched') || btn.classList.contains('flipped')) return;
        btn.textContent = c.face;
        btn.classList.add('flipped');
        if (!selected) {
          selected = { btn, label: c.label };
        } else if (selected.label === c.label && selected.btn !== btn) {
          selected.btn.classList.add('matched');
          btn.classList.add('matched');
          selected = null;
          matched += 2;
          gameSpeak('짝을 찾았어요');
          if (matched === cards.length) { statusEl.textContent = '모두 맞췄어요! 🎉'; }
        } else {
          setTimeout(() => {
            btn.textContent = '❓';
            btn.classList.remove('flipped');
            if (selected) { selected.btn.textContent = '❓'; selected.btn.classList.remove('flipped'); }
            selected = null;
          }, 700);
        }
      });
      grid.appendChild(btn);
    });
  }
  render();
  document.getElementById('emotionResetBtn')?.addEventListener('click', render);
}
