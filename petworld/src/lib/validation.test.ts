import { describe, it, expect } from 'vitest';
import { isValidEmail } from './validation';
describe('isValidEmail contract', () => {
  it('accepts valid email', () => expect(isValidEmail('a@b.co')).toBe(true));
  it('rejects invalid email', () => expect(isValidEmail('bad')).toBe(false));
});
