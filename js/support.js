/* ============================================================
   🧩 보조 도구: 그림 말하기 · 행동 조절 · 루틴 관리 · 미니게임
============================================================ */
const pictureOverlay = document.getElementById('pictureOverlay');
const regulationOverlay = document.getElementById('regulationOverlay');
const routineOverlay = document.getElementById('routineOverlay');
const gamesOverlay = document.getElementById('gamesOverlay');
const picGrid = document.getElementById('picGrid');
const regStatus = document.getElementById('regStatus');
const regStateGrid = document.getElementById('regStateGrid');
const regLogEl = document.getElementById('regLog');
const routineListEl = document.getElementById('routineList');
const routineInput = document.getElementById('routineInput');
const routineAddBtn = document.getElementById('routineAddBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');

const PICTURE_PHRASES = [
  { emoji: '💧', text: '물 마시고 싶어요' },
  { emoji: '🚻', text: '화장실 가고 싶어요' },
  { emoji: '😣', text: '아파요' },
  { emoji: '😴', text: '피곤해요' },
  { emoji: '🍽️', text: '배고파요' },
  { emoji: '🔇', text: '조용히 해주세요' },
  { emoji: '🙋', text: '도와주세요' },
  { emoji: '⏸️', text: '잠깐 쉬고 싶어요' },
  { emoji: '🚪', text: '나가고 싶어요' },
  { emoji: '😊', text: '좋아요' },
  { emoji: '😢', text: '슬퍼요' },
  { emoji: '😠', text: '화나요' },
];

const REG_STATE_PRESETS = [
  { emoji: '😌', label: '편안해요' },
  { emoji: '😐', label: '보통이에요' },
  { emoji: '😟', label: '불안해요' },
  { emoji: '😣', label: '힘들어요' },
  { emoji: '🤯', label: '과부하예요' },
];

let regulationState = { log: [] };
let gameSoundOn = true;

function loadRegulationLog() {
  try {
    const raw = localStorage.getItem('chunjik.regulationLog');
    regulationState.log = raw ? JSON.parse(raw) : [];
  } catch (e) { regulationState.log = []; }
}
function saveRegulationLog() {
  try { localStorage.setItem('chunjik.regulationLog', JSON.stringify(regulationState.log)); } catch (e) {}
}
function logRegulationEvent(label) {
  regulationState.log.unshift({ label, at: new Date().toISOString() });
  regulationState.log = regulationState.log.slice(0, 20);
  saveRegulationLog();
  renderRegulationLog();
  logPrivacyActivity('regulation_event', { label });
}
function renderRegulationLog() {
  if (!regLogEl) return;
  if (!regulationState.log.length) {
    regLogEl.innerHTML = '<p class="muted">아직 기록이 없어요.</p>';
    return;
  }
  regLogEl.innerHTML = regulationState.log.map((e) => {
    const t = new Date(e.at);
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `<div class="reg-log-item"><span class="reg-log-time">${hh}:${mm}</span> ${escapeHtml(e.label)}</div>`;
  }).join('');
}

function speakKorean(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.95;
    utter.pitch = 1.05;
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

function openSupportSection(which) {
  const map = {
    picture: pictureOverlay,
    regulation: regulationOverlay,
    routine: routineOverlay,
    games: gamesOverlay,
  };
  const el = map[which];
  showOnlyOverlay(el);
  if (el) {
    logPrivacyActivity('support_open', { which });
  }
}
function openGameSection(focusId) {
  closeFabPlusMenu?.();
  openSupportSection('games');
  const focusMap = {
    pattern: 'patternGrid',
    sort: 'sortPool',
    rhythm: 'rhythmDot',
    difference: 'diffLeft',
    loop: 'loopShape',
    safe: 'safeGrid',
    emotion: 'emotionGrid',
    bubble: 'bubbleGrid',
    circle: 'circleCanvas',
  };
  const target = focusMap[focusId] || focusId;
  if (target) {
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}
function closeSupport() {
  pictureOverlay?.classList.remove('show');
  regulationOverlay?.classList.remove('show');
  routineOverlay?.classList.remove('show');
  gamesOverlay?.classList.remove('show');
}

document.getElementById('pictureClose')?.addEventListener('click', closeSupport);
document.getElementById('regulationClose')?.addEventListener('click', closeSupport);
document.getElementById('routineClose')?.addEventListener('click', closeSupport);
document.getElementById('gamesClose')?.addEventListener('click', closeSupport);

function initPicturePhrases() {
  if (!picGrid) return;
  picGrid.innerHTML = '';
  PICTURE_PHRASES.forEach((p) => {
    const btn = document.createElement('button');
    btn.className = 'pic-card';
    btn.innerHTML = `<div class="pic-emoji">${p.emoji}</div><div class="pic-text">${p.text}</div>`;
    btn.addEventListener('click', () => {
      speakKorean(p.text);
      logPrivacyActivity('picture_phrase', { text: p.text });
      btn.classList.add('pic-active');
      setTimeout(() => btn.classList.remove('pic-active'), 400);
    });
    picGrid.appendChild(btn);
  });
}

/* 감정 상태 선택 그리드 (행동 조절 도구) */
function initRegStateGrid() {
  if (!regStateGrid) return;
  regStateGrid.innerHTML = '';
  REG_STATE_PRESETS.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'reg-state-btn';
    btn.innerHTML = `<div class="reg-state-emoji">${s.emoji}</div><div class="reg-state-label">${s.label}</div>`;
    btn.addEventListener('click', () => {
      regStatus.textContent = `지금 ${s.label}`;
      logRegulationEvent(`상태 기록: ${s.label}`);
    });
    regStateGrid.appendChild(btn);
  });
}

/* 호흡/그라운딩/감각 팁 버튼 */
document.querySelectorAll('[data-breath]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const seconds = parseInt(btn.getAttribute('data-breath'), 10) || 4;
    runBreathingRoutine(seconds);
  });
});
function runBreathingRoutine(seconds) {
  const guide = document.getElementById('breathGuide');
  if (!guide) return;
  logRegulationEvent(`호흡 루틴 (${seconds}초)`);
  let phase = 0;
  const phases = ['들이쉬기', '멈추기', '내쉬기'];
  guide.style.display = '';
  let count = 0;
  const total = 3;
  const step = () => {
    if (count >= total) { guide.textContent = '수고했어요 🌿'; setTimeout(() => { guide.style.display = 'none'; }, 1500); return; }
    guide.textContent = phases[phase % phases.length];
    phase++;
    if (phase % phases.length === 0) count++;
    setTimeout(step, seconds * 1000);
  };
  step();
}

document.querySelectorAll('[data-ground]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tip = btn.getAttribute('data-ground');
    speakKorean(tip);
    logRegulationEvent('그라운딩 팁 사용');
  });
});
document.querySelectorAll('[data-sensory]').forEach((btn) => {
  btn.addEventListener('click', () => {
    logRegulationEvent(`감각 도구: ${btn.textContent.trim()}`);
  });
});

document.getElementById('regReportBtn')?.addEventListener('click', () => {
  renderRegulationLog();
});
document.getElementById('regResetBtn')?.addEventListener('click', () => {
  regulationState.log = [];
  saveRegulationLog();
  renderRegulationLog();
});

/* 루틴 관리 */
let routines = [];
function loadRoutines() {
  try {
    const raw = localStorage.getItem('chunjik.routines');
    routines = raw ? JSON.parse(raw) : [];
  } catch (e) { routines = []; }
}
function saveRoutines() {
  try { localStorage.setItem('chunjik.routines', JSON.stringify(routines)); } catch (e) {}
}
function renderRoutines() {
  if (!routineListEl) return;
  if (!routines.length) {
    routineListEl.innerHTML = '<p class="muted">아직 등록된 루틴이 없어요.</p>';
    return;
  }
  routineListEl.innerHTML = routines.map((r, idx) => `
    <div class="routine-item ${r.done ? 'done' : ''}" data-idx="${idx}">
      <button class="routine-check" data-check="${idx}">${r.done ? '✅' : '⬜'}</button>
      <span class="routine-text">${escapeHtml(r.text)}</span>
      <button class="routine-del" data-del="${idx}">✕</button>
    </div>
  `).join('');
  routineListEl.querySelectorAll('[data-check]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-check'), 10);
      routines[idx].done = !routines[idx].done;
      saveRoutines();
      renderRoutines();
      coachRoutineProgress();
    });
  });
  routineListEl.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-del'), 10);
      routines.splice(idx, 1);
      saveRoutines();
      renderRoutines();
    });
  });
}
function addRoutine(text) {
  if (!text.trim()) return;
  routines.push({ text: text.trim(), done: false });
  saveRoutines();
  renderRoutines();
}
routineAddBtn?.addEventListener('click', () => {
  addRoutine(routineInput.value);
  routineInput.value = '';
});
routineInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { addRoutine(routineInput.value); routineInput.value = ''; }
});
function coachRoutineProgress() {
  const total = routines.length;
  const done = routines.filter((r) => r.done).length;
  if (total > 0 && done === total) {
    speakKorean('오늘 루틴을 모두 완료했어요! 정말 잘했어요.');
  }
}

soundToggleBtn?.addEventListener('click', () => {
  gameSoundOn = !gameSoundOn;
  soundToggleBtn.textContent = gameSoundOn ? '🔊' : '🔇';
});
function gameSpeak(text) {
  if (gameSoundOn) speakKorean(text);
}
