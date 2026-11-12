import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TIET_COMPANIES } from '../data/companies';

describe('TIET Campus Placement Dataset Integrity', () => {
  test('Contains valid TIET hiring companies with required metadata', () => {
    assert.ok(TIET_COMPANIES.length >= 8, 'Must have at least 8 real campus recruiting companies');
    
    for (const company of TIET_COMPANIES) {
      assert.ok(typeof company.id === 'string' && company.id.length > 0, 'Company ID must be non-empty');
      assert.ok(typeof company.name === 'string' && company.name.length > 0, 'Company name must be non-empty');
      assert.ok(typeof company.role === 'string' && company.role.length > 0, 'Role must be non-empty');
      assert.ok(company.ctcLpa > 0, `CTC must be positive for ${company.name}`);
      assert.ok(company.minCgpa >= 6.0 && company.minCgpa <= 10.0, `minCgpa must be 6.0-10.0 for ${company.name}`);
      assert.ok(Array.isArray(company.allowedBranches), `Allowed branches must be an array for ${company.name}`);
      assert.ok(company.allowedBranches.length > 0, `Must allow at least one branch for ${company.name}`);
    }
  });

  test('CTC distribution order is logically sound', () => {
    const sorted = [...TIET_COMPANIES].sort((a, b) => b.ctcLpa - a.ctcLpa);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    assert.ok(
      highest.ctcLpa > lowest.ctcLpa,
      `Top tier company (${highest.name} @ ${highest.ctcLpa} LPA) must be higher than entry tier (${lowest.name} @ ${lowest.ctcLpa} LPA)`
    );
  });
});
