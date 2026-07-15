const PROXY_BASE_STORAGE_KEY = 'chunjik.proxyBase';
const CHAT_MODEL = 'gpt-5.4-mini';
const TAROT_DAILY_STORAGE_KEY = 'chunjik.tarotDaily';
const SOCIAL_FEEDBACK_DAILY_STORAGE_KEY = 'chunjik.socialFeedbackDaily';
const MAX_OUTPUT_TOKENS = {
  chat: 120,
  tarot: 320,
  socialReply: 140,
  socialFeedback: 400,
  coach: 72,
};
const MAX_SOCIAL_USER_TURNS = 8;

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const query = new URLSearchParams(location.search);
const queryProxyBase = query.get('proxyBase') || '';
if (queryProxyBase) localStorage.setItem(PROXY_BASE_STORAGE_KEY, queryProxyBase);
const savedProxyBase = localStorage.getItem(PROXY_BASE_STORAGE_KEY) || '';
const configuredProxyBase = String(window.CHUNJIK_PROXY_BASE || queryProxyBase || savedProxyBase || '').trim().replace(/\/+$/, '');
const isHttpContext = (location.protocol === 'http:' || location.protocol === 'https:') && location.host;
const HEALTH_URL = configuredProxyBase
  ? `${configuredProxyBase}/health`
  : (isHttpContext ? '/health' : null);
const API_URL = configuredProxyBase
  ? `${configuredProxyBase}/v1/chat/completions`
  : (isHttpContext ? '/v1/chat/completions' : null);
const TRANSCRIBE_URL = configuredProxyBase
  ? `${configuredProxyBase}/v1/audio/transcriptions`
  : (isHttpContext ? '/v1/audio/transcriptions' : null);
const PRIVACY_API_BASE = configuredProxyBase
  ? `${configuredProxyBase}/api/privacy`
  : (isHttpContext ? '/api/privacy' : null);
const SAMPLE_RATE = 24000;
let demoMode = false;

const USER_ID_STORAGE_KEY = 'chunjik.userId';
const PRIVACY_CONSENT_CACHE_KEY = 'chunjik.privacyConsentCache';
const GUARDIAN_TOKEN_STORAGE_KEY = 'chunjik.guardianToken';
const PRIVACY_CONSENT_VERSION = '1.0';
let privacyEnabled = false;
let privacyConsentAccepted = false;
let privacyConsentChecked = false;

function getOrCreateUserId() {
  let id = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() || `u-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(USER_ID_STORAGE_KEY, id);
  }
  return id;
}

function privacyUrl(path) {
  if (!PRIVACY_API_BASE) return null;
  return `${PRIVACY_API_BASE}${path}`;
}

async function privacyFetch(path, options = {}) {
  const url = privacyUrl(path);
  if (!url) throw new Error('서버를 통해 접속해야 개인정보 기능을 사용할 수 있어요.');
  const headers = { ...(options.headers || {}) };
  if (options.json) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem(GUARDIAN_TOKEN_STORAGE_KEY);
  if (token) headers['X-Guardian-Token'] = token;
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function initPrivacySystem() {
  if (!PRIVACY_API_BASE) return;
  try {
    const status = await privacyFetch('/status');
    privacyEnabled = !!status.enabled;
    if (!privacyEnabled) return;
    const userId = getOrCreateUserId();
    const consent = await privacyFetch(`/consent?user_id=${encodeURIComponent(userId)}`);
    privacyConsentAccepted = !!consent.accepted;
    privacyConsentChecked = true;
    localStorage.setItem(PRIVACY_CONSENT_CACHE_KEY, JSON.stringify({
      version: PRIVACY_CONSENT_VERSION,
      accepted: privacyConsentAccepted,
      checked_at: Date.now(),
    }));
    if (!privacyConsentAccepted && localStorage.getItem(PRIVACY_CONSENT_CACHE_KEY + '.prompted') !== '1') {
      showPrivacyConsentModal();
    }
    updatePrivacyPanel();
  } catch (_) {
    privacyEnabled = false;
  }
}

function showPrivacyConsentModal() {
  privacyConsentBackdrop?.classList.add('show');
  privacyConsentBackdrop?.setAttribute('aria-hidden', 'false');
}

function hidePrivacyConsentModal() {
  privacyConsentBackdrop?.classList.remove('show');
  privacyConsentBackdrop?.setAttribute('aria-hidden', 'true');
  localStorage.setItem(PRIVACY_CONSENT_CACHE_KEY + '.prompted', '1');
}

async function setPrivacyConsent(accepted) {
  const userId = getOrCreateUserId();
  await privacyFetch('/consent', {
    method: 'POST',
    json: { user_id: userId, accepted, version: PRIVACY_CONSENT_VERSION },
  });
  privacyConsentAccepted = accepted;
  privacyConsentChecked = true;
  localStorage.setItem(PRIVACY_CONSENT_CACHE_KEY, JSON.stringify({
    version: PRIVACY_CONSENT_VERSION,
    accepted,
    checked_at: Date.now(),
  }));
  updatePrivacyPanel();
}

async function persistPrivacyMessage(text, role, module = 'chat') {
  if (!privacyEnabled || !privacyConsentAccepted || !text) return;
  try {
    await privacyFetch('/messages', {
      method: 'POST',
      json: {
        user_id: getOrCreateUserId(),
        role,
        module,
        text: String(text).slice(0, 4000),
      },
    });
  } catch (_) {}
}

async function logPrivacyActivity(eventType, detail = '') {
  if (!privacyEnabled || !privacyConsentAccepted) return;
  try {
    await privacyFetch('/activity', {
      method: 'POST',
      json: {
        user_id: getOrCreateUserId(),
        event_type: eventType,
        detail: String(detail || '').slice(0, 1000),
      },
    });
  } catch (_) {}
}

function updatePrivacyPanel() {
  if (privacyUserIdLabel) privacyUserIdLabel.textContent = getOrCreateUserId();
  if (!privacyConsentStatus) return;
  if (!privacyEnabled) {
    privacyConsentStatus.textContent = '서버 개인정보 저장 기능이 비활성화되어 있어요.';
    return;
  }
  privacyConsentStatus.textContent = privacyConsentAccepted
    ? `동의함 (버전 ${PRIVACY_CONSENT_VERSION})`
    : '동의하지 않음 — 서버 저장 없이 이용 중';
}

function openPrivacySettings() {
  closeTarot();
  closeSocial();
  closeSupport();
  closeAbout();
  closeGuardian();
  updatePrivacyPanel();
  privacyOverlay?.classList.add('show');
}

function closePrivacySettings() {
  privacyOverlay?.classList.remove('show');
}

function openGuardianDashboard() {
  closeTarot();
  closeSocial();
  closeSupport();
  closeAbout();
  closePrivacySettings();
  const token = localStorage.getItem(GUARDIAN_TOKEN_STORAGE_KEY);
  if (token) {
    guardianLoginPanel.hidden = true;
    guardianDashboardPanel.hidden = false;
    loadGuardianUsers();
  } else {
    guardianLoginPanel.hidden = false;
    guardianDashboardPanel.hidden = true;
  }
  guardianOverlay?.classList.add('show');
}

function closeGuardian() {
  guardianOverlay?.classList.remove('show');
}

async function exportPrivacyData() {
  const payload = await privacyFetch(`/export?user_id=${encodeURIComponent(getOrCreateUserId())}`);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sky-export-${getOrCreateUserId()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showStatus('데이터보내기 파일을 저장했어요.', 2600);
}

async function deletePrivacyData() {
  if (!confirm('서버에 저장된 대화·활동 기록을 모두 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return;
  await privacyFetch(`/data?user_id=${encodeURIComponent(getOrCreateUserId())}`, { method: 'DELETE' });
  privacyConsentAccepted = false;
  localStorage.removeItem(PRIVACY_CONSENT_CACHE_KEY);
  updatePrivacyPanel();
  showStatus('서버 데이터를 삭제했어요.', 2600);
}

async function guardianLogin() {
  const pin = guardianPinInput?.value || '';
  const data = await privacyFetch('/guardian/login', { method: 'POST', json: { pin } });
  localStorage.setItem(GUARDIAN_TOKEN_STORAGE_KEY, data.token);
  guardianLoginPanel.hidden = true;
  guardianDashboardPanel.hidden = false;
  if (guardianPinInput) guardianPinInput.value = '';
  await loadGuardianUsers();
}

async function guardianLogout() {
  try {
    await privacyFetch('/guardian/logout', { method: 'POST' });
  } catch (_) {}
  localStorage.removeItem(GUARDIAN_TOKEN_STORAGE_KEY);
  guardianLoginPanel.hidden = false;
  guardianDashboardPanel.hidden = true;
  if (guardianUserList) guardianUserList.innerHTML = '';
  if (guardianLog) guardianLog.innerHTML = '';
}

async function loadGuardianUsers() {
  const data = await privacyFetch('/guardian/users');
  if (!guardianUserList) return;
  guardianUserList.innerHTML = '';
  const users = data.users || [];
  if (!users.length) {
    guardianUserList.innerHTML = '<p class="privacy-card">저장된 이용자 기록이 없어요.</p>';
    return;
  }
  users.forEach((user) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'guardian-user-btn';
    btn.innerHTML = `<strong>${escapeHtml(user.user_id)}</strong><span>메시지 ${user.message_count}건 · 동의 ${user.consent_accepted ? 'O' : 'X'}</span>`;
    btn.addEventListener('click', () => loadGuardianDashboard(user.user_id));
    guardianUserList.appendChild(btn);
  });
}

async function loadGuardianDashboard(userId) {
  const data = await privacyFetch(`/guardian/dashboard?user_id=${encodeURIComponent(userId)}`);
  if (!guardianLog) return;
  guardianLog.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'privacy-card';
  title.innerHTML = `<h4>이용자 ${escapeHtml(userId)}</h4><p>동의: ${data.consent?.accepted ? '있음' : '없음'}</p>`;
  guardianLog.appendChild(title);

  (data.messages || []).slice(-30).forEach((msg) => {
    const item = document.createElement('div');
    item.className = 'guardian-log-item';
    item.innerHTML = `<div class="meta">${escapeHtml(msg.created_at)} · ${escapeHtml(msg.module)} · ${escapeHtml(msg.role)}</div>${escapeHtml(msg.text)}`;
    guardianLog.appendChild(item);
  });
  (data.activity || []).slice(-10).forEach((act) => {
    const item = document.createElement('div');
    item.className = 'guardian-log-item';
    item.innerHTML = `<div class="meta">${escapeHtml(act.created_at)} · ${escapeHtml(act.event_type)}</div>${escapeHtml(act.detail || '')}`;
    guardianLog.appendChild(item);
  });
}


function buildApiHeaders(json = true) {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (!demoMode) {
    const key = getApiKey();
    if (key) headers.Authorization = 'Bearer ' + key;
  }
  return headers;
}

function describeApiHttpError(status) {
  const code = Number(status);
  if (code === 429) return '요청이 너무 많아요(429). 잠시 후 다시 시도해주세요.';
  if (code === 503) return '서버 API 키가 설정되지 않았어요(503). Vercel 환경변수 OPENAI_API_KEY 확인 후 재배포해주세요.';
  if (code === 401 || code === 403) return `API 인증 오류(${code}). 키를 확인해주세요.`;
  if (code === 502) return 'AI 서버 연결 오류(502). 잠시 후 다시 시도해주세요.';
  return 'HTTP ' + code;
}

function buildTarotKeywordFallback(cards, positions, note = '') {
  const body = cards.map((c, i) => {
    const pos = positions[i] || `카드 ${i + 1}`;
    const orient = c.reversed ? '역방향' : '정방향';
    const meaning = c.reversed ? c.meaning_rev : c.meaning_up;
    return `[${pos}] ${c.name} (${orient})\n→ ${meaning || ''}`;
  }).join('\n\n');
  return note ? `${note}\n\n${body}` : body;
}

async function fetchApiWithRetry(url, options, { retries = 2, backoffMs = 2000 } = {}) {
  let lastRes = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    lastRes = res;
    if (res.status !== 429 || attempt === retries) return res;
    await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
  }
  return lastRes;
}

function ensureApiReady(showUi = true) {
  if (!API_URL) {
    if (showUi) alert('서버를 통해 접속해주세요. (index.html 직접 열기 불가)');
    return false;
  }
  if (demoMode) return true;
  const key = getApiKey();
  if (!key) {
    if (showUi) {
      alert('API Key를 입력해주세요 (우측 상단 API 키)');
      apiSetting?.classList.add('show');
      apiKeyInput?.focus();
    }
    return false;
  }
  return true;
}

function applyDemoUi() {
  apiKeyToggle?.classList.toggle('demo-hidden', demoMode);
  apiSetting?.classList.toggle('demo-hidden', demoMode);
  micBtn?.classList.toggle('demo-hidden', demoMode);
  if (demoMode) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    if (apiKeyInput) apiKeyInput.value = '';
    apiSetting?.classList.remove('show');
  }
}

async function initDemoMode() {
  if (!HEALTH_URL) return;
  try {
    const res = await fetch(HEALTH_URL);
    if (!res.ok) return;
    const data = await res.json();
    demoMode = !!data.demo_mode;
    applyDemoUi();
    if (demoMode && data.ready === false) {
      showStatus('시연 서버 API 키가 아직 설정되지 않았어요', 5000);
    }
  } catch (_) {}
}
