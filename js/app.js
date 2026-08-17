/* ============================================================
   🚀 초기화
============================================================ */
initLanguageSystem();
loadRegulationLog();
loadRoutines();
initPicturePhrases();
initRegStateGrid();
renderRegulationLog();
renderRoutines();
seedBubbleGame();
initCircleGame();
initPatternGame();
initSortGame();
initRhythmGame();
initDifferenceGame();
initLoopGame();
initSafeClickGame();
initEmotionGame();
initPrivacySystem();
initDemoMode();
if (new URLSearchParams(location.search).get('open') === 'utils' && typeof openUtils === 'function') {
  openUtils();
}
