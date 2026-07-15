/* ============================================================
   도입·상담 문의 — 대화형 수집 후 서버에서 ai41@ai41.kr 메일 발송
============================================================ */
const CONTACT_TO_EMAIL = 'ai41@ai41.kr';

const contactInquiryState = {
  active: false,
  step: null, // type | affiliation | message | contact
  kind: '',
  affiliation: '',
  message: '',
  contact: '',
};

function contactApiUrl(path) {
  const base = configuredProxyBase
    ? `${configuredProxyBase}/api/contact`
    : (isHttpContext ? '/api/contact' : null);
  if (!base) return null;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function resetContactInquiry() {
  contactInquiryState.active = false;
  contactInquiryState.step = null;
  contactInquiryState.kind = '';
  contactInquiryState.affiliation = '';
  contactInquiryState.message = '';
  contactInquiryState.contact = '';
}

function isContactInquiryCancel(raw) {
  const t = String(raw || '').trim();
  return /^(취소|그만|문의취소|나중에|됐어|아니요)$/.test(t.replace(/\s/g, '')) ||
    /(문의).*(취소|그만)/.test(t);
}

function parseContactKind(raw) {
  const t = String(raw || '').trim();
  const c = t.replace(/\s/g, '');
  if (/(단체|법인|기관|회사|학교|센터|재단|협회)/.test(c)) return '단체(법인)';
  if (/(개인|나|저|혼자|individual)/i.test(c)) return '개인';
  if (/^[12]$/.test(c)) return c === '1' ? '개인' : '단체(법인)';
  return null;
}

function extractEmail(raw) {
  const m = String(raw || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0] : '';
}

function startContactInquiry(userText) {
  if (userText) addMessage(userText, 'user');
  resetContactInquiry();
  contactInquiryState.active = true;
  contactInquiryState.step = 'type';
  addMessage(
    '도입·상담 문의를 도와드릴게요. 먼저 개인이신가요, 단체(법인)이신가요? (취소라고 하시면 중단해요)',
    'bot'
  );
  hideStatus();
  setState(null);
  textInput?.focus();
  return true;
}

async function submitContactInquiry() {
  const url = contactApiUrl('/inquiry');
  if (!url) {
    addMessage('지금은 문의 전송 서버에 연결되지 않았어요. 잠시 후 다시 시도해 주세요.', 'bot');
    resetContactInquiry();
    return;
  }
  addMessage('말씀해 주신 내용을 모아 ai41@ai41.kr 로 보내는 중이에요…', 'bot');
  setState('thinking', '문의 전송 중', 0);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: contactInquiryState.kind,
        affiliation: contactInquiryState.affiliation,
        contact: contactInquiryState.contact,
        message: contactInquiryState.message,
        user_id: (typeof getOrCreateUserId === 'function' ? getOrCreateUserId() : ''),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `전송 실패 (${res.status})`);
    }
    addMessage(
      `접수했어요. ${CONTACT_TO_EMAIL} 로 메일을 보냈고, 확인되는 대로 회신드릴게요.`,
      'bot'
    );
    if (typeof logPrivacyActivity === 'function') {
      logPrivacyActivity('contact_inquiry_sent', contactInquiryState.kind);
    }
  } catch (err) {
    addMessage(
      `메일 전송에 실패했어요. ${err.message || err} — 잠시 후 다시 「도입 문의」를 말해 주세요.`,
      'bot'
    );
  } finally {
    hideStatus();
    setState(null);
    resetContactInquiry();
  }
}

/** 문의 진행 중이면 true — 일반 챗봇으로 보내지 않음 */
function handleContactInquiryReply(raw) {
  if (!contactInquiryState.active) return false;
  const text = String(raw || '').trim();
  if (!text) return true;

  addMessage(text, 'user');

  if (isContactInquiryCancel(text)) {
    resetContactInquiry();
    addMessage('문의를 취소했어요. 나중에 다시 「도입 문의」라고 말해 주세요.', 'bot');
    return true;
  }

  if (contactInquiryState.step === 'type') {
    const kind = parseContactKind(text);
    if (!kind) {
      addMessage('「개인」또는 「단체(법인)」으로 답해 주세요.', 'bot');
      return true;
    }
    contactInquiryState.kind = kind;
    contactInquiryState.step = 'affiliation';
    addMessage(
      kind === '개인'
        ? '알겠어요. 소속이나 이름을 알려 주세요. (예: 프리랜서, 보호자, 관심 있는 분)'
        : '알겠어요. 소속 기관·법인명을 알려 주세요.',
      'bot'
    );
    return true;
  }

  if (contactInquiryState.step === 'affiliation') {
    if (text.length < 2) {
      addMessage('소속을 한두 글자 이상 적어 주세요.', 'bot');
      return true;
    }
    contactInquiryState.affiliation = text;
    const maybeEmail = extractEmail(text);
    if (maybeEmail) contactInquiryState.contact = maybeEmail;
    contactInquiryState.step = 'message';
    addMessage('어떤 내용으로 문의하시나요? 도입·PoC·파트너십 등 편하게 적어 주세요.', 'bot');
    return true;
  }

  if (contactInquiryState.step === 'message') {
    if (text.length < 4) {
      addMessage('문의 내용을 조금만 더 적어 주시면 전달하기 좋아요.', 'bot');
      return true;
    }
    contactInquiryState.message = text;
    const maybeEmail = extractEmail(text);
    if (maybeEmail) contactInquiryState.contact = maybeEmail;
    if (contactInquiryState.contact && contactInquiryState.contact.includes('@')) {
      submitContactInquiry();
      return true;
    }
    contactInquiryState.step = 'contact';
    addMessage('마지막으로, 회신 받으실 이메일(또는 전화번호)을 알려 주세요.', 'bot');
    return true;
  }

  if (contactInquiryState.step === 'contact') {
    if (text.length < 3) {
      addMessage('회신 가능한 이메일이나 전화번호를 적어 주세요.', 'bot');
      return true;
    }
    contactInquiryState.contact = text;
    submitContactInquiry();
    return true;
  }

  return true;
}

document.getElementById('contactInquiryBtn')?.addEventListener('click', () => {
  startContactInquiry('');
});
