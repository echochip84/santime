/*
 * 계산 로직 — DOM과 분리된 순수 함수(functional-site-builder 스킬 03-implementation.md 5.6).
 */
'use strict';

const R = (typeof RATES !== 'undefined') ? RATES : require('./rates.js').RATES;

/** 분(minute) 단위 정수 반올림 — 부동소수점 오차 방지 위해 소수 3자리 선반올림 후 처리 */
function roundMinutes(v) { return Math.round(Math.round(v * 1000) / 1000); }

/**
 * 등산 소요시간 추정.
 * @param {number} distanceKm 편도 이동 거리(km)
 * @param {number} ascentM 총 상승고도(m)
 * @param {number} descentM 총 하강고도(m, 편도 기준 보통 상승과 비슷하거나 원점회귀면 상승=하강)
 * @param {'beginner'|'normal'|'advanced'} fitness 체력수준
 * @param {number} packKg 배낭무게(kg)
 * @returns {{baseMinutes:number, climbMinutes:number, descentMinutes:number, packPenaltyMinutes:number, restMinutes:number, totalMinutes:number, totalHours:number, pace:string}}
 */
function estimateHikingTime(distanceKm, ascentM, descentM, fitness, packKg) {
  if (!(distanceKm > 0)) throw new RangeError('distanceKm must be > 0');
  if (ascentM < 0 || descentM < 0) throw new RangeError('ascentM/descentM must be >= 0');
  if (!R.fitnessSpeed[fitness]) throw new RangeError('invalid fitness level: ' + fitness);
  if (packKg < 0) throw new RangeError('packKg must be >= 0');

  const speed = R.fitnessSpeed[fitness];
  const baseMinutes = (distanceKm / speed) * 60;
  const climbMinutes = (ascentM / 100) * R.climbMinutesPer100m;
  const descentMinutes = (descentM / 100) * R.descentMinutesPer100m;

  const extraKg = Math.max(0, packKg - R.packWeight.baseKg);
  const packMultiplier = 1 + (extraKg * R.packWeight.percentPerExtraKg) / 100;

  const moveMinutes = (baseMinutes + climbMinutes + descentMinutes) * packMultiplier;
  const packPenaltyMinutes = moveMinutes - (baseMinutes + climbMinutes + descentMinutes);
  const restMinutes = moveMinutes * (R.restBufferPercent / 100);

  const totalMinutes = roundMinutes(moveMinutes + restMinutes);
  return {
    baseMinutes: roundMinutes(baseMinutes),
    climbMinutes: roundMinutes(climbMinutes),
    descentMinutes: roundMinutes(descentMinutes),
    packPenaltyMinutes: roundMinutes(packPenaltyMinutes),
    restMinutes: roundMinutes(restMinutes),
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    pace: minutesToHM(totalMinutes),
  };
}

/** 분 → "N시간 M분" 문자열 */
function minutesToHM(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** 왕복 코스 추정(상승=하강, 원점회귀) 편의 함수 */
function estimateRoundTrip(distanceKm, elevationM, fitness, packKg) {
  return estimateHikingTime(distanceKm, elevationM, elevationM, fitness, packKg);
}

/** 코스 난이도 자동 분류(코스 데이터에 difficulty가 없을 때 폴백용) */
function classifyDifficulty(distanceKm, elevationM) {
  if (distanceKm <= R.difficultyThresholds.easyMaxKm && elevationM < R.difficultyThresholds.hardMinElevationM) return 'easy';
  if (elevationM >= R.difficultyThresholds.hardMinElevationM) return 'hard';
  return 'mid';
}

/** 코스 목록 필터링(지역·난이도·검색어) — 순수 함수, DOM 무관 */
function filterCourses(courses, { region, difficulty, query } = {}) {
  return courses.filter((c) => {
    if (region && c.region !== region) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const hay = `${c.mountain_name} ${c.course_name} ${c.region}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const CalcCore = {
  roundMinutes, estimateHikingTime, minutesToHM, estimateRoundTrip, classifyDifficulty, filterCourses,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalcCore;
}
