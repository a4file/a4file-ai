/* ===== 녹음 ===== */
let mediaRecorder = null, audioChunks = [], isRecording = false;
const STT_DEBUG = true;

function logSttDebug(message) {
  if (!STT_DEBUG) return;
  addMessage(`[STT 디버그] ${message}`, 'assistant');
}

micBtn.addEventListener('click', async () => {
  if (demoMode) return;
  if (isRecording) { mediaRecorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      micBtn.classList.remove('recording');
      isRecording = false;
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      try {
        logSttDebug(`녹음 완료 (webm ${Math.round(blob.size / 1024)}KB)`);
        const wavBlob = await convertToWav(blob);
        logSttDebug(`WAV 변환 완료 (${Math.round(wavBlob.size / 1024)}KB)`);
        const b64 = await blobToBase64(wavBlob);
        setState('thinking', '말을 글로 옮기는 중…');
        let line = '';
        try {
          line = (await transcribeWavToText(b64)).trim();
        } catch (err) {
          logSttDebug(`전사 실패: ${err?.message || 'unknown error'}`);
          line = '';
        }
        if (line) logSttDebug(`전사 성공: "${line}"`);
        else logSttDebug('전사 결과가 비어있어 오디오 직접 전송으로 fallback');
        if (line && tryRouteToolIntent(line)) return;
        if (line && socialOverlay?.classList.contains('show') && socialState?.active) {
          await handleRpSendWithText(line);
          return;
        }
        if (line) {
          if (typeof isAnyToolOverlayOpen === 'function' && isAnyToolOverlayOpen()) {
            closeAllToolOverlays();
          }
          await sendToKanana({ text: line, speakResponse: true });
        } else {
          if (socialOverlay?.classList.contains('show') && socialState?.active) {
            addRpMsg('system', '음성을 글로 바꾸지 못했어요. 다시 말해줘.');
            return;
          }
          setState(null);
          hideStatus();
          addMessage('음성을 글로 바꾸지 못했어요. 다시 말하거나 텍스트로 입력해주세요.', 'bot');
        }
      } catch (err) {
        hideStatus();
        setState('', '');
        alert('음성 처리 오류: ' + err.message);
      }
    };
    mediaRecorder.start();
    isRecording = true;
    micBtn.classList.add('recording');
    setState('listening', '듣고 있어요... 🎧');
  } catch (e) { alert('마이크 권한이 필요해요: ' + e.message); }
});

/* WAV 변환 */
async function convertToWav(webmBlob) {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
  const buf = await ctx.decodeAudioData(arrayBuffer);
  return new Blob([encodeWAV(buf.getChannelData(0), SAMPLE_RATE)], { type: 'audio/wav' });
}
function encodeWAV(samples, sr) {
  const b = new ArrayBuffer(44 + samples.length*2);
  const v = new DataView(b);
  const ws = (o,s)=>{ for (let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4, 36+samples.length*2, true);
  ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true);
  v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true);
  v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  ws(36,'data'); v.setUint32(40, samples.length*2, true);
  let o=44;
  for (let i=0;i<samples.length;i++,o+=2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(o, s<0?s*0x8000:s*0x7FFF, true);
  }
  return b;
}
function blobToBase64(blob) {
  return new Promise((r,j)=>{ const f=new FileReader(); f.onload=()=>r(f.result.split(',')[1]); f.onerror=j; f.readAsDataURL(blob); });
}

/** 비스트리밍 응답 message.content 파싱 */
function extractAssistantMessageText(msg) {
  if (!msg) return '';
  const c = msg.content;
  if (typeof c === 'string') return c.trim();
  if (Array.isArray(c)) {
    return c.map(p => {
      if (typeof p === 'string') return p;
      if (p?.type === 'text' && p.text) return p.text;
      return '';
    }).join('').trim();
  }
  return String(c ?? '').trim();
}

/** WAV 음성을 한 줄 텍스트로 전사 (OpenAI Whisper) */
async function transcribeWavToText(b64) {
  if (demoMode) throw new Error('시연 모드에서는 음성 입력을 사용할 수 없어요');
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API Key가 필요해요');
  if (!b64 || b64.length < 200) throw new Error('오디오 데이터가 너무 짧아요');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), 'audio.wav');
  form.append('model', 'whisper-1');
  form.append('language', 'ko');
  const res = await fetch(TRANSCRIBE_URL, {
    method: 'POST',
    headers: buildApiHeaders(false),
    body: form,
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  let txt = String(j.text || '').trim();
  txt = txt.replace(/^[\s"'「]+|[\s"'」]+$/g, '').trim();
  return txt;
}

/* 텍스트 전송 */
sendBtn.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (!text) return;
  textInput.value = '';
  if (tryRouteToolIntent(text)) return;
  // 롤플레이 진행 중이면 도구 창을 유지하고 RP로 보냄
  if (socialOverlay?.classList.contains('show') && socialState?.active) {
    handleRpSendWithText(text);
    return;
  }
  // 도구 창이 떠 있으면 일반 채팅 전에 닫아 메인 대화로 전환
  if (typeof isAnyToolOverlayOpen === 'function' && isAnyToolOverlayOpen()) {
    closeAllToolOverlays();
  }
  sendToKanana({ text });
});
textInput.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  sendBtn.click();
});

/* PC 홈페이지 스테이지 ↔ 스카이 연동 */
function scrollStageSection(id) {
  const el = document.getElementById(id);
  const scroller = document.getElementById('stageScroll');
  if (!el || !scroller) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.top-slim-nav button').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-stage-nav') === id);
  });
}

function askSkyFromStage(text) {
  const raw = String(text || '').trim();
  if (!raw) return;
  textInput?.focus();
  if (textInput) textInput.value = raw;
  sendBtn?.click();
}

document.querySelectorAll('[data-stage-nav]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-stage-nav');
    if (id) scrollStageSection(id);
  });
});

document.querySelectorAll('[data-ask-sky]').forEach((btn) => {
  btn.addEventListener('click', () => {
    askSkyFromStage(btn.getAttribute('data-ask-sky'));
  });
});

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
    e.preventDefault();
    textInput?.focus();
  }
});

/* PC 인덱스 스크롤스파이 — 현재 보이는 섹션에 맞춰 상단 nav 활성 표시 자동 갱신 */
(function initStageScrollSpy() {
  const scroller = document.getElementById('stageScroll');
  const sections = Array.from(document.querySelectorAll('.stage-section[id]'));
  const navButtons = Array.from(document.querySelectorAll('.top-slim-nav button[data-stage-nav]'));
  if (!scroller || !sections.length || !navButtons.length) return;

  const setActiveNav = (id) => {
    navButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-stage-nav') === id);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]?.target?.id) setActiveNav(visible[0].target.id);
  }, {
    root: scroller,
    rootMargin: '-10% 0px -70% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });

  sections.forEach((sec) => observer.observe(sec));
})();

/** 스트리밍 delta.content: 누적 전체 / 토큰 단위 증분 / 동일 문장 반복이 섞여도 한 번만 반영 */
function appendStreamDelta(full, chunk) {
  if (!chunk) return full;
  if (!full) return chunk;
  if (chunk === full) return full;
  if (chunk.startsWith(full)) return chunk;
  // 이미 긴 누적본이 있는데 짧은 접두만 다시 오는 경우(백스텝·재전송) → 긴 쪽 유지
  if (full.length > chunk.length && full.startsWith(chunk)) return full;
  // 증분만 올 때 이전 끝과 겹치는 접두를 한 번만 유지 (예: full "안녕" + chunk "녕세요" → "안녕세요", "녕" 단독 중복만 올 때 → "안녕")
  const maxOverlap = Math.min(full.length, chunk.length);
  for (let k = maxOverlap; k >= 1; k--) {
    if (full.slice(-k) === chunk.slice(0, k)) return full + chunk.slice(k);
  }
  return full + chunk;
}

/**
 * 전체 답변이 2번 이상 반복되는 경우 제거.
 * 예: "안녕 민지야!안녕 민지야!" → "안녕 민지야!"
 * 예: "ABCABCAB" (ABC가 2.67회) → "ABC"
 * 모델이 가끔 같은 답을 반복해서보낼 때 방어선.
 */
function removeConsecutiveRepeat(s) {
  if (!s) return s;
  const n = s.length;
  if (n < 20) return s;
  // 가장 큰 반복 주기부터 작은 주기까지 검사
  for (let len = Math.floor(n / 2); len >= 10; len--) {
    const head = s.slice(0, len);
    let pos = len, ok = true;
    while (pos + len <= n) {
      if (s.slice(pos, pos + len) !== head) { ok = false; break; }
      pos += len;
    }
    if (ok && (pos === n || head.startsWith(s.slice(pos)))) {
      return head;
    }
  }
  return s;
}

/* GPT-5.4 mini 호출 */
async function sendToKanana({ text, speakResponse = false }) {
  if (!ensureApiReady()) return;
  if (!text) return;

  addMessage(text, 'user');

  setState('thinking', '생각 중이야 🤔');

  const body = {
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: `You are Sky, AI companion by AI41 (AI FOR ONE) for neurodivergent people and families. CEO Seobokyung, CPO Hanseung Kwak; your name Sky comes from the CPO nickname. Support tool only — not diagnosis or treatment. Reply in ${getLangChatName()}, warm, 1-2 short sentences, no emojis/emoticons.

Tools exist in this app and open automatically when the user asks clearly. Prefer guiding them to tools instead of long advice:
- Tarot: say they can ask for tarot / 타로
- Social practice: 사회성 연습 / social practice
- Sensory / meltdown / anxiety coping: 감각과민·행동 조절 / regulation
- Routines, picture talk, mini-games: suggest those words or the + menu
Only for institutional adoption / PoC / partnership / email contact forms: tell them to say adoption inquiry (도입 문의). Do NOT turn every chat into an intake form. Do not write mailto or URLs. Language switch: ask them to tap KO/EN/JA/ZH/FR or say switch language.` },
      { role: 'user', content: text }
    ],
    stream: true,
    max_completion_tokens: MAX_OUTPUT_TOKENS.chat,
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: buildApiHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    setState('speaking', '💬');
    const botDiv = addMessage('', 'bot');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          const d = j.choices?.[0]?.delta;
          if (!d) continue;
          if (typeof d.content === 'string' && d.content) {
            full = appendStreamDelta(full, d.content);
            botDiv.textContent = full;
          }
        } catch {}
      }
    }

    const deduped = removeConsecutiveRepeat(full);
    if (deduped !== full) { full = deduped; botDiv.textContent = full; }

    if (speakResponse && full && !demoMode) speakKorean(full);
    setState(null);
    hideStatus();
  } catch (err) {
    console.error(err);
    setState(null, '앗, 오류가 났어 😿 (CORS일 수 있어요. server.py 실행해주세요)', 4000);
    addMessage('오류: ' + err.message, 'bot');
  }
}

function mergePcmWavs(b64s) {
  const bufs = b64s.map(b => {
    const bin = atob(b), u = new Uint8Array(bin.length);
    for (let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
    return u;
  });
  const total = bufs.reduce((s,b)=>s+b.length, 0);
  const pcm = new Uint8Array(total);
  let o = 0; for (const b of bufs) { pcm.set(b,o); o+=b.length; }
  const h = new ArrayBuffer(44), v = new DataView(h);
  const ws = (o,s)=>{ for (let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4, 36+pcm.length, true);
  ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true);
  v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,SAMPLE_RATE,true);
  v.setUint32(28,SAMPLE_RATE*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true);
  ws(36,'data'); v.setUint32(40,pcm.length,true);
  const out = new Uint8Array(44+pcm.length);
  out.set(new Uint8Array(h),0); out.set(pcm,44);
  return out;
}
