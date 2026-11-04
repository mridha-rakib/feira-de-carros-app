import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = mkdtempSync(path.join(tmpdir(), 'fikiflow-hooks-'));
function run(args, expectedSuccess = true) {
  const result = spawnSync('git', args, {
    cwd: fixture,
    env: { ...process.env, HUSKY: '1', GIT_CONFIG_NOSYSTEM: '1' },
    encoding: 'utf8',
  });
  if ((result.status === 0) !== expectedSuccess) {
    throw new Error(
      `git ${args.join(' ')} returned ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return `${result.stdout}${result.stderr}`;
}
try {
  // This disposable repo has its own index, hooks and fixtures; the real index is untouched.
  run(['init', '--initial-branch=main']);
  run(['config', 'user.name', 'Hook Verification']);
  run(['config', 'user.email', 'hooks@example.test']);
  cpSync(path.join(root, '.husky'), path.join(fixture, '.husky'), { recursive: true });
  run(['config', 'core.hooksPath', '.husky/_']);
  symlinkSync(
    path.join(root, 'node_modules'),
    path.join(fixture, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  writeFileSync(path.join(fixture, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  for (const file of ['biome.jsonc', 'tsconfig.json', 'jest.config.js'])
    cpSync(path.join(root, file), path.join(fixture, file));
  mkdirSync(path.join(fixture, 'src'));
  cpSync(path.join(root, 'tests'), path.join(fixture, 'tests'), { recursive: true });
  cpSync(path.join(root, 'src'), path.join(fixture, 'src'), { recursive: true });
  writeFileSync(path.join(fixture, '.gitignore'), 'node_modules/\ncoverage/\n');
  const probe = path.join(fixture, 'src/hook-probe.ts');
  writeFileSync(probe, 'export const hookProbe = ;\n');
  run(['add', 'src/hook-probe.ts']);
  assert.match(run(['hook', 'run', 'pre-commit'], false), /biome|lint-staged/i);
  console.log('PASS: pre-commit rejects invalid staged syntax');
  writeFileSync(probe, 'export const hookProbe="valid"\n');
  run(['add', 'src/hook-probe.ts']);
  run(['hook', 'run', 'pre-commit']);
  assert.match(run(['show', ':src/hook-probe.ts']), /hookProbe = 'valid';/);
  console.log('PASS: lint-staged formats and re-stages valid code');
  run(['hook', 'run', 'pre-push']);
  console.log('PASS: pre-push runs the actual validation gate');
  writeFileSync(probe, 'export const hookProbe: string = 42;\n');
  assert.match(run(['hook', 'run', 'pre-push'], false), /TS2322/);
  console.log('PASS: pre-push rejects a TypeScript error');
} finally {
  // Never recurse into the junction/shared dependencies.
  const resolved = realpathSync(fixture);
  assert.ok(resolved.startsWith(`${realpathSync(tmpdir())}${path.sep}`));
  assert.ok(path.basename(resolved).startsWith('fikiflow-hooks-'));
  rmSync(path.join(fixture, 'node_modules'), { force: true });
  rmSync(fixture, { recursive: true, force: true });
}
