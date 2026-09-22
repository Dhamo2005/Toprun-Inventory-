import { describe, it, expect } from 'vitest';

describe('Profile and Password Management Logic', () => {
  it('validates profile details accurately', () => {
    const validateProfile = (name: string, email: string) => {
      if (!name || !name.trim()) return 'Name is required';
      if (!email || !email.trim() || !email.includes('@')) return 'Valid email is required';
      return null;
    };

    expect(validateProfile('', 'user@example.com')).toBe('Name is required');
    expect(validateProfile('Alex', '')).toBe('Valid email is required');
    expect(validateProfile('Alex', 'invalid-email')).toBe('Valid email is required');
    expect(validateProfile('Alex Rivera', 'alex@toprun.com')).toBeNull();
  });

  it('validates password change requirements', () => {
    const validatePasswordChange = (current: string, next: string, confirm: string) => {
      if (!current) return 'Current password is required';
      if (!next || next.length < 4) return 'New password must be at least 4 characters';
      if (next !== confirm) return 'New passwords do not match';
      return null;
    };

    expect(validatePasswordChange('', 'newpass', 'newpass')).toBe('Current password is required');
    expect(validatePasswordChange('oldpass', '123', '123')).toBe('New password must be at least 4 characters');
    expect(validatePasswordChange('oldpass', 'pass1234', 'pass5678')).toBe('New passwords do not match');
    expect(validatePasswordChange('oldpass', 'pass1234', 'pass1234')).toBeNull();
  });
});
