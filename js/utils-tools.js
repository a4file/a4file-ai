/* 스카이 계산 도구. 숫자는 프로그램이 내고, 긴급은 번호만 안내한다. */
const PYEONG_M2 = 3.305785;
const UTILS_PANELS = ['area', 'loan', 'dday', 'fx', 'air', 'timer', 'emergency'];

let utilsTimerId = null;
let utilsTimerEnd = 0;

function detectUtilsIntent(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  if (/(계산\s*도구|계산기|유틸리티|평수\s*계산|대출\s*계산|단위\s*변환)/.test(t)) return 'utils';
  if (/(평수|몇\s*평|평\s*은|평을|평이|\d+(\.\d+)?\s*평|제곱미터|제곱\s*미터|㎡|m²|\bm2\b)/i.test(t)) return 'area';
  if (/(대출|원리금|월상환|주택담보|이자율|금리)/.test(t)) return 'loan';
  if (/(디데이|d-?day|며칠\s*남|남은\s*날|기념일)/i.test(t)) return 'dday';
  if (/(환율|환전|달러|엔화|\d+\s*엔|유로|위안|파운드|\busd\b|\bjpy\b|\beur\b)/i.test(t)) return 'fx';
  if (/(미세먼지|초미세|대기질|황사|공기질|pm2\.?5)/i.test(t)) return 'air';
  if (/(타이머|알람\s*맞춰|분\s*타이머|초\s*타이머|카운트다운)/.test(t)) return 'timer';
  if (/(긴급\s*번호|응급\s*전화|신고\s*번호|청소년\s*상담|1388|1393)/.test(t)) return 'emergency';
  if (/(112|119)/.test(t) && /(번호|전화|신고|응급|경찰|소방|구급)/.test(t)) return 'emergency';
  return null;
}

function openUtils(panel) {
  const overlay = document.getElementById('utilsOverlay');
  showOnlyOverlay(overlay);
  selectUtilPanel(panel && UTILS_PANELS.includes(panel) ? panel : 'area');
}

function closeUtils() {
  document.getElementById('utilsOverlay')?.classList.remove('show');
}

function selectUtilPanel(panel) {
  document.querySelectorAll('.util-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.util === panel);
  });
  document.querySelectorAll('.util-panel').forEach((el) => {
    el.hidden = el.dataset.util !== panel;
  });
}

function fmtNum(n, digits) {
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString('ko-KR', {
    maximumFractionDigits: digits == null ? 2 : digits,
    minimumFractionDigits: 0,
  });
}

function parseKoreanMoney(s) {
  const t = String(s || '').replace(/,/g, '');
  let n = 0;
  let hit = false;
  const eok = t.match(/([\d.]+)\s*억/);
  const man = t.match(/([\d.]+)\s*만/);
  if (eok) {
    n += parseFloat(eok[1]) * 1e8;
    hit = true;
  }
  if (man) {
    n += parseFloat(man[1]) * 1e4;
    hit = true;
  }
  if (hit) return n;
  const raw = t.match(/(\d+(?:\.\d+)?)/);
  return raw ? parseFloat(raw[1]) : NaN;
}

function loanPayment(principal, years, annualPct) {
  const p = Number(principal);
  const n = Math.round(Number(years) * 12);
  const r = Number(annualPct) / 100 / 12;
  if (!(p > 0) || !(n > 0) || !(annualPct >= 0)) return null;
  let monthly;
  if (r === 0) monthly = p / n;
  else monthly = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = monthly * n;
  return { monthly, total, interest: total - p, months: n };
}

function parseDateHint(raw) {
  const t = String(raw || '');
  const iso = t.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, '0')}-${String(iso[3]).padStart(2, '0')}`;
  const md = t.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const slash = t.match(/(?:^|[^\d])(\d{1,2})\/(\d{1,2})(?:[^\d]|$)/);
  const now = new Date();
  let month;
  let day;
  if (md) {
    month = Number(md[1]);
    day = Number(md[2]);
  } else if (slash) {
    month = Number(slash[1]);
    day = Number(slash[2]);
  } else {
    return '';
  }
  let year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate < today) year += 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysUntil(dateStr) {
  const t = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(t.getTime())) return null;
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return Math.round((t - n) / 86400000);
}

function ddayLabel(days) {
  if (days == null) return '날짜를 확인해 주세요.';
  if (days === 0) return '오늘이에요. D-Day.';
  if (days > 0) return `${days}일 남았어요. D-${days}.`;
  return `${-days}일 지났어요. D+${-days}.`;
}

function guessFx(raw) {
  const t = String(raw || '').toLowerCase();
  const amountMatch = t.match(/([\d.]+)\s*(달러|불|엔|유로|위안|파운드|원|usd|jpy|eur|cny|gbp|krw|\$)/i)
    || t.match(/(?:\$|usd)\s*([\d.]+)/i);
  let amount = 1;
  if (amountMatch) amount = parseFloat(amountMatch[1]);
  let src = 'USD';
  let dst = 'KRW';
  if (/(엔화|\bjpy\b|엔)/i.test(t)) src = 'JPY';
  else if (/(유로|\beur\b)/i.test(t)) src = 'EUR';
  else if (/(위안|\bcny\b)/i.test(t)) src = 'CNY';
  else if (/(파운드|\bgbp\b)/i.test(t)) src = 'GBP';
  else if (/(달러|불|\busd\b|\$)/i.test(t)) src = 'USD';
  if (/(달러|엔|유로|위안|파운드).*(로|으로)/.test(t) && /원/.test(t) === false) {
    dst = src;
    src = 'KRW';
  }
  return { amount, from: src, to: dst };
}

function extractAirPlace(raw) {
  return String(raw || '')
    .replace(/(오늘|지금|현재|미세먼지|초미세|대기질|황사|공기질|pm2\.?5|어때|알려|보여|해줘)/gi, ' ')
    .replace(/[?？!！.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTimerSeconds(raw) {
  const t = String(raw || '');
  const ms = t.match(/(\d+)\s*분\s*(\d+)\s*초/);
  if (ms) return Number(ms[1]) * 60 + Number(ms[2]);
  const m = t.match(/(\d+)\s*분/);
  if (m) return Number(m[1]) * 60;
  const s = t.match(/(\d+)\s*초/);
  if (s) return Number(s[1]);
  const colon = t.match(/(\d+):(\d{1,2})/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  return 0;
}

function renderArea() {
  const pyeong = Number(document.getElementById('utilPyeong')?.value);
  const m2in = Number(document.getElementById('utilM2')?.value);
  const out = document.getElementById('utilAreaOut');
  if (!out) return '';
  if (Number.isFinite(pyeong) && document.activeElement?.id === 'utilPyeong') {
    const m2 = pyeong * PYEONG_M2;
    document.getElementById('utilM2').value = m2.toFixed(2);
    const msg = `${fmtNum(pyeong, 2)}평 = ${fmtNum(m2, 2)}㎡`;
    out.textContent = msg;
    return msg;
  }
  if (Number.isFinite(m2in) && document.activeElement?.id === 'utilM2') {
    const p = m2in / PYEONG_M2;
    document.getElementById('utilPyeong').value = p.toFixed(2);
    const msg = `${fmtNum(m2in, 2)}㎡ = ${fmtNum(p, 2)}평`;
    out.textContent = msg;
    return msg;
  }
  if (Number.isFinite(pyeong)) {
    const m2 = pyeong * PYEONG_M2;
    const msg = `${fmtNum(pyeong, 2)}평 = ${fmtNum(m2, 2)}㎡`;
    out.textContent = msg;
    return msg;
  }
  out.textContent = '숫자를 넣으면 바로 바꿔 줘요. 1평 = 3.3058㎡';
  return '';
}

function renderLoan() {
  const principal = parseKoreanMoney(document.getElementById('utilLoanP')?.value);
  const years = Number(document.getElementById('utilLoanY')?.value);
  const rate = Number(document.getElementById('utilLoanR')?.value);
  const out = document.getElementById('utilLoanOut');
  const result = loanPayment(principal, years, rate);
  if (!out) return '';
  if (!result) {
    out.textContent = '금액, 기간, 금리를 넣으면 월 원리금을 계산해요. 참고용이에요.';
    return '';
  }
  const msg = `매달 ${fmtNum(Math.round(result.monthly), 0)}원 · 총 ${fmtNum(Math.round(result.total), 0)}원 (이자 ${fmtNum(Math.round(result.interest), 0)}원, ${result.months}개월)`;
  out.textContent = msg;
  return msg;
}

function renderDday() {
  const dateStr = document.getElementById('utilDday')?.value;
  const out = document.getElementById('utilDdayOut');
  const msg = ddayLabel(daysUntil(dateStr));
  if (out) out.textContent = msg;
  return msg;
}

async function runFx(preset) {
  const fromEl = document.getElementById('utilFxFrom');
  const toEl = document.getElementById('utilFxTo');
  const amtEl = document.getElementById('utilFxAmt');
  if (preset) {
    if (fromEl) fromEl.value = preset.from;
    if (toEl) toEl.value = preset.to;
    if (amtEl) amtEl.value = preset.amount;
  }
  const from = (fromEl?.value || 'USD').toUpperCase();
  const to = (toEl?.value || 'KRW').toUpperCase();
  const amount = Number(amtEl?.value || 1);
  const out = document.getElementById('utilFxOut');
  if (out) out.textContent = '환율을 가져오는 중…';
  try {
    const res = await fetch(`/api/fx?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
    const msg = `${fmtNum(data.amount, 2)} ${data.from} = ${fmtNum(data.value, 2)} ${data.to} (${data.date || ''})`;
    if (out) out.textContent = msg;
    return msg;
  } catch (_) {
    const fail = typeof t === 'function' ? t('utils.fxFail') : '환율을 못 가져왔어요.';
    if (out) out.textContent = fail;
    return '';
  }
}

async function runAir(place) {
  const q = (place || document.getElementById('utilAirQ')?.value || '').trim();
  const input = document.getElementById('utilAirQ');
  if (input && q) input.value = q;
  const out = document.getElementById('utilAirOut');
  if (out) out.textContent = '대기질을 가져오는 중…';
  try {
    const url = q ? `/api/air?q=${encodeURIComponent(q)}` : '/api/air';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
    const name = String(data.place?.name || q || '여기').split(',')[0];
    const msg = `${name} 대기질 ${data.label || '-'} · 초미세(PM2.5) ${data.pm25 ?? '-'} · 미세(PM10) ${data.pm10 ?? '-'}`;
    if (out) out.textContent = msg;
    return msg;
  } catch (_) {
    const fail = typeof t === 'function' ? t('utils.airFail') : '대기질을 못 가져왔어요.';
    if (out) out.textContent = fail;
    return '';
  }
}

function tickTimer() {
  const left = Math.max(0, Math.ceil((utilsTimerEnd - Date.now()) / 1000));
  const out = document.getElementById('utilTimerOut');
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  if (out) out.textContent = `${mm}:${ss}`;
  if (left <= 0) {
    clearInterval(utilsTimerId);
    utilsTimerId = null;
    if (out) out.textContent = '끝!';
    try { beepTimer(); } catch (_) {}
    if (typeof addMessage === 'function') addMessage('타이머가 끝났어요.', 'bot');
  }
}

function beepTimer() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  [0, 180, 360].forEach((delay) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    const t0 = ctx.currentTime + delay / 1000;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.start(t0);
    o.stop(t0 + 0.2);
  });
}

function startUtilsTimer(seconds) {
  const sec = Math.min(99 * 60, Math.max(1, Number(seconds) || 0));
  if (!sec) return '';
  clearInterval(utilsTimerId);
  utilsTimerEnd = Date.now() + sec * 1000;
  tickTimer();
  utilsTimerId = setInterval(tickTimer, 250);
  const mins = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest ? `${mins}분 ${rest}초 타이머를 시작했어요.` : `${mins}분 타이머를 시작했어요.`;
}

function stopUtilsTimer() {
  clearInterval(utilsTimerId);
  utilsTimerId = null;
  const out = document.getElementById('utilTimerOut');
  if (out) out.textContent = '멈춤';
}

async function handleUtilsIntent(mode, userText) {
  const panel = mode === 'utils' ? 'area' : mode;
  openUtils(panel);
  let msg = '';
  if (mode === 'area') {
    const pyeong = userText.match(/([\d.]+)\s*평/);
    const m2 = userText.match(/([\d.]+)\s*(㎡|m²|m2|제곱)/i);
    if (pyeong) {
      const el = document.getElementById('utilPyeong');
      if (el) {
        el.value = pyeong[1];
        el.focus();
      }
      msg = renderArea();
    } else if (m2) {
      const el = document.getElementById('utilM2');
      if (el) {
        el.value = m2[1];
        el.focus();
      }
      msg = renderArea();
    } else {
      msg = '평이나 제곱미터를 말해 주세요. 예: 「32평은 몇 제곱」.';
    }
  } else if (mode === 'loan') {
    const years = userText.match(/([\d.]+)\s*년/);
    const rate = userText.match(/([\d.]+)\s*%/) || userText.match(/금리\s*([\d.]+)/);
    const principal = parseKoreanMoney(userText);
    if (years) document.getElementById('utilLoanY').value = years[1];
    if (rate) document.getElementById('utilLoanR').value = rate[1];
    if (Number.isFinite(principal) && principal >= 1000) document.getElementById('utilLoanP').value = String(Math.round(principal));
    msg = renderLoan() || '금액·기간·금리를 넣으면 월 원리금을 계산해요. 예: 「3억 30년 4.5%」.';
  } else if (mode === 'dday') {
    const dateStr = parseDateHint(userText);
    if (dateStr) {
      document.getElementById('utilDday').value = dateStr;
      msg = renderDday();
    } else {
      msg = '날짜를 말해 주세요. 예: 「8월 31일 디데이」.';
    }
  } else if (mode === 'fx') {
    msg = await runFx(guessFx(userText));
  } else if (mode === 'air') {
    msg = await runAir(extractAirPlace(userText));
  } else if (mode === 'timer') {
    const sec = parseTimerSeconds(userText) || Number(document.getElementById('utilTimerMin')?.value) * 60;
    if (sec) {
      document.getElementById('utilTimerMin').value = String(Math.max(1, Math.round(sec / 60)));
      msg = startUtilsTimer(sec);
    } else {
      msg = '몇 분인지 말해 주세요. 예: 「5분 타이머」.';
    }
  } else if (mode === 'emergency') {
    msg = '급하면 스카이보다 112가 먼저예요. 소방·응급은 119, 청소년 상담은 1388.';
  } else {
    msg = '평수, 대출, 디데이, 환율, 대기질, 타이머, 긴급번호를 여기서 쓸 수 있어요.';
  }
  if (msg && typeof addMessage === 'function') addMessage(msg, 'bot');
}

document.getElementById('utilsClose')?.addEventListener('click', closeUtils);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && utilsOverlay?.classList.contains('show')) closeUtils();
});
document.querySelectorAll('.util-tab').forEach((btn) => {
  btn.addEventListener('click', () => selectUtilPanel(btn.dataset.util));
});
['utilPyeong', 'utilM2'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', renderArea);
});
['utilLoanP', 'utilLoanY', 'utilLoanR'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', renderLoan);
});
document.getElementById('utilDday')?.addEventListener('change', renderDday);
document.getElementById('utilFxGo')?.addEventListener('click', () => runFx());
document.getElementById('utilAirGo')?.addEventListener('click', () => runAir());
document.getElementById('utilTimerStart')?.addEventListener('click', () => {
  const min = Number(document.getElementById('utilTimerMin')?.value || 5);
  startUtilsTimer(min * 60);
});
document.getElementById('utilTimerStop')?.addEventListener('click', stopUtilsTimer);
document.getElementById('utilAirQ')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    runAir();
  }
});
