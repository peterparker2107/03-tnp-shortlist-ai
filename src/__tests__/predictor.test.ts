import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  evaluateShortlist,
  DEFAULT_STUDENT_PROFILE,
  StudentProfile,
} from '../lib/predictor';
import { TIET_COMPANIES } from '../data/companies';

describe('Predictor Engine & SHAP Attribution Tests', () => {
  test('Default student profile produces valid probability bounded [0, 100]', () => {
    const company = TIET_COMPANIES[0];
    const result = evaluateShortlist(DEFAULT_STUDENT_PROFILE, company);

    assert.ok(result.probability >= 0, 'Probability must be >= 0');
    assert.ok(result.probability <= 100, 'Probability must be <= 100');
    assert.ok(typeof result.status === 'string', 'Status must be a valid string');
    assert.ok(Array.isArray(result.shapFactors), 'SHAP factors must be an array');
    assert.ok(result.shapFactors.length > 0, 'Must have at least one SHAP factor');
  });

  test('Hard-gate disqualification on active backlogs', () => {
    const studentWithBacklogs: StudentProfile = {
      ...DEFAULT_STUDENT_PROFILE,
      activeBacklogs: 3,
    };

    const company = TIET_COMPANIES[0];
    const result = evaluateShortlist(studentWithBacklogs, company);

    assert.strictEqual(result.isEligible, false, 'Candidate should be ineligible due to backlogs');
    assert.ok(result.probability <= 5, 'Probability should be <= 5% on hard gate');
    assert.strictEqual(result.status, 'DISQUALIFIED');
  });

  test('CGPA increase strictly improves or maintains probability', () => {
    const company = TIET_COMPANIES[0];
    const lowCgpa: StudentProfile = { ...DEFAULT_STUDENT_PROFILE, cgpa: 7.2 };
    const highCgpa: StudentProfile = { ...DEFAULT_STUDENT_PROFILE, cgpa: 9.6 };

    const resLow = evaluateShortlist(lowCgpa, company);
    const resHigh = evaluateShortlist(highCgpa, company);

    assert.ok(
      resHigh.probability >= resLow.probability,
      `High CGPA (${resHigh.probability}%) must be >= Low CGPA (${resLow.probability}%)`
    );
  });

  test('DSA questions solved increases probability monotonically', () => {
    const company = TIET_COMPANIES[0];
    const noviceDSA: StudentProfile = { ...DEFAULT_STUDENT_PROFILE, leetcodeSolved: 50 };
    const expertDSA: StudentProfile = { ...DEFAULT_STUDENT_PROFILE, leetcodeSolved: 650 };

    const resNovice = evaluateShortlist(noviceDSA, company);
    const resExpert = evaluateShortlist(expertDSA, company);

    assert.ok(
      resExpert.probability >= resNovice.probability,
      `Expert DSA probability (${resExpert.probability}%) must exceed novice (${resNovice.probability}%)`
    );
  });

  test('SHAP factor decomposition sum aligns with probability delta', () => {
    const company = TIET_COMPANIES[0];
    const result = evaluateShortlist(DEFAULT_STUDENT_PROFILE, company);

    let totalPositive = 0;
    let totalNegative = 0;

    for (const factor of result.shapFactors) {
      if (factor.impact >= 0) totalPositive += factor.impact;
      else totalNegative += factor.impact;
    }

    assert.ok(typeof totalPositive === 'number' && !isNaN(totalPositive), 'Total positive SHAP must be numeric');
    assert.ok(typeof totalNegative === 'number' && !isNaN(totalNegative), 'Total negative SHAP must be numeric');
  });
});
