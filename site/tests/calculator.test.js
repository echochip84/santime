/*
 * 등산 소요시간 계산 로직 단위 테스트 — 실행: node --test tests/
 * 공식 출처: rates.js 상단 주석 참고(Naismith's Rule 변형 + Tranter's correction 단순화).
 * 기대값은 rates.js의 계수를 그대로 손으로 검산한 값이다.
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../assets/js/calc-core.js');

test('중급자, 6km·상승400m·하강400m·배낭5kg(기준 이하) → 3시간 9분', () => {
  const r = C.estimateHikingTime(6, 400, 400, 'normal', 5);
  assert.equal(r.baseMinutes, 113);   // 6/3.2*60=112.5 반올림
  assert.equal(r.climbMinutes, 40);   // 400/100*10
  assert.equal(r.descentMinutes, 16); // 400/100*4
  assert.equal(r.packPenaltyMinutes, 0); // 기준 5kg 이하라 보정 없음
  assert.equal(r.restMinutes, 20);    // (112.5+40+16)*0.12=20.22
  assert.equal(r.totalMinutes, 189);
  assert.equal(r.totalHours, 3.2);
  assert.equal(r.pace, '3시간 9분');
});

test('초급자, 3km·상승200m·하강200m·배낭12kg(초과 7kg) → 2시간 1분', () => {
  const r = C.estimateHikingTime(3, 200, 200, 'beginner', 12);
  assert.equal(r.baseMinutes, 72);
  assert.equal(r.climbMinutes, 20);
  assert.equal(r.descentMinutes, 8);
  assert.equal(r.packPenaltyMinutes, 8); // (72+20+8)*0.084=8.4 반올림
  assert.equal(r.restMinutes, 13);
  assert.equal(r.totalMinutes, 121);
  assert.equal(r.totalHours, 2.0);
  assert.equal(r.pace, '2시간 1분');
});

test('상급자, 배낭 무게가 기준(5kg)과 정확히 같으면 보정 없음', () => {
  const r = C.estimateHikingTime(10, 0, 0, 'advanced', 5);
  assert.equal(r.packPenaltyMinutes, 0);
  assert.equal(r.baseMinutes, 150); // 10/4*60
});

test('왕복 코스 편의 함수: 상승=하강으로 자동 계산', () => {
  const round = C.estimateRoundTrip(6, 400, 'normal', 5);
  const manual = C.estimateHikingTime(6, 400, 400, 'normal', 5);
  assert.deepEqual(round, manual);
});

test('평지 코스(고도 0)는 기본 이동시간만 반영', () => {
  const r = C.estimateHikingTime(4, 0, 0, 'normal', 5);
  assert.equal(r.climbMinutes, 0);
  assert.equal(r.descentMinutes, 0);
  assert.equal(r.baseMinutes, 75); // 4/3.2*60
});

test('잘못된 입력 거부: 거리 0·음수', () => {
  assert.throws(() => C.estimateHikingTime(0, 100, 100, 'normal', 5), RangeError);
  assert.throws(() => C.estimateHikingTime(-1, 100, 100, 'normal', 5), RangeError);
});

test('잘못된 입력 거부: 음수 고도·배낭무게', () => {
  assert.throws(() => C.estimateHikingTime(5, -10, 0, 'normal', 5), RangeError);
  assert.throws(() => C.estimateHikingTime(5, 0, -10, 'normal', 5), RangeError);
  assert.throws(() => C.estimateHikingTime(5, 0, 0, 'normal', -1), RangeError);
});

test('잘못된 체력수준 값 거부', () => {
  assert.throws(() => C.estimateHikingTime(5, 0, 0, 'expert', 5), RangeError);
});

test('매우 긴 거리도 유한한 결과 반환', () => {
  const r = C.estimateHikingTime(1000, 5000, 5000, 'advanced', 5);
  assert.ok(Number.isFinite(r.totalMinutes) && r.totalMinutes > 0);
});

test('minutesToHM: 60분 미만은 분만 표기', () => {
  assert.equal(C.minutesToHM(45), '45분');
});
test('minutesToHM: 정각은 "N시간"만 표기', () => {
  assert.equal(C.minutesToHM(120), '2시간');
});
test('minutesToHM: 0분', () => {
  assert.equal(C.minutesToHM(0), '0분');
});

test('classifyDifficulty: 짧고 완만하면 easy', () => {
  assert.equal(C.classifyDifficulty(3, 200), 'easy');
});
test('classifyDifficulty: 고도 700m 이상이면 hard', () => {
  assert.equal(C.classifyDifficulty(10, 900), 'hard');
});
test('classifyDifficulty: 그 외는 mid', () => {
  assert.equal(C.classifyDifficulty(6, 500), 'mid');
});

test('filterCourses: 지역 필터링', () => {
  const list = [
    { region: '서울', mountain_name: '북한산', course_name: '백운대', difficulty: 'hard' },
    { region: '경기', mountain_name: '청계산', course_name: '정상', difficulty: 'mid' },
  ];
  const r = C.filterCourses(list, { region: '서울' });
  assert.equal(r.length, 1);
  assert.equal(r[0].mountain_name, '북한산');
});

test('filterCourses: 검색어는 산이름·코스명·지역을 통틀어 매칭', () => {
  const list = [
    { region: '서울', mountain_name: '북한산', course_name: '백운대 코스', difficulty: 'hard' },
    { region: '경기', mountain_name: '청계산', course_name: '정상 코스', difficulty: 'mid' },
  ];
  const r = C.filterCourses(list, { query: '청계' });
  assert.equal(r.length, 1);
  assert.equal(r[0].mountain_name, '청계산');
});

test('filterCourses: 난이도+검색어 동시 필터', () => {
  const list = [
    { region: '서울', mountain_name: '북한산', course_name: '백운대 코스', difficulty: 'hard' },
    { region: '서울', mountain_name: '관악산', course_name: '연주대 코스', difficulty: 'mid' },
  ];
  const r = C.filterCourses(list, { region: '서울', difficulty: 'hard' });
  assert.equal(r.length, 1);
  assert.equal(r[0].mountain_name, '북한산');
});
