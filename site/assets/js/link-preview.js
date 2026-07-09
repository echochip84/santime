/*
 * 외부 링크 스플릿 뷰 미리보기 — [data-preview] 링크 클릭 시 새 탭 대신
 * 화면 우측 패널에 iframe으로 미리보기를 띄운다.
 * X-Frame-Options로 iframe 삽입이 막히는 사이트가 있으므로 "새 탭에서 열기"를
 * 패널 상단에 상시 노출한다. JS 실패 시 원래 target="_blank"가 그대로 동작한다.
 *
 * 좌측 콘텐츠는 body의 padding이 아니라 별도 래퍼(#page-shell)의 width를 줄여서
 * 밀어낸다 — <html>/<body>의 padding-right가 일부 브라우저/환경에서 무시되는
 * 현상이 실측 확인됨(반면 width는 모든 환경에서 일관되게 동작). 래퍼 폭이
 * 줄어들면 폭이 넓은 표는 기존 .table-wrap의 overflow-x:auto로 자체 스크롤된다.
 */
'use strict';
(function () {
  var panel = null;

  function ensureShell() {
    var shell = document.getElementById('page-shell');
    if (shell) return shell;
    shell = document.createElement('div');
    shell.id = 'page-shell';
    while (document.body.firstChild) shell.appendChild(document.body.firstChild);
    document.body.appendChild(shell);
    return shell;
  }
  var shell = ensureShell();

  function applyPreviewPush() {
    var w = window.innerWidth;
    var push = w <= 767 ? 0 : Math.min(w * 0.5, 900);
    shell.style.width = (w - push) + 'px';
  }

  function clearPreviewPush() {
    shell.style.width = '';
  }

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
    applyPreviewPush();
    document.documentElement.classList.add('link-preview-active');
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    document.documentElement.classList.remove('link-preview-active');
    clearPreviewPush();
    panel.querySelector('.link-preview-frame').src = 'about:blank';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-preview]');
    if (a) { e.preventDefault(); openPanel(a.href); return; }
    if (panel && panel.classList.contains('open') && !e.target.closest('.link-preview-panel')) {
      closePanel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  window.addEventListener('resize', function () {
    if (panel && panel.classList.contains('open')) applyPreviewPush();
  });
})();
