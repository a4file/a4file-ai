const ADMIN_TOKEN_KEY = 'ai41.adminToken';

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

function setToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function showErr(el, msg) {
  if (!el) return;
  if (!msg) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = msg;
}

async function api(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  const token = getToken();
  if (token) headers['X-Admin-Token'] = token;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function showDash(on) {
  document.getElementById('loginPanel').hidden = on;
  document.getElementById('dashPanel').hidden = !on;
}

async function login() {
  const pin = document.getElementById('adminPin').value;
  const err = document.getElementById('loginErr');
  try {
    const data = await api('/api/blog/admin/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
    setToken(data.token);
    showErr(err, '');
    showDash(true);
    await refreshList();
  } catch (e) {
    showErr(err, e.message || String(e));
  }
}

function logout() {
  setToken('');
  showDash(false);
  document.getElementById('postForm').hidden = true;
}

async function refreshList() {
  const data = await api('/api/blog/admin/posts');
  const list = document.getElementById('postList');
  list.innerHTML = '';
  for (const post of data.items || []) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `${escapeHtml(post.title)}<span class="meta">${escapeHtml(post.status)} · ${escapeHtml(post.slug)}</span>`;
    btn.addEventListener('click', () => editPost(post.id));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resetForm(isNew) {
  document.getElementById('postForm').hidden = false;
  document.getElementById('formTitle').textContent = isNew ? '새 글' : '글 편집';
  document.getElementById('postId').value = '';
  document.getElementById('fTitle').value = '';
  document.getElementById('fSlug').value = '';
  document.getElementById('fSummary').value = '';
  document.getElementById('fThumb').value = '/logo.png';
  document.getElementById('fStatus').value = 'draft';
  document.getElementById('fBody').value = '';
  showErr(document.getElementById('formErr'), '');
}

async function editPost(id) {
  const data = await api(`/api/blog/admin/posts/${encodeURIComponent(id)}`);
  const post = data.post;
  document.getElementById('postForm').hidden = false;
  document.getElementById('formTitle').textContent = '글 편집';
  document.getElementById('postId').value = post.id;
  document.getElementById('fTitle').value = post.title || '';
  document.getElementById('fSlug').value = post.slug || '';
  document.getElementById('fSummary').value = post.summary || '';
  document.getElementById('fThumb').value = post.thumbnail_url || '';
  document.getElementById('fStatus').value = post.status || 'draft';
  document.getElementById('fBody').value = post.body || '';
  showErr(document.getElementById('formErr'), '');
}

function formPayload() {
  return {
    title: document.getElementById('fTitle').value.trim(),
    slug: document.getElementById('fSlug').value.trim(),
    summary: document.getElementById('fSummary').value.trim(),
    thumbnail_url: document.getElementById('fThumb').value.trim(),
    status: document.getElementById('fStatus').value,
    body: document.getElementById('fBody').value,
  };
}

async function savePost(ev) {
  ev.preventDefault();
  const err = document.getElementById('formErr');
  const id = document.getElementById('postId').value;
  const payload = formPayload();
  try {
    if (id) {
      await api(`/api/blog/admin/posts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await api('/api/blog/admin/posts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    showErr(err, '');
    await refreshList();
    document.getElementById('postForm').hidden = true;
  } catch (e) {
    showErr(err, e.message || String(e));
  }
}

async function deletePost() {
  const id = document.getElementById('postId').value;
  if (!id) return;
  if (!confirm('이 글을 삭제할까요?')) return;
  try {
    await api(`/api/blog/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    document.getElementById('postForm').hidden = true;
    await refreshList();
  } catch (e) {
    showErr(document.getElementById('formErr'), e.message || String(e));
  }
}

document.getElementById('loginBtn')?.addEventListener('click', login);
document.getElementById('adminPin')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('refreshBtn')?.addEventListener('click', () => refreshList().catch((e) => alert(e.message)));
document.getElementById('newPostBtn')?.addEventListener('click', () => resetForm(true));
document.getElementById('cancelBtn')?.addEventListener('click', () => {
  document.getElementById('postForm').hidden = true;
});
document.getElementById('deleteBtn')?.addEventListener('click', deletePost);
document.getElementById('postForm')?.addEventListener('submit', savePost);

(async function boot() {
  if (!getToken()) return;
  try {
    await refreshList();
    showDash(true);
  } catch (_) {
    logout();
  }
})();
