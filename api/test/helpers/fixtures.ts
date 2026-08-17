import { createHash, randomBytes } from 'node:crypto';

export const runId = `e2e-${Date.now()}-${randomBytes(4).toString('hex')}`;
export const password = 'E2ePhase3Test123!';

export function email(label: string): string {
  return `${label}-${runId}@example.test`;
}

export function phone(index: number): string {
  const namespace = Number.parseInt(
    createHash('sha256').update(runId).digest('hex').slice(0, 8),
    16,
  );
  const suffix = String((namespace + index) % 10_000_000).padStart(7, '0');
  return `090${suffix}`;
}
