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
  const s = String(raw || '').trim();
  const c = s.replace(/\s/g, '');
  return /^(취소|그만|문의취소|나중에|됐어|아니요|cancel|annuler|キャンセル|取消|non)$/i.test(c) ||
    /(문의).*(취소|그만)/.test(s) ||
    /(cancel|annul)/i.test(s);
}

function parseContactKind(raw) {
  const s = String(raw || '').trim();
  const c = s.replace(/\s/g, '');
  if (/(단체|법인|기관|회사|학교|센터|재단|협회|organization|organisation|corp|회사|団体|法人|机构|entreprise|organisation)/i.test(c)) {
    return t('kind.org');
  }
  if (/(개인|나|저|혼자|individual|particulier|个人|個人)/i.test(c)) {
    return t('kind.person');
  }
  if (/^[12]$/.test(c)) return c === '1' ? t('kind.person') : t('kind.org');
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
  addMessage(t('inq.start'), 'bot');
  hideStatus();
  setState(null);
  textInput?.focus();
  return true;
}

async function submitContactInquiry() {
  const url = contactApiUrl('/inquiry');
  if (!url) {
    addMessage(t('inq.noServer'), 'bot');
    resetContactInquiry();
    return;
  }
  addMessage(t('inq.sending'), 'bot');
  setState('thinking', t('inq.sending'), 0);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: contactInquiryState.kind,
        affiliation: contactInquiryState.affiliation,
        contact: contactInquiryState.contact,
        message: contactInquiryState.message,
        lang: typeof currentLang !== 'undefined' ? currentLang : 'ko',
        user_id: (typeof getOrCreateUserId === 'function' ? getOrCreateUserId() : ''),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || `fail (${res.status})`);
    }
    addMessage(t('inq.sent'), 'bot');
    if (typeof logPrivacyActivity === 'function') {
      logPrivacyActivity('contact_inquiry_sent', contactInquiryState.kind);
    }
  } catch (err) {
    const detail = String(err.message || err || '').trim();
    addMessage(detail && !detail.startsWith('fail') ? detail : t('inq.fail'), 'bot');
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
    addMessage(t('inq.cancel'), 'bot');
    return true;
  }

  if (contactInquiryState.step === 'type') {
    const kind = parseContactKind(text);
    if (!kind) {
      addMessage(t('inq.typeRetry'), 'bot');
      return true;
    }
    contactInquiryState.kind = kind;
    contactInquiryState.step = 'affiliation';
    addMessage(kind === t('kind.person') ? t('inq.affPerson') : t('inq.affOrg'), 'bot');
    return true;
  }

  if (contactInquiryState.step === 'affiliation') {
    if (text.length < 2) {
      addMessage(t('inq.affRetry'), 'bot');
      return true;
    }
    contactInquiryState.affiliation = text;
    const maybeEmail = extractEmail(text);
    if (maybeEmail) contactInquiryState.contact = maybeEmail;
    contactInquiryState.step = 'message';
    addMessage(t('inq.message'), 'bot');
    return true;
  }

  if (contactInquiryState.step === 'message') {
    if (text.length < 4) {
      addMessage(t('inq.msgRetry'), 'bot');
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
    addMessage(t('inq.contact'), 'bot');
    return true;
  }

  if (contactInquiryState.step === 'contact') {
    if (text.length < 3) {
      addMessage(t('inq.contactRetry'), 'bot');
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
