/*
 * DOM 배선 — 계산은 전부 calc-core.js의 순수 함수에 위임한다.
 * 규격: 지침서 5.5(접근성), 5.7(계산 트리거·포맷팅·에러 타이밍·공유), 6.9(상태 디자인)
 */
'use strict';
(function () {
  const C = window.CalcCore || (typeof CalcCore !== 'undefined' ? CalcCore : null);
  const form = document.querySelector('form[data-calc]');
  if (!C || !form) return;

  const $ = (id) => document.getElementById(id);
  const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* blur 시점 인라인 검증 (5.7.4) */
  function validateField(input) {
    const field = input.closest('.field');
    if (!field) return true;
    const err = field.querySelector('.error-text');
    const min = input.getAttribute('data-min');
    const max = input.getAttribute('data-max');
    let v = parseFloat(input.value);
    let msg = '';
    if (input.required && (input.value === '' || isNaN(v))) {
      msg = input.getAttribute('data-msg-required') || '값을 입력해 주세요';
    } else if (min !== null && v < Number(min)) {
      msg = input.getAttribute('data-msg-range') || `${Number(min).toLocaleString('ko-KR')} 이상으로 입력해 주세요`;
    } else if (max !== null && v > Number(max)) {
      msg = input.getAttribute('data-msg-range') || `${Number(max).toLocaleString('ko-KR')} 이하로 입력해 주세요`;
    }
    if (msg) {
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
      return false;
    }
    field.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    return true;
  }
  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
  });

  function readNum(name, fallback) {
    const input = form.elements[name];
    if (!input) return fallback;
    const v = parseFloat(input.value);
    return isNaN(v) ? fallback : v;
  }

  /* 결과 갱신 인지 플래시 + stale 해제 (6.9) */
  const resultCard = document.querySelector('.result-card');
  function markFresh() {
    if (!resultCard) return;
    resultCard.classList.remove('stale');
    const main = resultCard.querySelector('.result-main');
    if (main) { main.classList.remove('flash'); void main.offsetWidth; main.classList.add('flash'); }
  }
  function markStale() { if (resultCard) resultCard.classList.add('stale'); }

  function setWarning(msg) {
    const el = resultCard && resultCard.querySelector('.result-warning');
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'inline-block' : 'none';
  }

  /* 결과 링크 복사 / 내역 복사 (5.7.6) */
  function copyText(text, btn) {
    const done = () => {
      const orig = btn.textContent;
      btn.textContent = '복사됨';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }
  const shareBtn = $('btn-share');
  if (shareBtn) shareBtn.addEventListener('click', () => {
    const params = new URLSearchParams();
    form.querySelectorAll('input, select').forEach((el) => {
      if (!el.name) return;
      if (el.type === 'checkbox') { params.set(el.name, el.checked ? '1' : '0'); return; }
      if (el.type === 'radio') { if (el.checked) params.set(el.name, el.value); return; }
      if (el.value !== '') params.set(el.name, el.value);
    });
    copyText(location.origin + location.pathname + '?' + params.toString(), shareBtn);
  });
  const copyBtn = $('btn-copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const txt = resultCard ? resultCard.innerText.replace(/\n{3,}/g, '\n\n') : '';
    copyText(txt.trim(), copyBtn);
  });

  /* URL 파라미터 복원 (5.7.6) */
  (function restore() {
    const params = new URLSearchParams(location.search);
    if ([...params.keys()].length === 0) return;
    params.forEach((val, key) => {
      const el = form.elements[key];
      if (!el) return;
      if (el.type === 'checkbox') { el.checked = val === '1'; return; }
      if (el instanceof RadioNodeList || el.type === 'radio') { try { el.value = val; } catch (e) {} return; }
      el.value = val;
    });
  })();

  /* 원점회귀(왕복) 체크 — 하강고도를 상승고도와 동기화 (5장 함수 UI 배선) */
  const roundtripEl = $('roundtrip');
  const ascentEl = form.elements['ascent'];
  const descentEl = form.elements['descent'];
  function syncDescent() {
    if (!roundtripEl || !ascentEl || !descentEl) return;
    descentEl.disabled = roundtripEl.checked;
    if (roundtripEl.checked) descentEl.value = ascentEl.value;
  }
  if (roundtripEl) {
    roundtripEl.addEventListener('change', () => { syncDescent(); run(); });
    ascentEl.addEventListener('input', () => { if (roundtripEl.checked) { descentEl.value = ascentEl.value; } });
  }

  /* ---------- 페이지별 계산 ---------- */
  const RENDER = {
    /* 등산 소요시간 계산기 — 자동 재계산 */
    'hiking-time': function () {
      const distance = readNum('distance', NaN);
      const ascent = readNum('ascent', NaN);
      const descent = readNum('descent', NaN);
      const pack = readNum('pack', 0);
      const fitnessInput = form.elements['fitness'];
      const fitness = fitnessInput ? fitnessInput.value : 'normal';
      if (!(distance > 0) || isNaN(ascent) || isNaN(descent)) return false;

      let r;
      try { r = C.estimateHikingTime(distance, ascent, descent, fitness, pack); }
      catch (e) { return false; }

      setText('r-main', r.pace);
      setText('r-context', '이동시간 ' + (r.baseMinutes + r.climbMinutes + r.descentMinutes + r.packPenaltyMinutes)
        + '분 + 휴식시간 ' + r.restMinutes + '분을 더한 값입니다.');
      setText('d-base', r.baseMinutes + '분');
      setText('d-climb', r.climbMinutes + '분');
      setText('d-descent', r.descentMinutes + '분');
      setText('d-pack', r.packPenaltyMinutes + '분');
      setText('d-rest', r.restMinutes + '분');
      setText('d-total', r.totalMinutes + '분');
      setWarning(distance > 20 ? '거리가 20km를 넘는 장거리 코스입니다 — 중간 대피소·물 보급 계획을 확인하세요' : '');
      return true;
    },
  };

  const type = form.dataset.calc;
  const render = RENDER[type];
  if (!render) return;

  syncDescent();

  let hasRendered = false;
  function run() {
    let ok = false;
    try { ok = render(); } catch (e) { ok = false; }
    if (ok) { hasRendered = true; markFresh(); }
    else if (hasRendered) { markStale(); }
  }

  if (form.dataset.auto === 'true') {
    /* 자동 재계산: 300ms 디바운스 (5.7.1) */
    const debounced = debounce(run, 300);
    form.addEventListener('input', debounced);
    form.addEventListener('change', debounced);
  } else {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input[required]:not(:disabled)').forEach((i) => { if (!validateField(i)) valid = false; });
      if (!valid) return;
      run();
      if (resultCard && window.matchMedia('(max-width: 767px)').matches) {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /* 초기 1회 계산 — 프리필 기본값의 예시 결과 표시 (5.7.2, 6.9 초기 상태) */
  run();
})();
