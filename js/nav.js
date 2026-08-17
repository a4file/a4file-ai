/* 대주제 메뉴: 클릭으로 열고, 현재 페이지·섹션을 표시한다. */

function closeNavGroups(except) {
  document.querySelectorAll('.nav-group.is-open').forEach((g) => {
    if (g !== except) {
      g.classList.remove('is-open');
      g.querySelector('.nav-parent')?.setAttribute('aria-expanded', 'false');
    }
  });
}

function markNavGroupCurrent(group) {
  document.querySelectorAll('.nav-group').forEach((g) => {
    const on = g === group;
    g.classList.toggle('is-current', on);
  });
}

function setActiveStageNav(id) {
  document.querySelectorAll('[data-stage-nav]').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-stage-nav') === id);
  });
  const group = document.querySelector(`.nav-group [data-stage-nav="${id}"]`)?.closest('.nav-group');
  if (group) markNavGroupCurrent(group);
}

function markPageNavCurrent() {
  const path = (location.pathname.replace(/\/index\.html$/, '') || '/').replace(/\/$/, '') || '/';
  let current = null;
  document.querySelectorAll('.nav-sub a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('/#')) {
      a.classList.remove('active');
      return;
    }
    const clean = href.replace(/\/$/, '') || '/';
    const on = clean === path;
    a.classList.toggle('active', on);
    if (on) current = a.closest('.nav-group');
  });
  if (current) markNavGroupCurrent(current);
}

document.querySelectorAll('.nav-parent').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const group = btn.closest('.nav-group');
    const open = !group.classList.contains('is-open');
    closeNavGroups(open ? group : null);
    group.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

document.addEventListener('click', () => closeNavGroups());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeNavGroups();
});

document.querySelectorAll('.nav-sub [data-stage-nav]').forEach((el) => {
  el.addEventListener('click', () => closeNavGroups());
});

if (!document.getElementById('stageScroll')) markPageNavCurrent();
