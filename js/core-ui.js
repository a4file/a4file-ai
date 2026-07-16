function getApiKey() {
  return apiKeyInput?.value?.trim() || '';
}

function saveApiKey() {
  const key = getApiKey();
  if (!key) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    showStatus('API 키를 입력해줘! 🔑', 1400);
    apiSetting.classList.add('show');
    apiKeyInput?.focus();
    return false;
  }
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
  showStatus('API 키 저장 완료 ✅', 1200);
  return true;
}

function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  if (apiKeyInput) apiKeyInput.value = '';
  showStatus('저장된 API 키 삭제됨', 1200);
  apiSetting.classList.add('show');
  apiKeyInput?.focus();
}

function initSocialCoachLottie(animationData) {
  const coachLottieEl = document.getElementById('socialCoachLottie');
  if (!window.lottie || !coachLottieEl || !animationData) return;
  try {
    if (socialCoachLottieInstance) {
      socialCoachLottieInstance.destroy();
      socialCoachLottieInstance = null;
    }
    socialCoachLottieInstance = lottie.loadAnimation({
      container: coachLottieEl,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    coachLottieEl.classList.add('active');
  } catch (e) {
    console.warn('사회성 코치 Lottie 로드 실패:', e);
  }
}

function initTarotCoachLottie(animationData) {
  const tarotLottieEl = document.getElementById('tarotCoachLottie');
  if (!window.lottie || !tarotLottieEl || !animationData) return;
  try {
    if (tarotCoachLottieInstance) {
      tarotCoachLottieInstance.destroy();
      tarotCoachLottieInstance = null;
    }
    tarotCoachLottieInstance = lottie.loadAnimation({
      container: tarotLottieEl,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    tarotLottieEl.classList.add('active');
  } catch (e) {
    console.warn('타로 코치 Lottie 로드 실패:', e);
  }
}

function initSupportCoachLotties(animationData) {
  if (!window.lottie || !animationData) return;
  const supportEls = [
    document.getElementById('pictureCoachLottie'),
    document.getElementById('regulationCoachLottie'),
    document.getElementById('routineCoachLottie'),
    document.getElementById('gamesCoachLottie'),
  ].filter(Boolean);

  supportCoachLottieInstances.forEach((inst) => {
    try { inst.destroy(); } catch (_) {}
  });
  supportCoachLottieInstances.length = 0;

  supportEls.forEach((el) => {
    try {
      const inst = lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData,
      });
      supportCoachLottieInstances.push(inst);
      el.classList.add('active');
    } catch (e) {
      console.warn('지원도구 코치 Lottie 로드 실패:', e);
    }
  });
}

function setSocialCoachLottieState(state) {
  if (!socialCoachLottieInstance) return;
  const speedMap = { listening: 1.3, speaking: 1.45, thinking: 0.85 };
  socialCoachLottieInstance.setSpeed(speedMap[state] ?? 1);
}

/* ============================================================
   Lottie 로드 — 1순위: window.CHARACTER_ANIMATION_DATA (character.js)
              2순위: fetch('./character.json') (http 경로일 때만 작동)
============================================================ */
(async function loadLottie() {
  if (!window.lottie) { console.warn('lottie 라이브러리 로드 실패'); return; }

  let animationData = window.CHARACTER_ANIMATION_DATA || null;

  if (!animationData) {
    try {
      const res = await fetch('./character.json', { cache: 'no-cache' });
      if (res.ok) animationData = await res.json();
    } catch (e) { /* file:// 프로토콜에선 실패해도 무시 */ }
  }

  if (!animationData) {
    console.log('ⓘ character 데이터 없음');
    return;
  }
  characterAnimationDataCache = animationData;

  try {
    lottieInstance = lottie.loadAnimation({
      container: avatarLottieEl,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    avatarLottieEl.classList.add('active');
    avatar = avatarLottieEl;
    initSocialCoachLottie(animationData);
    initTarotCoachLottie(animationData);
    initSupportCoachLotties(animationData);
    console.log('✓ Lottie 캐릭터 로드 완료');
  } catch (e) {
    console.error('Lottie 렌더 실패:', e);
  }
})();

/* 상태에 따라 Lottie 재생 속도 조절 (선택적) */
function syncLottieSpeed(state) {
  if (!lottieInstance) return;
  const speedMap = { listening: 1.3, speaking: 1.5, thinking: 0.8 };
  lottieInstance.setSpeed(speedMap[state] ?? 1);
}

/* API 키 패널 토글 (시연 모드에서는 숨김) */
{
  const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (savedApiKey && apiKeyInput) apiKeyInput.value = savedApiKey;
}
apiKeyToggle?.addEventListener('click', () => {
  apiSetting.classList.toggle('show');
  if (apiSetting.classList.contains('show')) apiKeyInput?.focus();
});
apiKeySaveBtn?.addEventListener('click', () => {
  if (saveApiKey()) apiSetting.classList.remove('show');
});
apiKeyClearBtn?.addEventListener('click', clearApiKey);
apiKeyInput?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (saveApiKey()) apiSetting.classList.remove('show');
});
apiKeyInput?.addEventListener('blur', () => {
  if (getApiKey()) localStorage.setItem(API_KEY_STORAGE_KEY, getApiKey());
});
refreshBtn.addEventListener('click', () => { chatBox.innerHTML = ''; showStatus(t('sky.newChat'), 2000); });

/* 상태 관리 */
let statusTimer = null;
function setState(state, msg, duration = 0) {
  avatar?.classList.remove('listening','speaking','thinking');
  if (state) avatar?.classList.add(state);
  syncLottieSpeed(state);
  if (msg !== undefined) showStatus(msg, duration);
}
function showStatus(msg, duration = 0) {
  statusChip.textContent = msg;
  statusChip.classList.add('show');
  if (statusTimer) clearTimeout(statusTimer);
  if (duration > 0) statusTimer = setTimeout(() => statusChip.classList.remove('show'), duration);
}
function hideStatus() { statusChip.classList.remove('show'); }

function closeFabPlusMenu() {
  fabPlusWrap?.classList.remove('menu-open');
  fabPlusBtn?.classList.remove('open');
  fabPlusBtn?.setAttribute('aria-expanded', 'false');
}
function toggleFabPlusMenu() {
  if (!fabPlusWrap || !fabPlusBtn) return;
  const open = fabPlusWrap.classList.toggle('menu-open');
  fabPlusBtn.classList.toggle('open', open);
  fabPlusBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

fabPlusBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleFabPlusMenu();
});
fabMenuHome?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  closeTarot();
  closeSocial();
  closeSupport();
  closeAbout();
  closePrivacySettings();
  closeGuardian();
  scrollStageSection?.('stage-home');
  showStatus('홈으로 돌아왔어!', 1600);
});
fabMenuAboutAi41?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openAbout('ai41');
});
fabMenuAboutSky?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openAbout('sky');
});
fabMenuTarot?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openTarot();
});
fabMenuSocial?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openSocial();
});
fabMenuPicture?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openSupportSection('picture');
});
fabMenuRegulation?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openSupportSection('regulation');
});
fabMenuRoutine?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openSupportSection('routine');
});
fabMenuGames?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openGameSection();
});
fabMenuPrivacy?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openPrivacySettings();
});
fabMenuGuardian?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeFabPlusMenu();
  openGuardianDashboard();
});
privacyAcceptBtn?.addEventListener('click', async () => {
  try {
    await setPrivacyConsent(true);
    hidePrivacyConsentModal();
    showStatus('개인정보 저장에 동의했어요.', 2200);
  } catch (err) {
    alert('동의 저장 실패: ' + err.message);
  }
});
privacyDeclineBtn?.addEventListener('click', async () => {
  try {
    await setPrivacyConsent(false);
  } catch (_) {}
  hidePrivacyConsentModal();
  showStatus('서버 저장 없이 이용할게요.', 2200);
});
privacyClose?.addEventListener('click', closePrivacySettings);
privacyGrantBtn?.addEventListener('click', async () => {
  try {
    await setPrivacyConsent(true);
    showStatus('동의가 저장됐어요.', 2000);
  } catch (err) {
    alert(err.message);
  }
});
privacyWithdrawBtn?.addEventListener('click', async () => {
  if (!confirm('동의를 철회할까요? 이후 서버 저장이 중단됩니다.')) return;
  try {
    await setPrivacyConsent(false);
    showStatus('동의를 철회했어요.', 2000);
  } catch (err) {
    alert(err.message);
  }
});
privacyExportBtn?.addEventListener('click', async () => {
  try {
    await exportPrivacyData();
  } catch (err) {
    alert('데이터보내기 실패: ' + err.message);
  }
});
privacyDeleteBtn?.addEventListener('click', async () => {
  try {
    await deletePrivacyData();
  } catch (err) {
    alert('삭제 실패: ' + err.message);
  }
});
guardianClose?.addEventListener('click', closeGuardian);
guardianLoginBtn?.addEventListener('click', async () => {
  try {
    await guardianLogin();
  } catch (err) {
    alert('보호자 로그인 실패: ' + err.message);
  }
});
guardianLogoutBtn?.addEventListener('click', guardianLogout);
guardianRefreshUsersBtn?.addEventListener('click', async () => {
  try {
    await loadGuardianUsers();
  } catch (err) {
    alert(err.message);
  }
});
document.addEventListener('click', () => {
  if (fabPlusWrap?.classList.contains('menu-open')) closeFabPlusMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFabPlusMenu();
});

/* 첫 인사 */
setTimeout(() => showStatus(t('sky.greet'), 3500), 600);

/* 메시지 추가 */
function addMessage(text, who='bot') {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  while (chatBox.children.length > 16) chatBox.removeChild(chatBox.firstChild);
  const role = who === 'user' ? 'user' : (who === 'assistant' ? 'assistant' : 'bot');
  if (text && !String(text).startsWith('[STT 디버그]')) {
    persistPrivacyMessage(text, role, 'chat');
  }
  return div;
}

function addBotMessageWithLink(text, linkLabel, url) {
  const div = document.createElement('div');
  div.className = 'msg bot';
  const p = document.createElement('p');
  p.className = 'msg-text';
  p.textContent = text;
  const a = document.createElement('a');
  a.className = 'msg-link-btn';
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = linkLabel;
  div.appendChild(p);
  div.appendChild(a);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  while (chatBox.children.length > 16) chatBox.removeChild(chatBox.firstChild);
  return div;
}

/** 채팅/음성 전사 문장에서 타로·사회성·지원도구 의도 감지 */
function detectToolIntent(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  const c = t.replace(/\s/g, '');
  const low = t.toLowerCase();

  if (/tarot|タロット|塔罗|塔羅/i.test(low) || /(타로|카드\s*를?\s*뽑|카드뽑|스프레드|점\s*봐|점봐|점\s*쳐|카드\s*읽|오늘\s*운세)/.test(t)) return 'tarot';
  if (/리딩/.test(t) && /(해줘|해주|봐줘|보여|하자)/.test(t)) return 'tarot';
  if (/(fortune|oracle|draw\s*a?\s*card|reading)/i.test(t) && /(tarot|card|오늘|운세|봐|해)/i.test(t)) return 'tarot';

  if (/(사회성|대화\s*연습|대화연습|롤\s*플레이|롤플레이|역할극|소통\s*연습|사교\s*연습|말하기\s*연습|티키타카)/.test(t)) return 'social';
  if (/(연습하자|연습\s*하자)/.test(t) && /(대화|소통|말하기|사회|역할)/.test(t)) return 'social';
  if (/사회성연습/.test(c)) return 'social';
  if (/(social\s*practice|role\s*play|conversation\s*practice|社会性|社交练习|pratique\s*sociale)/i.test(t)) return 'social';

  if (/(그림\s*버튼|그림\s*말하기|비언어|의사소통\s*버튼|말하기\s*버튼)/.test(t)) return 'picture';
  if (/(picture\s*talk|aac|pekcs?|絵で話|图画表达)/i.test(t)) return 'picture';

  if (/(멜트다운|감각\s*과민|감각과민|과민|불안|행동\s*조절|진정|호흡|그라운딩|감각\s*조절|진정법|숨\s*쉬)/.test(t)) return 'regulation';
  if (/(meltdown|overstimul|sensory\s*overload|anxiety|grounding|breathing|calming|感覚過敏|感觉过载|surcharge\s*sensorielle)/i.test(t)) return 'regulation';
  if (/(대처|힘들|괴롭)/.test(t) && /(감각|과민|불안|멜트|조절|진정)/.test(t)) return 'regulation';

  if (/(일정\s*관리|루틴|체크리스트|할\s*일)/.test(t)) return 'routine';
  if (/(routine|checklist|schedule|ルーチン|日程)/i.test(t)) return 'routine';

  if (/(패턴|패턴게임|패턴\s*따라|pattern)/i.test(t)) return 'game-pattern';
  if (/(정렬|정리\s*게임|sort)/i.test(t)) return 'game-sort';
  if (/(리듬|박자|rhythm)/i.test(t)) return 'game-rhythm';
  if (/(차이\s*찾기|다른\s*그림|difference|spot)/i.test(t)) return 'game-difference';
  if (/(루프|반복\s*애니|loop)/i.test(t)) return 'game-loop';
  if (/(안전\s*클릭|특정\s*색|safe\s*click)/i.test(t)) return 'game-safe';
  if (/(감정\s*매칭|표정\s*매칭|emotion)/i.test(t)) return 'game-emotion';
  if (/(미니게임|뽁뽁이|원\s*그리기|게임|mini\s*games|ミニゲーム|小游戏)/i.test(t)) return 'games';

  if (/(날씨|기온|온도|weather|météo|天気|天气)/i.test(t)) return 'weather';
  if (/(지도|맵\s*보여|어디\s*야|어디야|위치\s*알려|장소\s*찾아|geocode|openstreetmap|\bmap\b|地図|地图|carte)/i.test(t)) return 'maps';

  return null;
}

const CONTACT_EMAIL = 'ai41@ai41.kr';

/** 기관 도입·PoC·파트너십 문의 → 대화형 접수 (일상 채팅과 구분) */
function detectIntroInquiryIntent(raw) {
  const t = String(raw || '').trim();
  if (!t) return false;
  const compact = t.replace(/\s/g, '');
  // 도구/증상 이야기는 문의로 가로채지 않음
  if (detectToolIntent(t)) return false;
  if (/(도입문의|기관도입|학교도입|센터도입|메일문의|문의시작)/.test(compact)) return true;
  if (/(도입).*(문의|상담|하고싶|할래|싶어)/.test(compact)) return true;
  if (/(문의|상담).*(도입|기관\s*계약|학교\s*도입|센터\s*도입|PoC)/.test(t)) return true;
  if (/(institutional\s*adoption|ask\s*about\s*adoption|partenariat|導入相談|机构引入)/i.test(t)) return true;
  if (/(PoC|피오씨).*(문의|상담|and|want|願|想)/i.test(t)) return true;
  if (/(파트너십|제휴).*(문의|제안|하고)/.test(t)) return true;
  if (/(연락처|메일|이메일).*(알려|주세요|줘)/.test(t) && /(도입|기관|PoC|파트너)/i.test(t)) return true;
  return false;
}

function replyIntroInquiry(userText) {
  return startContactInquiry(userText);
}

function parseSocialNavigationCommand(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  const out = {};
  const low = t.toLowerCase();

  if (/(미취학|유아|어린이|preschool)/i.test(t)) out.age = 'preschool';
  else if (/(청소년|teen|십대|중고등)/i.test(t)) out.age = 'teen';
  else if (/(성인|adult|직장인)/i.test(t)) out.age = 'adult';

  const m = t.match(/(?:^|\s)(\d{1,2})\s*번/);
  if (m) out.scenarioIndex = Number(m[1]);
  else if (/^\d{1,2}$/.test(low)) out.scenarioIndex = Number(low);

  return Object.keys(out).length ? out : null;
}

/** 타로·사회성·지원도구·소개 등 도구 창 전부 닫기 */
function closeAllToolOverlays() {
  try { closeTcardLightbox?.(); } catch (_) {}
  tarotOverlay?.classList.remove('show');
  socialOverlay?.classList.remove('show');
  if (typeof socialState !== 'undefined') {
    socialState.active = false;
  }
  try { setSocialCoachLottieState?.(''); } catch (_) {}
  pictureOverlay?.classList.remove('show');
  regulationOverlay?.classList.remove('show');
  routineOverlay?.classList.remove('show');
  gamesOverlay?.classList.remove('show');
  aboutOverlay?.classList.remove('show');
  document.getElementById('blogOverlay')?.classList.remove('show');
  try { closePrivacySettings?.(); } catch (_) {}
  try { closeGuardian?.(); } catch (_) {}
}

function isAnyToolOverlayOpen() {
  return !!(
    tarotOverlay?.classList.contains('show') ||
    socialOverlay?.classList.contains('show') ||
    pictureOverlay?.classList.contains('show') ||
    regulationOverlay?.classList.contains('show') ||
    routineOverlay?.classList.contains('show') ||
    gamesOverlay?.classList.contains('show') ||
    aboutOverlay?.classList.contains('show') ||
    document.getElementById('blogOverlay')?.classList.contains('show') ||
    privacyOverlay?.classList.contains('show') ||
    guardianOverlay?.classList.contains('show')
  );
}

function showOnlyOverlay(el) {
  closeAllToolOverlays();
  if (!el) return;
  void el.offsetWidth;
  el.classList.add('show');
}

/** true면 메인 챗봇 호출 없이 해당 툴로 이동 */
function tryRouteToolIntent(text) {
  const mode = detectToolIntent(text);
  const socialNav = parseSocialNavigationCommand(text);

  // 도구 요청이 오면 문의 수집 중에도 도구를 우선 연다
  if (mode) {
    if (typeof contactInquiryState !== 'undefined' && contactInquiryState.active) {
      resetContactInquiry();
    }
    addMessage(text, 'user');
    closeFabPlusMenu();
    hideStatus();
    setState('', '');

    if (mode === 'tarot') {
      showStatus(typeof t === 'function' ? t('route.tarot') : '타로로 갈게!', 2400);
      openTarot();
      return true;
    }
    if (mode === 'social') {
      showStatus(typeof t === 'function' ? t('route.social') : '사회성 연습으로 갈게!', 2400);
      openSocial(socialNav || null);
      return true;
    }
    if (mode === 'picture') {
      showStatus(typeof t === 'function' ? t('route.picture') : '그림 말하기로 이동할게!', 2200);
      openSupportSection('picture');
      return true;
    }
    if (mode === 'regulation') {
      showStatus(typeof t === 'function' ? t('route.regulation') : '행동 조절 화면으로 이동할게!', 2200);
      openSupportSection('regulation');
      return true;
    }
    if (mode === 'routine') {
      showStatus(typeof t === 'function' ? t('route.routine') : '루틴 관리로 이동할게!', 2200);
      openSupportSection('routine');
      return true;
    }
    if (mode.startsWith('game-') || mode === 'games') {
      const focus = mode.startsWith('game-') ? mode.slice(5) : null;
      showStatus(typeof t === 'function' ? t('route.games') : '미니게임으로 이동할게!', 2200);
      openGameSection(focus);
      return true;
    }
    if (mode === 'weather') {
      showStatus(typeof t === 'function' ? t('route.weather') : '날씨를 살펴볼게!', 2200);
      handleWeatherIntent(text);
      return true;
    }
    if (mode === 'maps') {
      showStatus(typeof t === 'function' ? t('route.maps') : '지도를 찾아볼게!', 2200);
      handleMapsIntent(text);
      return true;
    }
  }

  if (typeof handleContactInquiryReply === 'function' && handleContactInquiryReply(text)) return true;

  const lang = typeof detectLanguageIntent === 'function' ? detectLanguageIntent(text) : null;
  if (lang) return replyLanguageSwitch(text, lang);

  if (detectIntroInquiryIntent(text)) return replyIntroInquiry(text);

  if (socialNav) {
    if (socialOverlay?.classList.contains('show')) {
      addMessage(text, 'user');
      closeFabPlusMenu();
      hideStatus();
      setState('', '');
      applySocialNavigation(socialNav);
      showStatus(typeof t === 'function' ? t('route.social') : '사회성 연습 설정을 반영했어!', 1800);
      return true;
    }
    if (socialNav.age) {
      addMessage(text, 'user');
      closeFabPlusMenu();
      hideStatus();
      setState('', '');
      showStatus(typeof t === 'function' ? t('route.social') : '사회성 연습으로 갈게!', 2000);
      openSocial(socialNav);
      return true;
    }
  }

  return false;
}

function extractPlaceQuery(raw) {
  let t = String(raw || '').trim();
  if (!t) return '';
  t = t
    .replace(/(오늘|내일|지금|현재|please)/gi, ' ')
    .replace(/(날씨|기온|온도|weather|météo|天気|天气)/gi, ' ')
    .replace(/(지도|맵|위치|장소|어디|찾아|알려|보여|해줘|해 줘|좀|map|maps|geocode|地図|地图|carte)/gi, ' ')
    .replace(/[?？!！.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return t;
}

async function handleWeatherIntent(userText) {
  const q = extractPlaceQuery(userText);
  try {
    const url = q ? `/api/weather?q=${encodeURIComponent(q)}` : '/api/weather';
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
    const place = data.place?.name || q || '여기';
    const w = data.weather || {};
    const shortPlace = String(place).split(',')[0];
    const msg =
      `${shortPlace} 날씨: ${w.weather_label || '-'}, ` +
      `${w.temperature_c != null ? w.temperature_c + '°C' : '-'} ` +
      `(최저 ${w.today_min ?? '-'}° / 최고 ${w.today_max ?? '-'}°), ` +
      `습도 ${w.humidity ?? '-'}%, 바람 ${w.wind_kmh ?? '-'} km/h`;
    addMessage(msg, 'bot');
  } catch (e) {
    addMessage(typeof t === 'function' ? t('weather.fail') : '날씨를 불러오지 못했어요.', 'bot');
  }
}

async function handleMapsIntent(userText) {
  const q = extractPlaceQuery(userText);
  if (!q) {
    addMessage(typeof t === 'function' ? t('maps.fail') : '장소를 찾지 못했어요. 예: 「서울역 지도」', 'bot');
    return;
  }
  try {
    const res = await fetch(`/api/maps/geocode?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'fail');
    const p = data.place;
    addMessage(`${p.name}\n위도 ${p.lat}, 경도 ${p.lon}\n지도: ${p.map_url}`, 'bot');
  } catch (e) {
    addMessage(typeof t === 'function' ? t('maps.fail') : '장소를 찾지 못했어요.', 'bot');
  }
}
