/*
 * 정렬 가능 테이블 — <table class="sortable"> 안의 <thead> th 클릭으로 오름차순/내림차순 토글.
 * 셀 값은 comma 제거 후 "N시간 M분" 패턴을 분 단위로 환산, 그 외엔 첫 숫자를 추출해 비교한다.
 * 숫자로 해석 불가한 값(예: "확인필요")은 정렬 방향과 무관하게 항상 뒤로 보낸다.
 */
'use strict';
(function () {
  var DIFFICULTY_RANK = { '쉬움': 0, '보통': 1, '어려움': 2, '확인필요': 3 };
  var SOURCE_RANK = { '국립공원공단': 0, '지자체공식': 1, '한국관광공사': 2, '두루누비': 3, '블로그': 4 };

  function parseApproxNumber(text) {
    var t = text.replace(/,/g, '');
    var h = t.match(/(\d+(?:\.\d+)?)\s*시간/);
    var m = t.match(/(\d+(?:\.\d+)?)\s*분/);
    if (h || m) return (h ? parseFloat(h[1]) : 0) * 60 + (m ? parseFloat(m[1]) : 0);
    var plain = t.match(/-?\d+(?:\.\d+)?/);
    return plain ? parseFloat(plain[0]) : null;
  }

  function sortValue(td) {
    var text = (td.textContent || '').trim();
    if (Object.prototype.hasOwnProperty.call(DIFFICULTY_RANK, text)) return { num: DIFFICULTY_RANK[text], str: text };
    if (Object.prototype.hasOwnProperty.call(SOURCE_RANK, text)) return { num: SOURCE_RANK[text], str: text };
    return { num: parseApproxNumber(text), str: text };
  }

  function compare(tdA, tdB, dir) {
    var a = sortValue(tdA), b = sortValue(tdB);
    if (a.num === null && b.num === null) return dir * a.str.localeCompare(b.str, 'ko');
    if (a.num === null) return 1;
    if (b.num === null) return -1;
    if (a.num !== b.num) return dir * (a.num - b.num);
    return dir * a.str.localeCompare(b.str, 'ko');
  }

  document.querySelectorAll('table.sortable').forEach(function (table) {
    var thead = table.tHead;
    var tbody = table.tBodies[0];
    if (!thead || !tbody) return;
    var ths = Array.prototype.slice.call(thead.querySelectorAll('th'));

    ths.forEach(function (th, colIndex) {
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'button');
      var arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = '↕';
      arrow.setAttribute('aria-hidden', 'true');
      th.appendChild(arrow);

      function sort() {
        var dir = th.getAttribute('aria-sort') === 'ascending' ? -1 : 1;
        ths.forEach(function (other) {
          other.removeAttribute('aria-sort');
          var a = other.querySelector('.sort-arrow');
          if (a) a.textContent = '↕';
        });
        th.setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');
        arrow.textContent = dir === 1 ? '▲' : '▼';

        var rows = Array.prototype.slice.call(tbody.rows);
        rows.sort(function (r1, r2) { return compare(r1.cells[colIndex], r2.cells[colIndex], dir); });
        rows.forEach(function (row) { tbody.appendChild(row); });
      }

      th.addEventListener('click', sort);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); }
      });
    });
  });
})();
