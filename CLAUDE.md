# 산타임 (santime)

이 저장소는 `functional-site-builder` 스킬(사용자 전역, `~/.claude/skills/functional-site-builder/`)의 방법론을 따르는 계산기형 사이트다. **작업 전 관련 있는 스킬 세부 파일을 먼저 참고할 것** — 예: CSS 작업은 `04-design-system.md`, 계산 로직은 `03-implementation.md`, 배포는 `09-multisite-deploy.md`.

## 이 사이트만의 사실
- **클러스터**: B(주제리서치_국내_20260709.csv) 1위 — 등산 코스 소요시간 계산기
- **컨셉**: (1) 나이스미스의 법칙 기반 소요시간 계산기 + (2) 전국 시도별 대표 등산 코스 ~100개 실제 데이터베이스(국립공원공단·지자체·한국관광공사·두루누비 우선 조사, 최후 수단으로만 블로그 인용 후 출처 등급 명시)
- **GitHub 저장소**: `echochip84/santime` (public) — https://github.com/echochip84/santime
- **도메인**: 미구매, `__DOMAIN__` 플레이스홀더 상태 (구매 후 일괄 치환 필요)
- **애드센스**: 기존 승인 계정 재사용 예정, pub-9763908781879859 (ads.txt에 이미 배치됨)
- **배포 상태**: 로컬 커밋·GitHub push 완료(master 브랜치), **Cloudflare 배포는 아직 보류**(사용자 명시 요청 대기)
- **테스트**: `cd site && node --test tests/calculator.test.js` — 18건 전부 통과 확인됨
- **디자인**: wolgeup-note 시스템 그대로 재사용, accent hue만 green/forest(~155)로 변경
- **로컬 미리보기**: `C:\웹페이지\.claude\launch.json`에 "santime"(포트 8789) 설정 추가됨 — 주 작업 디렉터리가 C:\웹페이지이므로 미리보기 도구는 그쪽 launch.json을 읽는다

## 진행 상황
- 계산기 로직(rates.js, calc-core.js) + 단위테스트 18건 + 법적 페이지(privacy/terms/about/contact) + SEO 인프라(robots/sitemap/ads.txt/_headers/llms.txt) 완료
- 전국 7개 권역(수도권17·충청권15·호남17·대구경북13·부산울산경남17·강원12·제주9, 총 100개) 코스 데이터 리서치 완료 → `assets/js/courses-data.js`에 통합 완료 — 국립공원공단·지자체 공식 자료 우선, 확인 불가 항목은 "확인필요"로 정직하게 표기
- 메인 계산기 페이지(`index.html`) + 코스 조회 페이지(`courses/`, 100행 정적 테이블 + JS 필터) 구현 완료, 프리뷰로 계산 결과·필터·검색 동작 검증 완료
- git init/commit/push 완료. 아티클(추가 SEO 콘텐츠)은 미착수 — 필요 시 다음 작업
- 남은 작업: 도메인 구매 후 `__DOMAIN__` 일괄 치환, og-image.png 등 소셜 공유 이미지 제작, 실제 배포는 사용자 요청 시

## 이 사이트만의 예외/특이사항
- 코스 데이터의 출처 신뢰도가 지역마다 다르다(국립공원공단 JS 렌더링으로 인해 일부 수치는 2차 출처로 보완). `courses/` 페이지에서 각 코스의 `source_type`을 반드시 사용자에게 노출해 정보 신뢰도를 투명하게 전달할 것.
