/* ============================================================
   ℹ️ AI41 소개 / 스카이 소개 — 창을 따로 연다
============================================================ */
function openAbout(section) {
  const el = section === 'sky' ? aboutSkyOverlay : aboutAi41Overlay;
  showOnlyOverlay(el);
  logPrivacyActivity('about_open', section === 'sky' ? 'sky' : 'ai41');
}

function closeAbout() {
  aboutAi41Overlay?.classList.remove('show');
  aboutSkyOverlay?.classList.remove('show');
}

aboutAi41Close?.addEventListener('click', closeAbout);
aboutSkyClose?.addEventListener('click', closeAbout);
