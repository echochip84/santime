/*
 * 외부 링크 스플릿 뷰 미리보기 — [data-preview] 링크 클릭 시 새 탭 대신
 * 화면 우측 패널에 iframe으로 미리보기를 띄운다.
 * X-Frame-Options로 iframe 삽입이 막히는 사이트가 있으므로 "새 탭에서 열기"를
 * 패널 상단에 상시 노출한다. JS 실패 시 원래 target="_blank"가 그대로 동작한다.
 */
'use strict';
(function () {
  var panel = null;

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'link-preview-panel';
    panel.innerHTML =
      '<div class="link-preview-bar">' +
        '<span class="link-preview-host"></span>' +
        '<a class="link-preview-newtab" href="#" target="_blank" rel="noopener">새 탭에서 열기 ↗</a>' +
        '<button type="button" class="link-preview-close" aria-label="미리보기 닫기">✕</button>' +
      '</div>' +
      '<iframe class="link-preview-frame" title="외부 사이트 미리보기" referrerpolicy="no-referrer"></iframe>';
    document.body.appendChild(panel);
    panel.querySelector('.link-preview-close').addEventListener('click', closePanel);
    return panel;
  }

  function openPanel(url) {
    var p = ensurePanel();
    var host = url;
    try { host = new URL(url).hostname; } catch (e) {}
    p.querySelector('.link-preview-host').textContent = host;
    p.querySelector('.link-preview-newtab').href = url;
    p.querySelector('.link-preview-frame').src = url;
    p.classList.add('open');
    document.body.classList.add('link-preview-active');
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    document.body.classList.remove('link-preview-active');
    panel.querySelector('.link-preview-frame').src = 'about:blank';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-preview]');
    if (!a) return;
    e.preventDefault();
    openPanel(a.href);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });
})();
