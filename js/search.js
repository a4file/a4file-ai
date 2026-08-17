/* 구글은 /api/search(JSON API), 네이버는 공식 검색 페이지. */

function searchUrl(engine, q) {
  const query = encodeURIComponent(q);
  if (engine === 'naver') return `https://search.naver.com/search.naver?query=${query}`;
  return `https://www.google.com/search?q=${query}`;
}

function extractSearchQuery(raw) {
  return String(raw || '')
    .replace(/(구글|네이버|google|naver|검색해\s*줘|검색해줘|검색하자|검색해|검색|찾아줘|찾아|search|웹에서|인터넷에서)/gi, ' ')
    .replace(/(에서|으로|로)\s*$/g, ' ')
    .replace(/[?？!！.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function openSearch(engine, preset) {
  showOnlyOverlay(searchOverlay);
  if (preset && searchQuery) searchQuery.value = preset;
  requestAnimationFrame(() => searchQuery?.focus());
  if (engine === 'google' || engine === 'naver') {
    searchForm?.setAttribute('data-engine', engine);
  } else {
    searchForm?.removeAttribute('data-engine');
  }
}

function closeSearch() {
  searchOverlay?.classList.remove('show');
}

function renderSearchResults(data) {
  if (!searchResults) return;
  const items = data.items || [];
  if (!items.length) {
    searchResults.hidden = true;
    searchResults.innerHTML = '';
    return;
  }
  searchResults.hidden = false;
  searchResults.innerHTML = items.map((it) => {
    const title = escapeHtml(it.title || it.url);
    const snippet = escapeHtml(it.snippet || '');
    const source = escapeHtml(it.source || '');
    const url = String(it.url || '');
    return `<a class="search-hit" href="${url}" target="_blank" rel="noopener noreferrer">
      <strong>${title}</strong>
      <span class="search-hit-src">${source}</span>
      <span class="search-hit-sn">${snippet}</span>
    </a>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function executeCseWidget(q) {
  const run = () => {
    const el = window.google?.search?.cse?.element?.getElement?.('skysearch');
    if (!el) return false;
    el.execute(q);
    return true;
  };
  if (run()) return Promise.resolve(true);
  return new Promise((resolve) => {
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      if (run()) {
        clearInterval(timer);
        resolve(true);
      } else if (n > 40) {
        clearInterval(timer);
        resolve(false);
      }
    }, 150);
  });
}

async function runWebSearch(engine, q) {
  const query = String(q || '').trim();
  if (!query) {
    openSearch(engine);
    addMessage(
      typeof t === 'function' ? t('search.needQuery') : '찾을 말을 적어 주세요. 예: 「구글에서 신경다양성 검색」',
      'bot'
    );
    return;
  }
  openSearch(engine, query);
  if (engine === 'naver') {
    const url = searchUrl('naver', query);
    addBotMessageWithLink(`네이버에서 「${query}」를 찾아볼게요.`, '네이버에서 열기', url);
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    const res = await fetch(`/api/search?engine=google&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (res.ok && data.ok && data.configured && (data.items || []).length) {
      renderSearchResults(data);
      const first = data.items[0];
      addBotMessageWithLink(
        `구글에서 「${query}」 ${data.items.length}건을 찾았어요. 예: ${first.title}`,
        '구글에서 더 보기',
        data.fallback_url || searchUrl('google', query)
      );
      return;
    }
  } catch (_) {}
  renderSearchResults({ items: [] });
  const ok = await executeCseWidget(query);
  const url = searchUrl('google', query);
  if (ok) {
    addBotMessageWithLink(`구글에서 「${query}」를 찾았어요.`, '구글에서 더 보기', url);
    return;
  }
  addBotMessageWithLink(`검색창에서 열어 볼게요.`, '구글에서 열기', url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function handleSearchIntent(mode, userText) {
  const engine = mode === 'search-naver' ? 'naver' : mode === 'search-google' ? 'google' : '';
  const q = extractSearchQuery(userText);
  if (!engine && !q) {
    openSearch();
    return;
  }
  if (!q) {
    openSearch(engine);
    return;
  }
  runWebSearch(engine || 'google', q);
}

searchClose?.addEventListener('click', closeSearch);

searchForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.submitter;
  const engine = btn?.getAttribute?.('data-engine')
    || searchForm.getAttribute('data-engine')
    || 'google';
  runWebSearch(engine, searchQuery?.value);
});
