const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function validateContactForm(
  name: string,
  email: string,
  message: string
): string | null {
  if (!isNonEmpty(name)) return 'Name is required';
  if (!isValidEmail(email)) return 'A valid email is required';
  if (!isNonEmpty(message)) return 'Message is required';
  return null;
}
