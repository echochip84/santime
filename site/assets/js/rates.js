/*
 * 등산 소요시간 추정 공식의 계수 설정.
 * 출처: Naismith's Rule(1892, 스코틀랜드 등산가 William Naismith가 고안한 고전적 도보 소요시간 공식 —
 *       평지 5km/h + 상승고도 매 300m(≈1000ft)당 30분 가산)을 한국 등산로 안전수칙에서 흔히 쓰는
 *       "평지 시속 4km, 오르막 시속 2~2.5km" 경험식에 맞춰 재보정하고,
 *       Tranter's correction(1970년대 고안된 체력수준 보정 계수) 개념을 배낭무게·체력수준 보정에 단순화 적용.
 * 값 변경 시: ① 실제 코스 데이터(courses.js)와 대조해 오차 확인 ② tests/calculator.test.js 기대값 갱신
 *            ③ 페이지 기준일 문구 갱신.
 */
const RATES = {
  baseDate: '2026-07-09',

  // 체력수준별 평지 기준속도(km/h). 국립공원공단·산악안전 수칙에서 통용되는 범위.
  fitnessSpeed: {
    beginner: 2.5,   // 초급 — 평소 운동 안 함, 첫 등산
    normal: 3.2,     // 중급 — 월 1~2회 등산
    advanced: 4.0,   // 상급 — 주 1회 이상 등산, 산악 동호인
  },

  // 고도 보정: 상승고도 100m당 추가 시간(분). Naismith 원 공식(300m당 30분=100m당 10분)을 기준값으로 채택.
  climbMinutesPer100m: 10,

  // 하강 보정: 급경사 하산은 상승보다는 빠르지만 평지보다는 느림 — 하강고도 100m당 가산(분). 상승의 약 40% 수준.
  descentMinutesPer100m: 4,

  // 배낭무게 보정: 기준 무게(kg) 초과분 1kg당 총 이동시간에 가산되는 비율(%).
  packWeight: {
    baseKg: 5,       // 이 무게까지는 보정 없음(물·간식 등 데이시팩 기준)
    percentPerExtraKg: 1.2,
  },

  // 휴식 보정: 짧은 휴식(사진·물 마시기 등)을 이동시간의 몇 %로 반영할지. 식사 등 긴 휴식은 별도 고려 필요.
  restBufferPercent: 12,

  // 난이도 배지 분류 기준(거리·고도 기준, 코스 데이터의 difficulty 필드가 없을 때 자동 분류용)
  difficultyThresholds: { easyMaxKm: 4, hardMinElevationM: 700 },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RATES };
}
