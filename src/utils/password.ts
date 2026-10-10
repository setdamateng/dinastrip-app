/** Aturan kata sandi baru: sama persis dengan validasi server (AuthController::passwordRules). */
export const PASSWORD_RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: 'len', label: 'Minimal 6 karakter', test: (p) => p.length >= 6 },
  { key: 'upper', label: 'Memiliki 1 huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Memiliki 1 huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'digit', label: 'Memiliki 1 angka (0-9)', test: (p) => /[0-9]/.test(p) },
  { key: 'symbol', label: 'Memiliki 1 simbol (! @ # $ % ^ & *)', test: (p) => /[!@#$%^&*]/.test(p) },
];

export const passwordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** "andi.wijaya@instansi.go.id" -> "a***@instansi.go.id" */
export function maskEmail(email: string): string {
  const [u, d] = email.trim().split('@');
  if (!u || !d) return email;
  return `${u[0]}***@${d}`;
}
