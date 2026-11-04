import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts/security');
const advisorySchema = z.looseObject({
  name: z.string(),
  url: z.url(),
  severity: z.string(),
  range: z.string(),
});
const findingSchema = z.looseObject({
  severity: z.string(),
  isDirect: z.boolean(),
  nodes: z.array(z.string()),
  via: z.array(z.union([z.string(), advisorySchema])),
});
const auditSchema = z.looseObject({
  auditReportVersion: z.number(),
  vulnerabilities: z.record(z.string(), findingSchema),
  metadata: z.looseObject({ vulnerabilities: z.record(z.string(), z.number()) }),
});
const lockSchema = z.looseObject({
  packages: z.record(z.string(), z.looseObject({ version: z.string().optional() })),
});

function npm(args) {
  if (!process.env.npm_execpath) throw new Error('Run through npm run security:report');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.signal || result.status === null)
    throw new Error(`npm ${args.join(' ')} did not complete`);
  return result;
}

try {
  mkdirSync(output, { recursive: true });
  const lock = lockSchema.parse(
    JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8')),
  );
  const reports = [];
  for (const [name, args] of [
    ['full', []],
    ['production', ['--omit=dev']],
  ]) {
    const result = npm(['audit', ...args, '--json']);
    const report = auditSchema.parse(JSON.parse(result.stdout));
    if (
      ![0, 1].includes(result.status) ||
      (result.status === 1 && report.metadata.vulnerabilities.total === 0)
    ) {
      throw new Error(`npm audit ${name} failed without a valid vulnerability result`);
    }
    writeFileSync(path.join(output, `${name}.json`), `${JSON.stringify(report, null, 2)}\n`);
    reports.push({ name, report, exitCode: result.status });
    console.log(
      `${name}: npm audit exit ${result.status}; ${report.metadata.vulnerabilities.total} affected package findings`,
    );
  }
  const full = reports[0].report;
  const roots = new Map();
  for (const [name, finding] of Object.entries(full.vulnerabilities)) {
    for (const via of finding.via)
      if (typeof via !== 'string') roots.set(via.url, { ...via, package: name });
  }
  function rootUrls(name, seen = new Set()) {
    if (seen.has(name)) return [];
    const finding = full.vulnerabilities[name];
    if (!finding) throw new Error(`Missing dependency finding: ${name}`);
    const branch = new Set([...seen, name]);
    return [
      ...new Set(
        finding.via.flatMap((via) => (typeof via === 'string' ? rootUrls(via, branch) : [via.url])),
      ),
    ];
  }
  const rows = Object.entries(full.vulnerabilities).map(([name, finding]) => {
    const urls = rootUrls(name);
    if (!urls.length) throw new Error(`Cannot attribute finding: ${name}`);
    const versions = [
      ...new Set(
        finding.nodes.map((node) => {
          const version = lock.packages[node]?.version;
          if (!version) throw new Error(`Missing locked version: ${node}`);
          return version;
        }),
      ),
    ];
    return `| ${name} | ${versions.join(', ')} | ${finding.severity} | ${finding.isDirect ? 'direct' : 'transitive'} | ${urls.map((url) => url.split('/').at(-1)).join(', ')} |`;
  });
  for (const { package: name } of roots.values()) {
    const result = npm(['explain', name, '--json']);
    if (result.status !== 0) throw new Error(`npm explain failed for ${name}`);
    const tree = z.array(z.unknown()).parse(JSON.parse(result.stdout));
    writeFileSync(
      path.join(output, `explain-${encodeURIComponent(name)}.json`),
      `${JSON.stringify(tree, null, 2)}\n`,
    );
  }
  const summary = [
    '# Dependency security audit',
    '',
    `Generated ${new Date().toISOString()}. Raw audit failures remain failures; no advisory is suppressed.`,
    '',
    ...reports.map(
      ({ name, report, exitCode }) =>
        `- ${name}: ${report.metadata.vulnerabilities.total} affected package findings; npm exit ${exitCode}.`,
    ),
    `- ${roots.size} underlying advisories. See PHASE_3_REPORT.md for reachability and mitigations.`,
    '',
    '| Affected package | Locked versions | Severity | Dependency | Root advisories |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    'npm production dependency classification does not prove that code is bundled into a native app.',
    '',
  ].join('\n');
  writeFileSync(path.join(output, 'summary.md'), summary);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(
    `Mapped all ${rows.length} affected packages to ${roots.size} root advisories. Reports: artifacts/security/`,
  );
  process.exitCode = reports.some(({ report }) => report.metadata.vulnerabilities.total > 0)
    ? 1
    : 0;
} catch (error) {
  console.error(
    'Security reporting failed:',
    error instanceof Error ? error.message : 'Unknown reporting error',
  );
  process.exitCode = 2;
}
