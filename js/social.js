/* ============================================================
   🌱 사회성 연습 — 연구 동향 참고 + AI 생성 시나리오·롤플레이
   - 연령: 미취학(4-6) / 청소년(13-17) / 성인(18-35)
   - 각 시나리오는 페르소나(상대)와 코칭 힌트를 포함(앱 전용 콘텐츠)
   - GPT-5.4 mini가 페르소나 연기 담당
============================================================ */
const SOCIAL_SCENARIOS = {
  preschool: {
    label: '미취학 아동 (4-6세)',
    emoji: '🧸',
    tone: '아주 쉬운 말, 짧은 한 문장씩',
    scenarios: [
      {
        id: 'p-greeting',
        emoji: '👋',
        title: '새 친구에게 인사하기',
        goal: '이름을 묻고 대답하며 인사하기',
        persona: { name: '민지', emoji: '👧', role: '처음 만난 같은 반 친구' },
        opening: '어… 안녕. (옆으로 슬쩍 보며)',
        hints: [
          '눈을 보고 "안녕!" 하고 말해요',
          '내 이름을 알려줘요 — "나는 OOO이야"',
          '친구 이름도 물어봐요 — "너는 이름이 뭐야?"',
        ],
      },
      {
        id: 'p-turn',
        emoji: '🧩',
        title: '장난감 차례 지키기',
        goal: '원하는 장난감을 쓸 때 기다리고 양보 말하기',
        persona: { name: '준호', emoji: '👦', role: '블록으로 놀고 있는 친구' },
        opening: '(블록을 쌓으며) 이건 내가 쓰는 중이야.',
        hints: [
          '"다 쓰면 알려줄래?" 하고 부탁해요',
          '차례가 올 때까지 다른 놀이를 해요',
          '받으면 "고마워"라고 말해요',
        ],
      },
      {
        id: 'p-emotion',
        emoji: '😠',
        title: '화 날 때 말로 표현하기',
        goal: '소리 지르는 대신 감정을 말로 전하기',
        persona: { name: '서윤', emoji: '🧒', role: '그림을 망친 친구' },
        opening: '(실수로 네 그림 위에 물감을 쏟았어) …어떡하지.',
        hints: [
          '크게 숨을 쉬고 "나는 속상해"라고 말해요',
          '이유를 알려줘요 — "그림이 망가져서 슬퍼"',
          '같이 해결할 방법을 찾아요',
        ],
      },
      {
        id: 'p-join',
        emoji: '🎠',
        title: '놀이에 끼어들기',
        goal: '이미 놀고 있는 친구들에게 자연스럽게 참여 제안하기',
        persona: { name: '수아', emoji: '👧', role: '두 명이서 소꿉놀이 중' },
        opening: '(인형을 들고) 자, 이제 밥 먹자!',
        hints: [
          '가까이 가서 잠시 보고 기다려요',
          '"나도 같이 해도 돼?"라고 물어요',
          '안 된다고 해도 화내지 않아요',
        ],
      },
    ],
  },
  teen: {
    label: '청소년 (13-17세)',
    emoji: '🎒',
    tone: '자연스러운 반말, 요즘 청소년 말투',
    scenarios: [
      {
        id: 't-enter',
        emoji: '🍱',
        title: '점심 시간 대화에 끼어들기',
        goal: '친구들 사이에 자연스럽게 합류하고 공통 주제로 대화하기',
        persona: { name: '지훈', emoji: '🧑', role: '같은 반 친구들과 게임 얘기 중' },
        opening: '어제 그 보스 완전 말도 안 되지 않냐? 3번 만에 깼어.',
        hints: [
          '먼저 무슨 얘기 중인지 들어봐요',
          '공통 관심사 키워드를 잡고 자연스럽게 한마디 해요',
          '질문은 한 번에 하나씩, 대답 듣고 이어가요',
        ],
      },
      {
        id: 't-conflict',
        emoji: '😤',
        title: '친구와의 오해 풀기',
        goal: '"나"를 주어로 감정을 말하고 사과·화해하기',
        persona: { name: '예린', emoji: '🧑‍🎤', role: '너한테 삐진 친구' },
        opening: '어제 너 왜 대답 안 했어? 무시당한 기분이야.',
        hints: [
          '변명보다 먼저 상대 감정을 인정해요',
          '"내가 ~해서 그랬어" 식으로 이유를 설명해요',
          '잘못했다면 진심 어린 사과를 해요',
        ],
      },
      {
        id: 't-tease',
        emoji: '🫤',
        title: '놀림에 무심하게 대응하기',
        goal: '감정 동요를 보이지 않고 자연스럽게 넘기기',
        persona: { name: '민재', emoji: '🧑‍🦱', role: '가볍게 장난을 거는 반 친구' },
        opening: '야, 너 어제 발표할 때 완전 땀 줄줄이던데 ㅋㅋ',
        hints: [
          '"그래서 어쩌라고" 같은 담담한 반응이 오히려 효과적이에요',
          '화내거나 억지로 웃지 않아요 — 과잉 반응이 재미를 만들어줘요',
          '주제를 자연스럽게 바꿔요',
        ],
      },
      {
        id: 't-plan',
        emoji: '📱',
        title: '친구에게 놀자고 제안하기',
        goal: '구체적으로 시간·장소를 제안하고 상대 일정 존중하기',
        persona: { name: '하늘', emoji: '🧑‍🎓', role: '평소 친한 반 친구' },
        opening: '요즘 뭐하고 지내? 시험 끝나고 심심해.',
        hints: [
          '구체적으로 제안해요 — "토요일 오후에 영화 어때?"',
          '상대 일정을 물어봐요 — "너는 언제 괜찮아?"',
          '거절당해도 쿨하게 — "알겠어, 다음에 보자!"',
        ],
      },
    ],
  },
  adult: {
    label: '성인 (18-35세)',
    emoji: '💼',
    tone: '정중한 존댓말 또는 적절한 수준의 반말',
    scenarios: [
      {
        id: 'a-smalltalk',
        emoji: '☕',
        title: '직장 동료와 스몰토크',
        goal: 'TMI 없이 가볍게 관계 형성하기',
        persona: { name: '서지윤 대리', emoji: '👩‍💼', role: '옆자리 동료' },
        personaGuide: {
          difficulty: 2,
          style: '친절하고 여유 있는 편, 기본적으로 호의적',
          tone: '부드러운 존댓말',
          pressure: '대답이 어색해도 기다려주고 대화를 살짝 도와줌',
        },
        opening: '주말에 뭐 하셨어요? 저는 그냥 집에서 쉬었어요.',
        hints: [
          '너무 깊은 사적 정보는 생략해요',
          '상대 질문을 되돌려줘요 — "○○ 님은요?"',
          '공통 주제로 이어가요 (업무·날씨·음식)',
        ],
      },
      {
        id: 'a-feedback',
        emoji: '🧑‍💼',
        title: '상사의 부정적 피드백 수용하기',
        goal: '방어하지 않고 개선점을 명확히 질문하기',
        persona: { name: '박부장', emoji: '🧑‍💼', role: '성과 중심의 직속 상사' },
        personaGuide: {
          difficulty: 5,
          style: '직설적이고 무뚝뚝함, 성격이 급하고 타협이 적음',
          tone: '짧고 단호한 업무체, 공감 표현 적음',
          pressure: '질문을 되묻거나 성과·기한을 압박해 소셜 스킬을 더 요구함',
        },
        opening: '○○ 님, 이번 보고서는 기대보다 아쉬웠어요. 구조가 정리가 안 되어 보이던데.',
        hints: [
          '"네, 알겠습니다"로 먼저 받아요',
          '구체적으로 어떤 부분이 아쉬웠는지 질문해요',
          '개선 계획을 간단히 말하고 마무리해요',
        ],
      },
      {
        id: 'a-advocacy',
        emoji: '🗣️',
        title: '내 필요 정중하게 말하기 (자기 옹호)',
        goal: '업무 조정이나 편의 요청을 명확하게 전달하기',
        persona: { name: '이 매니저', emoji: '👨‍💼', role: '직속 매니저' },
        personaGuide: {
          difficulty: 3,
          style: '정중하고 합리적이며 경청하는 편',
          tone: '예의 있는 존댓말, 논리 중심 질문',
          pressure: '요청 근거를 물어보지만 대화는 협의적으로 진행',
        },
        opening: '요즘 업무량 어때요? 프로젝트 하나 더 맡을 수 있을까요?',
        hints: [
          '현재 상황을 사실 중심으로 말해요',
          '구체적인 필요를 문장으로 제안해요 (예: "회의 자료를 하루 전에 받을 수 있을까요?")',
          '감정적 호소보다 업무 효과성 관점으로 설명해요',
        ],
      },
      {
        id: 'a-date',
        emoji: '💐',
        title: '호감 있는 사람에게 데이트 신청',
        goal: '부담 없이 명확하게 제안하고 거절 수용하기',
        persona: { name: '하윤', emoji: '🙂', role: '취미 모임에서 만난 사람' },
        personaGuide: {
          difficulty: 3,
          style: '상대 반응을 보며 조심스럽게 대화함',
          tone: '부담 주지 않는 편안한 말투',
          pressure: '애매한 답으로 반응해 사용자의 명확한 표현을 유도',
        },
        opening: '저번에 얘기한 그 전시회, 저도 가보고 싶더라고요.',
        hints: [
          '구체적인 활동을 제안해요 — "이번 주 토요일에 같이 갈래요?"',
          '거절 여지를 줘요 — "혹시 시간 되시면요"',
          '거절당하면 정중하게 — "알겠습니다, 편하게 답 주세요"',
        ],
      },
    ],
  },
};

/* ========== 상태 ========== */
const socialState = {
  age: null,         // 'preschool' | 'teen' | 'adult'
  scenario: null,    // 시나리오 객체
  turns: [],         // [{role:'persona'|'user', text}]
  userMemory: [],    // 최근 사용자 발화(맥락 유지용)
  active: false,
  sessionLog: '',    // 피드백용 대화 로그
};

/* ========== DOM ========== */
const socialChipBtn = document.getElementById('socialChip');
const socialOverlay = document.getElementById('socialOverlay');
const socialClose = document.getElementById('socialClose');
const socialScroll = document.getElementById('socialScroll');
const socialSubtitle = document.getElementById('socialSubtitle');
const socialCrumb = document.getElementById('socialCrumb');

const agePicker = document.getElementById('agePicker');
const scenarioPicker = document.getElementById('scenarioPicker');
const randomScenarioBtn = document.getElementById('randomScenarioBtn');
const scenarioListEl = document.getElementById('scenarioList');
const rolePlayEl = document.getElementById('rolePlay');
const rpContextEl = document.getElementById('rpContext');
const rpChatEl = document.getElementById('rpChat');
const rpHintBtn = document.getElementById('rpHintBtn');
const rpEndBtn = document.getElementById('rpEndBtn');
const rpHintsEl = document.getElementById('rpHints');
const rpHintsListEl = document.getElementById('rpHintsList');
const rpInputBar = document.getElementById('rpInputBar');
const rpInput = document.getElementById('rpInput');
const rpSendBtn = document.getElementById('rpSend');
const rpMicBtn = document.getElementById('rpMicBtn');
const rpReviewEl = document.getElementById('rpReview');
const rpSummaryBody = document.getElementById('rpSummaryBody');
const rpRetryBtn = document.getElementById('rpRetryBtn');
const rpAnotherBtn = document.getElementById('rpAnotherBtn');
const socialCoachBubble = document.getElementById('socialCoachBubble');

/* ========== 열기/닫기 ========== */
socialChipBtn?.addEventListener('click', openSocial);
socialClose?.addEventListener('click', closeSocial);
function openSocial(initialSelection = null) {
  tarotOverlay?.classList.remove('show');
  closeTcardLightbox();
  closeSupport();
  closeAbout();
  closePrivacySettings();
  closeGuardian();
  resetSocial();
  socialOverlay.classList.add('show');
  logPrivacyActivity('social_open');
  if (characterAnimationDataCache && !socialCoachLottieInstance) {
    initSocialCoachLottie(characterAnimationDataCache);
  }
  if (initialSelection) applySocialNavigation(initialSelection);
}
function closeSocial() {
  socialOverlay.classList.remove('show');
  socialState.active = false;
  setSocialCoachLottieState('');
}

function resetSocial() {
  socialState.age = null;
  socialState.scenario = null;
  socialState.turns = [];
  socialState.userMemory = [];
  socialState.active = false;
  socialState.sessionLog = '';
  agePicker.style.display = '';
  scenarioPicker.style.display = 'none';
  rolePlayEl.style.display = 'none';
  rpReviewEl.style.display = 'none';
  rpChatEl.innerHTML = '';
  rpHintsEl.style.display = 'none';
  socialSubtitle.textContent = '연령대를 선택하면 상황을 골라볼 수 있어요.';
  setCrumb('연령 선택');
}

function setCrumb(text) {
  if (socialCrumb) socialCrumb.textContent = text;
}

/* 연령대 선택 */
agePicker?.querySelectorAll('[data-age]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const age = btn.getAttribute('data-age');
    socialState.age = age;
    showScenarioPicker(age);
  });
});

function showScenarioPicker(age) {
  const group = SOCIAL_SCENARIOS[age];
  if (!group) return;
  agePicker.style.display = 'none';
  scenarioPicker.style.display = '';
  socialSubtitle.textContent = `${group.emoji} ${group.label} — 연습하고 싶은 상황을 골라보세요.`;
  setCrumb(group.label);
  scenarioListEl.innerHTML = '';
  group.scenarios.forEach((sc) => {
    const card = document.createElement('button');
    card.className = 'scenario-card';
    card.innerHTML = `
      <div class="scenario-emoji">${sc.emoji}</div>
      <div class="scenario-title">${sc.title}</div>
      <div class="scenario-goal">${escapeHtml(sc.goal)}</div>
    `;
    card.addEventListener('click', () => startRolePlay(age, sc));
    scenarioListEl.appendChild(card);
  });
}

randomScenarioBtn?.addEventListener('click', () => {
  const age = socialState.age || 'teen';
  const group = SOCIAL_SCENARIOS[age];
  if (!group) return;
  const sc = group.scenarios[Math.floor(Math.random() * group.scenarios.length)];
  startRolePlay(age, sc);
});

/* 스테이지 패널 → 특정 시나리오로 바로 진입 (예: 소개 영역의 CTA) */
function applySocialNavigation(sel) {
  // sel: { age, scenarioId } 형태를 기대. 없으면 기본 진입.
  if (!sel || !sel.age) return;
  const group = SOCIAL_SCENARIOS[sel.age];
  if (!group) return;
  socialState.age = sel.age;
  if (sel.scenarioId) {
    const sc = group.scenarios.find((s) => s.id === sel.scenarioId);
    if (sc) { startRolePlay(sel.age, sc); return; }
  }
  showScenarioPicker(sel.age);
}

/* 롤플레이 시작 */
function startRolePlay(age, scenario) {
  socialState.scenario = scenario;
  socialState.turns = [];
  socialState.userMemory = [];
  socialState.active = true;
  socialState.sessionLog = '';

  scenarioPicker.style.display = 'none';
  rolePlayEl.style.display = '';
  rpReviewEl.style.display = 'none';
  rpChatEl.innerHTML = '';
  rpHintsEl.style.display = 'none';

  setCrumb(scenario.title);
  socialSubtitle.textContent = `${scenario.emoji} ${scenario.title} — ${scenario.persona.emoji} ${scenario.persona.name}(${scenario.persona.role})와 대화해보세요.`;

  rpContextEl.innerHTML = `
    <div class="rp-goal"><strong>목표</strong> ${escapeHtml(scenario.goal)}</div>
    <div class="rp-persona">${scenario.persona.emoji} <strong>${escapeHtml(scenario.persona.name)}</strong> · ${escapeHtml(scenario.persona.role)}</div>
  `;

  addRpMsg('persona', scenario.opening);
  socialState.turns.push({ role: 'persona', text: scenario.opening });
  socialState.sessionLog += `${scenario.persona.name}: ${scenario.opening}\n`;

  setSocialCoachLottieState('idle');
}

function addRpMsg(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `rp-msg rp-${role}`;
  wrap.innerHTML = `<div class="rp-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
  rpChatEl.appendChild(wrap);
  rpChatEl.scrollTop = rpChatEl.scrollHeight;
  return wrap;
}

/* 힌트 토글 */
rpHintBtn?.addEventListener('click', () => {
  const showing = rpHintsEl.style.display !== 'none';
  if (showing) {
    rpHintsEl.style.display = 'none';
    return;
  }
  const sc = socialState.scenario;
  if (!sc) return;
  rpHintsListEl.innerHTML = '';
  sc.hints.forEach((h) => {
    const li = document.createElement('li');
    li.textContent = h;
    rpHintsListEl.appendChild(li);
  });
  rpHintsEl.style.display = '';
});

rpEndBtn?.addEventListener('click', () => {
  finishAndReview();
});

/* 전송 */
rpSendBtn?.addEventListener('click', () => handleRpSend());
rpInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleRpSend();
  }
});

function handleRpSend() {
  const text = rpInput.value.trim();
  if (!text) return;
  handleRpSendWithText(text);
  rpInput.value = '';
}

function handleRpSendWithText(text) {
  if (!socialState.active) return;
  addRpMsg('user', text);
  socialState.turns.push({ role: 'user', text });
  socialState.userMemory.push(text);
  socialState.sessionLog += `나: ${text}\n`;

  const userTurnCount = socialState.turns.filter((t) => t.role === 'user').length;
  if (userTurnCount >= MAX_SOCIAL_USER_TURNS) {
    askPersonaReply(text, true);
  } else {
    askPersonaReply(text, false);
  }
}

/* 롤플레이용 음성 입력 */
let rpMicRecorder = null;
let rpMicChunks = [];
let rpMicStream = null;
rpMicBtn?.addEventListener('click', async () => {
  if (rpMicRecorder && rpMicRecorder.state === 'recording') {
    rpMicRecorder.stop();
    return;
  }
  try {
    rpMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    rpMicChunks = [];
    rpMicRecorder = new MediaRecorder(rpMicStream);
    rpMicRecorder.ondataavailable = (e) => { if (e.data.size > 0) rpMicChunks.push(e.data); };
    rpMicRecorder.onstop = async () => {
      rpMicBtn.classList.remove('recording');
      rpMicStream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(rpMicChunks, { type: 'audio/webm' });
      try {
        const wavBlob = await convertToWav(blob);
        const base64 = await blobToBase64(wavBlob);
        const text = await transcribeWavToText(base64);
        if (text) handleRpSendWithText(text);
      } catch (err) {
        logSttDebug('rp mic error: ' + err.message);
      }
    };
    rpMicRecorder.start();
    rpMicBtn.classList.add('recording');
  } catch (err) {
    showStatus('마이크 권한이 필요해요.');
  }
});

/* AI 페르소나 응답 (스트리밍) */
async function askPersonaReply(userText, isLastTurn) {
  const sc = socialState.scenario;
  if (!sc) return;
  setSocialCoachLottieState('thinking');
  const thinkingBubble = addRpMsg('persona', '…');

  const guide = sc.personaGuide
    ? `난이도(1~5, 5가 가장 어려움): ${sc.personaGuide.difficulty}
성격/태도: ${sc.personaGuide.style}
말투: ${sc.personaGuide.tone}
대화 중 압박 요소: ${sc.personaGuide.pressure}`
    : `성격/태도: 상황에 맞게 자연스럽고 친절하게
말투: ${SOCIAL_SCENARIOS[socialState.age]?.tone || '자연스러운 대화체'}`;

  const systemPrompt = `너는 사회성 연습 앱 '스카이'의 롤플레이 엔진이다. 아래 인물이 되어 1인칭으로만 대사하라.

[인물]
이름: ${sc.persona.name}
역할: ${sc.persona.role}
상황: ${sc.title} — 목표: ${sc.goal}

[페르소나 지침]
${guide}

[규칙]
- 반드시 위 인물의 입장에서만 말한다. 코치나 AI로서 조언하지 않는다.
- 한두 문장 이내로 짧고 자연스럽게 대답한다.
- 상대(사용자)의 말에 자연스럽게 반응하며 대화를 이어간다.
- ${isLastTurn ? '이번이 마지막 대화 차례다. 대화를 자연스럽게 마무리하는 톤으로 대답하라.' : ''}
- 존댓말/반말 여부는 페르소나 설정을 따른다.
- 이모지는 최소화한다.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...socialState.turns.map((t) => ({
      role: t.role === 'persona' ? 'assistant' : 'user',
      content: t.text,
    })),
  ];

  try {
    const headers = await buildApiHeaders();
    const res = await fetchApiWithRetry(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        stream: true,
        max_completion_tokens: MAX_OUTPUT_TOKENS.socialReply,
      }),
    });
    if (!res.ok || !res.body) throw new Error(await describeApiHttpError(res));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            full = appendStreamDelta(full, delta);
            thinkingBubble.querySelector('.rp-bubble').innerHTML = escapeHtml(full).replace(/\n/g, '<br>');
            rpChatEl.scrollTop = rpChatEl.scrollHeight;
          }
        } catch (e) { /* partial json, ignore */ }
      }
    }
    full = removeConsecutiveRepeat(full).trim();
    thinkingBubble.querySelector('.rp-bubble').innerHTML = escapeHtml(full).replace(/\n/g, '<br>');
    socialState.turns.push({ role: 'persona', text: full });
    socialState.sessionLog += `${sc.persona.name}: ${full}\n`;
    setSocialCoachLottieState('idle');
    speakKorean(full);

    if (isLastTurn) {
      setTimeout(() => finishAndReview(), 900);
    }
  } catch (err) {
    thinkingBubble.querySelector('.rp-bubble').textContent = '(연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.)';
    setSocialCoachLottieState('');
  }
}

/* 종료 후 피드백 생성 */
async function finishAndReview() {
  if (!socialState.active) return;
  socialState.active = false;
  rolePlayEl.style.display = 'none';
  rpReviewEl.style.display = '';
  rpSummaryBody.innerHTML = '<p class="muted">피드백을 준비하고 있어요…</p>';
  logPrivacyActivity('social_session_complete');
  persistPrivacyMessage('social_practice', socialState.sessionLog);

  const sc = socialState.scenario;
  const feedbackPrompt = `너는 신경다양성 당사자를 돕는 사회성 코치다. 아래는 방금 끝난 롤플레이 대화 기록이다.

[상황] ${sc.title} — 목표: ${sc.goal}
[대화 기록]
${socialState.sessionLog}

다음 형식의 JSON으로만 답하라 (마크다운 코드블록 없이 순수 JSON):
{
  "good": ["잘한 점 1", "잘한 점 2"],
  "tip": ["다음에 시도해볼 점 1", "다음에 시도해볼 점 2"],
  "encouragement": "짧고 따뜻한 격려 한 문장"
}
모든 문장은 한국어, 존댓말, 비판적이지 않고 따뜻한 톤으로 작성한다.`;

  try {
    const headers = await buildApiHeaders();
    const res = await fetchApiWithRetry(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: feedbackPrompt }],
        max_completion_tokens: MAX_OUTPUT_TOKENS.socialFeedback,
      }),
    });
    if (!res.ok) throw new Error(await describeApiHttpError(res));
    const json = await res.json();
    const text = extractAssistantMessageText(json);
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    saveSocialFeedbackDaily(sc.id, parsed);

    rpSummaryBody.innerHTML = `
      <div class="rp-fb-block">
        <h4>👍 잘한 점</h4>
        <ul>${parsed.good.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
      </div>
      <div class="rp-fb-block">
        <h4>💡 다음에 시도해볼 점</h4>
        <ul>${parsed.tip.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
      </div>
      <p class="rp-fb-encourage">${escapeHtml(parsed.encouragement)}</p>
    `;
  } catch (err) {
    rpSummaryBody.innerHTML = '<p class="muted">피드백을 불러오지 못했어요. 그래도 오늘 연습을 완료했어요! 🎉</p>';
  }
}

rpRetryBtn?.addEventListener('click', () => {
  if (socialState.scenario) startRolePlay(socialState.age, socialState.scenario);
});
rpAnotherBtn?.addEventListener('click', () => {
  rpReviewEl.style.display = 'none';
  showScenarioPicker(socialState.age);
});
