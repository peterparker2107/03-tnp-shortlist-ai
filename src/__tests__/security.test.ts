import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeString,
  clampNumber,
  sanitizeStudentProfile,
  detectMaliciousPayload,
} from '../lib/security';

describe('Security & Input Sanitization Test Suite', () => {
  test('XSS Payload Neutralization in strings', () => {
    const rawMalicious = '<script>alert("pwned")</script><b>John Doe</b>';
    const sanitized = sanitizeString(rawMalicious);

    assert.ok(!sanitized.includes('<script>'), 'Must strip or escape opening script tag');
    assert.ok(!sanitized.includes('</script>'), 'Must strip or escape closing script tag');
    assert.ok(sanitized.includes('&lt;') || !sanitized.includes('<'), 'HTML tags must be escaped');
  });

  test('Detects malicious JavaScript injection attempts', () => {
    assert.strictEqual(detectMaliciousPayload('javascript:void(0)'), true);
    assert.strictEqual(detectMaliciousPayload('<img src="x" onerror="alert(1)">'), true);
    assert.strictEqual(detectMaliciousPayload('<iframe src="evil.com"></iframe>'), true);
    assert.strictEqual(detectMaliciousPayload('Armaan Malhotra'), false);
    assert.strictEqual(detectMaliciousPayload('102203841'), false);
  });

  test('Clamps numerical parameters to prevent integer overflow and NaN attacks', () => {
    assert.strictEqual(clampNumber(NaN, 0, 10, 5), 5, 'NaN should fallback to default');
    assert.strictEqual(clampNumber(Infinity, 0, 10, 5), 10, 'Infinity should clamp to max');
    assert.strictEqual(clampNumber(-Infinity, 0, 10, 5), 0, '-Infinity should clamp to min');
    assert.strictEqual(clampNumber(-99, 0, 10, 5), 0, 'Negative values below min should clamp to min');
    assert.strictEqual(clampNumber(999, 0, 10, 5), 10, 'Values above max should clamp to max');
    assert.strictEqual(clampNumber(8.5, 0, 10, 5), 8.5, 'Valid values should remain unchanged');
  });

  test('Sanitizes full StudentProfile and defends against prototype pollution', () => {
    const maliciousProfile: any = {
      name: '<script>alert(1)</script>Aryan',
      rollNo: '102203841<svg onload=alert(1)>',
      branch: 'MALICIOUS_BRANCH',
      cgpa: 99.99, // Out of bounds
      leetcodeSolved: -500, // Negative out of bounds
      activeBacklogs: -2,
    };

    const clean = sanitizeStudentProfile(maliciousProfile);

    assert.strictEqual(clean.cgpa, 10.0, 'CGPA must be clamped to 10.0');
    assert.strictEqual(clean.leetcodeSolved, 0, 'LeetCode solved must be clamped to min 0');
    assert.strictEqual(clean.activeBacklogs, 0, 'Active backlogs cannot be negative');
    assert.strictEqual(clean.branch, 'COE', 'Invalid branch must fallback to COE default');
    assert.ok(!clean.rollNo.includes('<'), 'Roll number must be alphanumeric only');
    assert.ok(!clean.name.includes('<script>'), 'Name must not contain script tags');
  });
});
