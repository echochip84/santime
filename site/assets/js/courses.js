/*
 * 코스 조회 페이지 필터링 — 정적 HTML 표(크롤러·비JS 환경 대응)를 JS로 점진적 향상.
 * 데이터 재요청 없이 이미 렌더링된 행을 지역/난이도/검색어로 토글한다.
 */
'use strict';
(function () {
  const tbody = document.getElementById('course-tbody');
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const q = document.getElementById('q');
  const regionFilter = document.getElementById('region-filter');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const countEl = document.getElementById('result-count');

  let region = '';
  let difficulty = '';

  function apply() {
    const query = (q && q.value || '').trim().toLowerCase();
    let shown = 0;
    rows.forEach((tr) => {
      const rowRegion = tr.getAttribute('data-region') || '';
      const rowDifficulty = tr.getAttribute('data-difficulty') || '';
      let visible = true;
      if (region && rowRegion !== region) visible = false;
      if (difficulty && rowDifficulty !== difficulty) visible = false;
      if (visible && query) {
        const hay = tr.textContent.toLowerCase();
        if (!hay.includes(query)) visible = false;
      }
      tr.style.display = visible ? '' : 'none';
      if (visible) shown++;
    });
    if (countEl) countEl.textContent = shown + '개 코스 표시 중';
  }

  function bindGroup(container, attr, setter) {
    if (!container) return;
    container.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        setter(btn.getAttribute(attr) || '');
        container.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        apply();
      });
    });
  }

  bindGroup(regionFilter, 'data-region', (v) => { region = v; });
  bindGroup(difficultyFilter, 'data-difficulty', (v) => { difficulty = v; });
  if (q) q.addEventListener('input', apply);
})();
