import { randomBytes } from 'node:crypto';

export const runId = `e2e-${Date.now()}-${randomBytes(4).toString('hex')}`;
export const password = 'E2ePhase3Test123!';

export function email(label: string): string {
  return `${label}-${runId}@example.test`;
}

export function phone(index: number): string {
  const suffix = String((Date.now() + index) % 10_000_000).padStart(7, '0');
  return `090${suffix}`;
}
