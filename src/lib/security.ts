/**
 * Enterprise-Grade Security & Input Sanitization Layer
 * Implements strict zero-trust input validation, XSS prevention,
 * prototype pollution defense, and numeric boundary verification.
 */

import { StudentProfile } from './predictor';

/**
 * Escapes HTML entities to prevent Cross-Site Scripting (XSS) attacks.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .slice(0, 100);
}

/**
 * Validates and clamps numerical inputs to physically possible domain ranges.
 */
export function clampNumber(value: number, min: number, max: number, defaultValue: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }
  if (value === Infinity) return max;
  if (value === -Infinity) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates student profile inputs against strict CILP institutional rules.
 */
export function sanitizeStudentProfile(profile: Partial<StudentProfile>): StudentProfile {
  const clean: Partial<StudentProfile> = Object.create(null);

  clean.name = sanitizeString(profile.name || 'Student Candidate');
  clean.rollNo = sanitizeString(profile.rollNo || '102203000').replace(/[^a-zA-Z0-9]/g, '');
  
  const VALID_BRANCHES = ['COE', 'COPC', 'ENC', 'ECE', 'ELE', 'MECH', 'CIVIL', 'CHE', 'BIOTECH', 'CIE'];
  const branchUpper = sanitizeString(profile.branch || 'COE').toUpperCase();
  clean.branch = VALID_BRANCHES.includes(branchUpper) ? branchUpper : 'COE';

  clean.cgpa = Number(clampNumber(profile.cgpa ?? 8.0, 0.0, 10.0, 8.0).toFixed(2));
  clean.leetcodeSolved = Math.floor(clampNumber(profile.leetcodeSolved ?? 0, 0, 3500, 0));
  clean.codeforcesRating = Math.floor(clampNumber(profile.codeforcesRating ?? 800, 800, 3800, 800));
  clean.githubRepos = Math.floor(clampNumber(profile.githubRepos ?? 0, 0, 500, 0));
  clean.priorInternships = Math.floor(clampNumber(profile.priorInternships ?? 0, 0, 10, 0));
  clean.hackathonsWon = Math.floor(clampNumber(profile.hackathonsWon ?? 0, 0, 20, 0));
  clean.activeBacklogs = Math.floor(clampNumber(profile.activeBacklogs ?? 0, 0, 15, 0));
  clean.oaMockScore = Math.floor(clampNumber(profile.oaMockScore ?? 50, 0, 100, 50));
  clean.proctorIntegrity = Number(clampNumber(profile.proctorIntegrity ?? 100, 0, 100, 100).toFixed(1));

  return clean as StudentProfile;
}

/**
 * Cryptographic Token / Nonce generator for secure client-side sessions
 */
export function generateClientSessionToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sess-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Checks if a string contains known XSS / Injection patterns
 */
export function detectMaliciousPayload(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const maliciousRegex = /(<script|javascript:|on\w+\s*=|data:text\/html|<iframe|<embed|<object|onload|onerror)/i;
  return maliciousRegex.test(input);
}
