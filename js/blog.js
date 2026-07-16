/* ============================================================
   Blog — homepage cards + overlay reader
============================================================ */
const BLOG_PAGE_SIZE = 3;
let blogPage = 1;
let blogPages = 0;

function blogEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function blogBodyHtml(text) {
  return blogEscape(text).replace(/\n/g, '<br>');
}

async function fetchBlogPage(page) {
  const res = await fetch(`/api/blog/posts?page=${page}&limit=${BLOG_PAGE_SIZE}`);
  if (!res.ok) throw new Error('blog list failed');
  return res.json();
}

function renderBlogCards(items) {
  const root = document.getElementById('blogCards');
  const empty = document.getElementById('blogEmpty');
  if (!root) return;
  root.innerHTML = '';
  if (!items || !items.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  for (const post of items) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'blog-card';
    btn.dataset.slug = post.slug;
    const thumb = post.thumbnail_url || '/logo.png';
    btn.innerHTML = `<img src="${blogEscape(thumb)}" alt="" loading="lazy" /><h3>${blogEscape(post.title)}</h3>`;
    btn.addEventListener('click', () => openBlogPost(post.slug));
    root.appendChild(btn);
  }
}

function updateBlogPager() {
  const prev = document.getElementById('blogPrev');
  const next = document.getElementById('blogNext');
  const hint = document.getElementById('blogPageHint');
  if (prev) prev.disabled = blogPage <= 1;
  if (next) next.disabled = !blogPages || blogPage >= blogPages;
  if (hint) {
    hint.textContent = blogPages
      ? `${blogPage} / ${blogPages}`
      : '';
  }
}

async function loadBlogPage(page) {
  try {
    const data = await fetchBlogPage(page);
    blogPage = data.page || page;
    blogPages = data.pages || 0;
    renderBlogCards(data.items || []);
    updateBlogPager();
  } catch (e) {
    console.warn('[blog]', e);
    renderBlogCards([]);
    blogPages = 0;
    updateBlogPager();
    const empty = document.getElementById('blogEmpty');
    if (empty) empty.hidden = false;
  }
}

async function openBlogPost(slug) {
  try {
    const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!res.ok || !data.post) throw new Error(data.error || 'not found');
    const post = data.post;
    const titleEl = document.getElementById('blogArticleTitle');
    const bodyEl = document.getElementById('blogArticleBody');
    const thumbEl = document.getElementById('blogArticleThumb');
    const subEl = document.getElementById('blogOverlaySub');
    if (titleEl) titleEl.textContent = post.title || '';
    if (bodyEl) bodyEl.innerHTML = blogBodyHtml(post.body || post.summary || '');
    if (subEl) subEl.textContent = post.summary || '';
    if (thumbEl) {
      if (post.thumbnail_url) {
        thumbEl.src = post.thumbnail_url;
        thumbEl.hidden = false;
      } else {
        thumbEl.hidden = true;
      }
    }
    const overlay = document.getElementById('blogOverlay');
    if (typeof showOnlyOverlay === 'function') showOnlyOverlay(overlay);
    else overlay?.classList.add('show');
  } catch (e) {
    console.warn('[blog] open', e);
    if (typeof addMessage === 'function') {
      addMessage(typeof t === 'function' ? t('blog.openFail') : '글을 불러오지 못했어요.', 'bot');
    }
  }
}

function closeBlogOverlay() {
  document.getElementById('blogOverlay')?.classList.remove('show');
}

function initBlog() {
  document.getElementById('blogPrev')?.addEventListener('click', () => {
    if (blogPage > 1) loadBlogPage(blogPage - 1);
  });
  document.getElementById('blogNext')?.addEventListener('click', () => {
    if (blogPage < blogPages) loadBlogPage(blogPage + 1);
  });
  document.getElementById('blogClose')?.addEventListener('click', closeBlogOverlay);
  loadBlogPage(1);
}

document.addEventListener('DOMContentLoaded', initBlog);
