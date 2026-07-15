/* ============================================================
   🔮 타로 기능 (tarotapi.dev)
============================================================ */
const TAROT_API = configuredProxyBase
  ? `${configuredProxyBase}/tarot/random`
  : 'https://tarotapi.dev/api/v1/cards/random';
const TAROT_PROXY_API = configuredProxyBase ? `${configuredProxyBase}/tarot/random` : '/tarot/random';

/* 카드별 이모지 매핑 (시각적 표현용) */
const TAROT_ICONS = {
  // 메이저 아르카나
  'ar01': '🤡', 'ar02': '🧙', 'ar03': '👸', 'ar04': '👑',
  'ar05': '🤴', 'ar06': '⛪', 'ar07': '💑', 'ar08': '🏇',
  'ar09': '💪', 'ar10': '🏮', 'ar11': '☸️', 'ar12': '⚖️',
  'ar13': '🙃', 'ar14': '💀', 'ar15': '🧘', 'ar16': '😈',
  'ar17': '⚡', 'ar18': '⭐', 'ar19': '🌙', 'ar20': '☀️',
  'ar21': '📯', 'ar22': '🌍',
  // 수트별 기본 아이콘
  wands: '🔥', cups: '💧', swords: '⚔️', pentacles: '🪙'
};
function cardIcon(card) {
  if (TAROT_ICONS[card.name_short]) return TAROT_ICONS[card.name_short];
  return TAROT_ICONS[card.suit] || '🃏';
}

/** 카드 이미지 파일 규칙
 * - 메이저: 00-TheFool.jpg, 01-TheMagician.jpg ...
 * - 마이너: Cups01.jpg, Wands12.jpg ...
 */
const TAROT_JPG_DIR = 'JPG';
const TAROT_MAJOR_FILE_BY_NAME = {
  thefool: '00-TheFool',
  themagician: '01-TheMagician',
  thehighpriestess: '02-TheHighPriestess',
  theempress: '03-TheEmpress',
  theemperor: '04-TheEmperor',
  thehierophant: '05-TheHierophant',
  thelovers: '06-TheLovers',
  thechariot: '07-TheChariot',
  strength: '08-Strength',
  thehermit: '09-TheHermit',
  wheeloffortune: '10-WheelOfFortune',
  justice: '11-Justice',
  thehangedman: '12-TheHangedMan',
  death: '13-Death',
  temperance: '14-Temperance',
  thedevil: '15-TheDevil',
  thetower: '16-TheTower',
  thestar: '17-TheStar',
  themoon: '18-TheMoon',
  thesun: '19-TheSun',
  judgement: '20-Judgement',
  judgment: '20-Judgement',
  theworld: '21-TheWorld',
};
const TAROT_MINOR_SUIT_FILE = {
  cups: 'Cups',
  wands: 'Wands',
  swords: 'Swords',
  pentacles: 'Pentacles',
};
const TAROT_MINOR_VALUE_FILE = {
  ace: '01', two: '02', three: '03', four: '04', five: '05', six: '06', seven: '07',
  eight: '08', nine: '09', ten: '10', page: '11', knight: '12', queen: '13', king: '14'
};

function getTarotImageFileBase(card) {
  if (!card) return '';
  const type = String(card.type || '').toLowerCase();
  if (type === 'major') {
    const key = String(card.name || '').toLowerCase().replace(/[^a-z]/g, '');
    return TAROT_MAJOR_FILE_BY_NAME[key] || '';
  }
  const suit = TAROT_MINOR_SUIT_FILE[String(card.suit || '').toLowerCase()];
  if (!suit) return '';
  let num = TAROT_MINOR_VALUE_FILE[String(card.value || '').toLowerCase()];
  if (!num && Number.isFinite(Number(card.value_int))) {
    const n = Math.max(1, Math.min(14, Number(card.value_int)));
    num = String(n).padStart(2, '0');
  }
  if (!num) return '';
  return `${suit}${num}`;
}

function loadTarotImageWithFallback(imgEl, card, onMissing) {
  const base = getTarotImageFileBase(card);
  if (!base) {
    if (typeof onMissing === 'function') onMissing();
    return;
  }
  const src = `${TAROT_JPG_DIR}/${base}.jpg`;
  imgEl.onerror = () => {
    imgEl.onerror = null; // 404 콜백 1회만
    if (typeof onMissing === 'function') onMissing();
  };
  imgEl.src = src;
}

function bindTarotCardJpg(imgEl, wrapEl, card) {
  loadTarotImageWithFallback(imgEl, card, () => {
    if (wrapEl) wrapEl.classList.add('tcard-art-wrap--missing');
  });
}

function closeTcardLightbox() {
  const lb = document.getElementById('tcardLightbox');
  if (!lb) return;
  lb.classList.remove('show');
  lb.hidden = true;
  const img = document.getElementById('tcardLightboxImg');
  if (img) {
    img.onload = null;
    img.onerror = null;
    img.removeAttribute('src');
    img.classList.remove('is-hidden');
  }
}

function openTcardLightbox(card) {
  const lb = document.getElementById('tcardLightbox');
  const img = document.getElementById('tcardLightboxImg');
  const cap = document.getElementById('tcardLightboxCap');
  if (!lb || !img || !cap || !card) return;
  cap.textContent = `${card.name} (${card.reversed ? '역방향' : '정방향'})`;
  img.classList.remove('is-hidden');
  img.alt = card.name || '';
  loadTarotImageWithFallback(img, card, () => {
    img.classList.add('is-hidden');
  });
  lb.hidden = false;
  lb.classList.add('show');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 타로 본문: 줄바꿈 + 마크다운 `**강조**`만 안전하게 렌더 */
function formatTarotReading(text) {
  let t = escapeHtml(text);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\n/g, '<br>');
  return t;
}

const tarotChipBtn = document.getElementById('tarotChip');
const tarotOverlay = document.getElementById('tarotOverlay');
const tarotClose = document.getElementById('tarotClose');
const tarotSubtitle = document.getElementById('tarotSubtitle');
const spreadPicker = document.getElementById('spreadPicker');
const tarotCardsEl = document.getElementById('tarotCards');
const tarotReading = document.getElementById('tarotReading');
const tarotReadingInner = document.getElementById('tarotReadingInner');
const tarotScroll = document.getElementById('tarotScroll');
const tarotActions = document.getElementById('tarotActions');
const tarotAgainBtn = document.getElementById('tarotAgainBtn');
const tarotDoneBtn = document.getElementById('tarotDoneBtn');
const tarotStars = document.getElementById('tarotStars');

/* 반짝이 별 배경 생성 */
(function seedStars() {
  let html = '';
  for (let i = 0; i < 30; i++) {
    const top = Math.random() * 100, left = Math.random() * 100;
    const delay = (Math.random() * 3).toFixed(2);
    const size = Math.random() < 0.7 ? 10 : 14;
    html += `<span class="tstar" style="top:${top}%;left:${left}%;font-size:${size}px;animation-delay:${delay}s;">✦</span>`;
  }
  tarotStars.innerHTML = html;
})();

tarotChipBtn?.addEventListener('click', openTarot);
tarotClose?.addEventListener('click', closeTarot);
tarotDoneBtn?.addEventListener('click', closeTarot);
tarotAgainBtn?.addEventListener('click', () => {
  if (loadTarotDaily()) {
    showStatus('오늘 타로는 이미 봤어요. 내일 다시 열 수 있어요.', 2800);
    return;
  }
  resetTarot();
});

(function initTcardLightbox() {
  const bd = document.getElementById('tcardLightboxBackdrop');
  const x = document.getElementById('tcardLightboxClose');
  bd?.addEventListener('click', closeTcardLightbox);
  x?.addEventListener('click', closeTcardLightbox);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const lb = document.getElementById('tcardLightbox');
    if (lb && lb.classList.contains('show') && !lb.hidden) closeTcardLightbox();
  });
})();

function openTarot() {
  socialOverlay?.classList.remove('show');
  socialState.active = false;
  setSocialCoachLottieState('');
  closeSupport();
  closeAbout();
  if (characterAnimationDataCache && !tarotCoachLottieInstance) {
    initTarotCoachLottie(characterAnimationDataCache);
  }
  resetTarot();
  const daily = loadTarotDaily();
  if (daily) restoreTarotFromDaily(daily);
  else updateTarotDailyUi(false);
  tarotOverlay.classList.add('show');
}
function closeTarot() {
  closeTcardLightbox();
  tarotOverlay.classList.remove('show');
}
function resetTarot() {
  closeTcardLightbox();
  spreadPicker.style.display = 'flex';
  tarotCardsEl.style.display = 'none';
  tarotCardsEl.innerHTML = '';
  tarotReading.style.display = 'none';
  if (tarotReadingInner) tarotReadingInner.innerHTML = '';
  tarotActions.style.display = 'none';
  if (tarotScroll) tarotScroll.scrollTop = 0;
  const daily = loadTarotDaily();
  tarotSubtitle.textContent = daily
    ? '오늘의 타로를 이미 봤어요. 아래에서 다시 확인할 수 있어요.'
    : '오늘 당신의 우주가 전하는 메시지를 받아볼까요?';
}

function loadTarotDaily() {
  try {
    const raw = JSON.parse(localStorage.getItem(TAROT_DAILY_STORAGE_KEY) || 'null');
    if (!raw || raw.date !== getTodayKey()) return null;
    return raw;
  } catch {
    return null;
  }
}

function saveTarotDaily(payload) {
  localStorage.setItem(TAROT_DAILY_STORAGE_KEY, JSON.stringify({ ...payload, date: getTodayKey() }));
  logPrivacyActivity('tarot_reading', payload.spreadLabel || 'tarot');
}

function loadSocialFeedbackDaily() {
  try {
    const raw = JSON.parse(localStorage.getItem(SOCIAL_FEEDBACK_DAILY_STORAGE_KEY) || 'null');
    if (!raw || raw.date !== getTodayKey()) return null;
    return raw;
  } catch {
    return null;
  }
}

function saveSocialFeedbackDaily(html, scenarioTitle) {
  localStorage.setItem(SOCIAL_FEEDBACK_DAILY_STORAGE_KEY, JSON.stringify({
    date: getTodayKey(),
    html,
    scenarioTitle: scenarioTitle || '',
  }));
  logPrivacyActivity('social_feedback', scenarioTitle || 'social');
}

function updateTarotDailyUi(locked) {
  if (tarotAgainBtn) {
    tarotAgainBtn.disabled = !!locked;
    tarotAgainBtn.textContent = locked ? '내일 다시 뽑기' : '다시 뽑기';
    tarotAgainBtn.style.opacity = locked ? '0.55' : '';
  }
  spreadPicker?.querySelectorAll('.spread-btn').forEach((btn) => {
    btn.disabled = !!locked;
    btn.style.opacity = locked ? '0.5' : '';
    btn.style.pointerEvents = locked ? 'none' : '';
  });
}

function renderTarotCards(cards, positions, { startFlipped = false } = {}) {
  tarotCardsEl.style.display = 'flex';
  tarotCardsEl.innerHTML = '';
  cards.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'tcard' + (c.reversed ? ' reversed' : '') + (startFlipped ? ' flipped' : '');
    card.dataset.cardIndex = String(i);
    card.innerHTML = `
      <div class="tcard-face tcard-face-back">✦</div>
      <div class="tcard-face tcard-face-front">
        <div class="tcard-art-wrap">
          <img class="tcard-art" alt="${escapeHtml(c.name)}" loading="lazy" />
          <div class="tcard-fallback">
            <span class="tcard-icon">${cardIcon(c)}</span>
            <span class="tcard-name">${escapeHtml(c.name)}</span>
          </div>
        </div>
        <div class="tcard-meta">
          <span class="tcard-num">${escapeHtml((positions[i] || '').toUpperCase())}</span>
          <span class="tcard-name">${escapeHtml(c.name)}</span>
          <span class="tcard-orientation">${c.reversed ? '역방향' : '정방향'}</span>
        </div>
      </div>
    `;
    const img = card.querySelector('.tcard-art');
    const wrap = card.querySelector('.tcard-art-wrap');
    if (img && wrap) bindTarotCardJpg(img, wrap, c);
    tarotCardsEl.appendChild(card);
  });
  tarotCardsEl.querySelectorAll('.tcard').forEach((el) => {
    el.addEventListener('click', () => {
      if (!el.classList.contains('flipped')) {
        el.classList.add('flipped');
        return;
      }
      const idx = parseInt(el.dataset.cardIndex, 10);
      if (!Number.isNaN(idx) && cards[idx]) openTcardLightbox(cards[idx]);
    });
  });
}

function restoreTarotFromDaily(entry) {
  if (!entry) return;
  spreadPicker.style.display = 'none';
  tarotSubtitle.textContent = `✨ ${entry.spreadLabel} · 오늘의 리딩`;
  renderTarotCards(entry.cards, entry.positions, { startFlipped: true });
  tarotReading.style.display = 'block';
  if (tarotReadingInner) tarotReadingInner.innerHTML = formatTarotReading(entry.reading || '');
  tarotActions.style.display = 'flex';
  updateTarotDailyUi(true);
  if (tarotScroll) requestAnimationFrame(() => { tarotScroll.scrollTop = tarotScroll.scrollHeight; });
}

/* 스프레드 선택 → 카드 뽑기 */
spreadPicker.addEventListener('click', async (e) => {
  const btn = e.target.closest('.spread-btn');
  if (!btn || btn.disabled) return;
  const daily = loadTarotDaily();
  if (daily) {
    restoreTarotFromDaily(daily);
    return;
  }
  const n = parseInt(btn.dataset.n, 10);
  const label = btn.dataset.label;
  await drawCards(n, label);
});

async function drawCards(n, spreadLabel) {
  if (loadTarotDaily()) {
    restoreTarotFromDaily(loadTarotDaily());
    return;
  }
  spreadPicker.style.display = 'none';
  tarotSubtitle.textContent = `🌟 ${spreadLabel} — 카드를 우주에서 가져오는 중...`;
  tarotCardsEl.style.display = 'flex';
  tarotCardsEl.innerHTML = '';

  let cards = [];
  try {
    // 1차: 직접 호출
    const res = await fetch(`${TAROT_API}?n=${n}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API ' + res.status);
    const data = await res.json();
    cards = data.cards || [];
  } catch (e) {
    // 2차: 서버 프록시 경유 (CORS 대비)
    try {
      const res = await fetch(`${TAROT_PROXY_API}?n=${n}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Proxy ' + res.status);
      const data = await res.json();
      cards = data.cards || [];
    } catch (e2) {
      tarotSubtitle.textContent = '⚠️ 카드를 불러올 수 없어요. 네트워크 또는 프록시 URL(server.py/Cloudflare Worker)을 확인해주세요.';
      spreadPicker.style.display = 'flex';
      tarotCardsEl.style.display = 'none';
      return;
    }
  }

  if (!cards.length) {
    tarotSubtitle.textContent = '⚠️ 빈 응답이 왔어요.';
    spreadPicker.style.display = 'flex';
    tarotCardsEl.style.display = 'none';
    return;
  }

  // 30% 확률로 각 카드 역방향 설정 (더 재미있게)
  cards = cards.map(c => ({ ...c, reversed: Math.random() < 0.3 }));

  // 포지션 레이블 매핑
  const positions = getPositionLabels(spreadLabel, cards.length);
  renderTarotCards(cards, positions);

  tarotSubtitle.textContent = '🪄 카드를 눌러 뒤집은 뒤, 한 번 더 누르면 크게 볼 수 있어요';

  setTimeout(() => {
    tarotCardsEl.querySelectorAll('.tcard:not(.flipped)').forEach((el, idx) => {
      setTimeout(() => el.classList.add('flipped'), idx * 200);
    });
    setTimeout(() => interpretWithAI(cards, spreadLabel, positions), 400 + cards.length * 220);
  }, 2000);

  tarotActions.style.display = 'flex';
}

function getPositionLabels(spreadLabel, n) {
  if (spreadLabel.includes('과거')) return ['과거', '현재', '미래'];
  if (spreadLabel.includes('마음')) return ['마음', '상황', '조언'];
  if (spreadLabel.includes('다섯')) return ['현재', '과제', '과거', '미래', '결과'];
  return n === 1 ? ['오늘'] : Array.from({length:n}, (_,i) => `#${i+1}`);
}

/* GPT-5.4 mini로 스카이 리딩 요청 */
async function interpretWithAI(cards, spreadLabel, positions) {
  const daily = loadTarotDaily();
  if (daily) {
    tarotReading.style.display = 'block';
    if (tarotReadingInner) tarotReadingInner.innerHTML = formatTarotReading(daily.reading || '');
    tarotSubtitle.textContent = `✨ ${daily.spreadLabel} · 오늘의 리딩`;
    updateTarotDailyUi(true);
    return;
  }

  tarotReading.style.display = 'block';
  if (tarotReadingInner) tarotReadingInner.innerHTML = '';
  tarotSubtitle.textContent = `✨ ${spreadLabel}`;
  if (tarotScroll) requestAnimationFrame(() => { tarotScroll.scrollTop = tarotScroll.scrollHeight; });

  if (!ensureApiReady(false)) {
    const fallback = buildTarotKeywordFallback(cards, positions, '서버 연결이 필요해요.');
    if (tarotReadingInner) tarotReadingInner.innerHTML = formatTarotReading(fallback);
    saveTarotDaily({ spreadLabel, positions, cards, reading: fallback });
    updateTarotDailyUi(true);
    return;
  }

  // 카드 정보를 프롬프트로 포맷
  const cardInfo = cards.map((c, i) => {
    const pos = positions[i] || `카드 ${i+1}`;
    const orient = c.reversed ? '역방향' : '정방향';
    const meaning = c.reversed ? c.meaning_rev : c.meaning_up;
    return `[${pos}] ${c.name} (${orient})\n  키워드: ${meaning || ''}`;
  }).join('\n\n');

  const prompt = `아래 타로 카드를 "${spreadLabel}" 스프레드로 해석해줘.\n\n${cardInfo}\n\n각 포지션 1문장, 마지막 종합 1문장. 반말, 이모지 금지.`;

  const body = {
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: '너는 타로 마스터 스카이야. 따뜻하고 긍정적으로 카드를 해석해. 해석 본문에는 이모지·이모티콘을 넣지 마. 답변을 두 번 출력하지 마. 종합 메시지 한 문장으로 끝내.' },
      { role: 'user', content: prompt }
    ],
    stream: true,
    max_completion_tokens: MAX_OUTPUT_TOKENS.tarot,
  };

  try {
    const res = await fetchApiWithRetry(API_URL, {
      method: 'POST',
      headers: buildApiHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(describeApiHttpError(res.status));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', raw = '';

    const applyTarotDeltaLine = (line) => {
      if (!line.startsWith('data: ')) return;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) return;
      let j;
      try { j = JSON.parse(data); } catch { return; }
      const d = j.choices?.[0]?.delta;
      if (!d) return;
      let piece = '';
      if (typeof d.content === 'string') piece = d.content;
      else if (Array.isArray(d.content)) {
        for (const p of d.content) {
          if (p && typeof p.text === 'string') piece += p.text;
        }
      }
      if (!piece) return;
      raw = appendStreamDelta(raw, piece);
      if (tarotReadingInner) {
        tarotReadingInner.innerHTML = formatTarotReading(raw);
        if (tarotScroll) requestAnimationFrame(() => { tarotScroll.scrollTop = tarotScroll.scrollHeight; });
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) applyTarotDeltaLine(line);
    }
    buf += decoder.decode();
    for (const line of buf.split('\n')) applyTarotDeltaLine(line);
    // 🛡️ 전체 해석이 중복되어 온 경우 제거
    const dedup = removeConsecutiveRepeat(raw);
    if (dedup !== raw) {
      raw = dedup;
      if (tarotReadingInner) tarotReadingInner.innerHTML = formatTarotReading(raw);
    }
    if (raw.trim()) {
      saveTarotDaily({ spreadLabel, positions, cards, reading: raw });
      updateTarotDailyUi(true);
    }
  } catch (err) {
    if (tarotReadingInner) {
      const fallback = buildTarotKeywordFallback(
        cards,
        positions,
        `해석 중 오류: ${err.message}\n\n카드만 참고해주세요.`
      );
      tarotReadingInner.innerHTML = formatTarotReading(fallback);
      saveTarotDaily({ spreadLabel, positions, cards, reading: fallback });
      updateTarotDailyUi(true);
    }
  }
}
