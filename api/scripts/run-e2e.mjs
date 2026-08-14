import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const testUrl = process.env.TEST_DATABASE_URL?.trim();
const developmentUrl = process.env.DATABASE_URL?.trim();

if (!testUrl) {
  console.error(
    'E2E bị dừng: thiếu TEST_DATABASE_URL. Không có thao tác nào được thực hiện trên DATABASE_URL.',
  );
  process.exit(1);
}
function databaseIdentity(value) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname.toLowerCase()}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`;
  } catch {
    console.error(
      'E2E bị dừng: TEST_DATABASE_URL không phải PostgreSQL URL hợp lệ.',
    );
    process.exit(1);
  }
}

if (
  developmentUrl &&
  databaseIdentity(testUrl) === databaseIdentity(developmentUrl)
) {
  console.error(
    'E2E bị dừng: TEST_DATABASE_URL trùng DATABASE_URL. Hãy dùng database PostgreSQL test riêng.',
  );
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: testUrl,
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ??
    'e2e_access_secret_only_32_characters_minimum',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ??
    'e2e_refresh_secret_only_32_characters_minimum',
  CORS_ORIGINS: '',
};
function run(modulePath, args, nodeArgs = []) {
  const result = spawnSync(
    process.execPath,
    [...nodeArgs, path.join(apiRoot, modulePath), ...args],
    {
      cwd: apiRoot,
      env,
      stdio: 'inherit',
      shell: false,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('E2E database: applying committed Prisma migrations...');
run('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
console.log('E2E database ready. Running Phase 3 and Phase 4 E2E tests...');
run(
  'node_modules/jest/bin/jest.js',
  [
    '--config',
    './test/jest-e2e.json',
    '--runInBand',
    ...(process.argv.includes('--watch') ? ['--watch'] : []),
  ],
  ['--experimental-vm-modules'],
);
