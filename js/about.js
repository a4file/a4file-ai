/* ============================================================
   ℹ️ AI41 소개 오버레이
============================================================ */
function openAbout(section) {
  showOnlyOverlay(aboutOverlay);
  logPrivacyActivity('about_open', section || '');
  const targetId = section === 'sky' ? 'aboutSky' : 'aboutAi41';
  requestAnimationFrame(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function closeAbout() {
  aboutOverlay?.classList.remove('show');
}

aboutClose?.addEventListener('click', closeAbout);
