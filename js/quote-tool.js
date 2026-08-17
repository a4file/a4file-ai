/* 스카이 견적 도구. LLM이 아니라 /api/quote 프로그램을 고른다. */

function detectQuoteIntent(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  const c = t.replace(/\s/g, '');
  const wantsQuote = /(견적|얼마|비용|단가|견적서|quote|devis|見積)/i.test(t);
  const wantsSplit = /(쪼개|분해|과업\s*나열|어떤\s*일|단계로)/.test(t);
  const wantsEffort = /(공수|맨먼스|맨데이|며칠|얼마나\s*걸|M\/M|M\/D|공수산정)/i.test(t);
  const wantsPrice = /(금액|얼마야|얼마예요|가격|부가세)/.test(t);
  const hasTask = t.length >= 6 && (wantsQuote || wantsSplit || wantsEffort || wantsPrice
    || /(숏폼|영상|교육|PoC|자동화|뉴로|검수|제안서|연구)/i.test(t));
  if (!wantsQuote && !wantsSplit && !wantsEffort && !wantsPrice) return null;
  let mode = 'draft';
  if (wantsSplit && !wantsPrice && !wantsQuote) mode = 'split';
  else if (wantsEffort && !wantsPrice && !wantsQuote) mode = 'effort';
  else if (wantsPrice && /(일\s*\d|MD|공수\s*\d)/i.test(t)) mode = 'price';
  else if (wantsQuote || wantsPrice) mode = 'draft';
  let span = null;
  if (/(1주|일주일|한\s*주)/.test(c)) span = 'week';
  else if (/(2~3주|2\-3주|이주|삼주|2주|3주)/.test(c)) span = 'biweek';
  else if (/(한달|1개월|한\s*달)/.test(c)) span = 'month';
  let difficulty = 'normal';
  if (/(낮음|쉬운|간단)/.test(t)) difficulty = 'low';
  if (/(높음|어려|촉박|급함|민감)/.test(t)) difficulty = 'high';
  const rush = /(급함|내일까지|이번\s*주\s*안)/.test(t);
  return { mode, text: t, span, difficulty, rush, hasTask };
}

function formatQuoteReply(mode, data) {
  if (!data || !data.ok) return '견적 프로그램이 숫자를 못 냈어요. /quote 에서 다시 적어 주세요.';
  if (mode === 'split') {
    const lines = (data.packages || []).map((p) => `· ${p.name} (${p.role}, ${p.md}일)`).join('\n');
    return `${data.label}로 과업을 나눴어요.\n${lines}\n확인: ${(data.missing || []).join(', ') || '없음'}\n자세히: /quote`;
  }
  if (mode === 'effort') {
    const lines = (data.rows || []).map((r) => `· ${r.name}: ${r.md} M/D`).join('\n');
    return `${data.label} 공수는 ${data.total_md} M/D (${data.total_mm} M/M)예요.\n${lines}\n자세히: /quote`;
  }
  if (mode === 'price' && data.supply != null) {
    const band = data.customer_range ? ` 권장 밴드는 ${data.customer_range}예요.` : '';
    return `과업 수행비 ${data.supply.toLocaleString('ko-KR')}원, 부가세 포함 ${data.total.toLocaleString('ko-KR')}원이에요.${band} 토큰·라이선스·성우 실비는 별도예요. 자세히: /quote`;
  }
  if (data.summary) return `${data.summary}\n자세히: /quote`;
  return '견적을 열게요. /quote';
}

async function handleQuoteIntent(userText, intent) {
  const q = intent || detectQuoteIntent(userText);
  if (!q) return;
  if (!q.hasTask && q.mode === 'draft') {
    addMessage('과업을 한 줄로 말해 주세요. 예: 「숏폼 4편 견적」, 「교육 1회차 공수」, 「뉴로크래프트 2주」. 화면은 /quote 예요.', 'bot');
    return;
  }
  const body = {
    text: q.text,
    difficulty: q.difficulty,
    rush: q.rush,
    span: q.span,
  };
  const path = q.mode === 'split' ? '/api/quote/split'
    : q.mode === 'effort' ? '/api/quote/effort'
    : q.mode === 'price' ? '/api/quote/draft'
    : '/api/quote/draft';
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    addMessage(formatQuoteReply(q.mode, data), 'bot');
  } catch (e) {
    addMessage('견적 프로그램에 닿지 못했어요. /quote 페이지에서 적어 주세요.', 'bot');
  }
}
