import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const staticCheckPath = join(repositoryRoot, 'scripts/check-static-export.mjs');
const documentPaths = [
  'index.html',
  'docs.html',
  'docs/install.html',
  'docs/doctor.html',
  'docs/models.html',
  'docs/cli.html',
  'docs/troubleshooting.html',
  'docs/project.html',
  'docs/experimental/supervisor.html',
];
const llmPaths = [
  'llms.txt',
  'llms-full.txt',
  'llms.mdx/docs/index',
  'llms.mdx/docs/install',
  'llms.mdx/docs/cli',
  'llms.mdx/docs/experimental/supervisor',
];

const validSearchPayload = {
  type: 'advanced',
  internalDocumentIDStore: { internalIdToId: ['doc-1'] },
  index: {
    indexes: {
      content: { type: 'Radix', node: {}, isArray: false },
    },
    searchableProperties: ['content'],
  },
  docs: {
    docs: { 'doc-1': { content: 'Loxa' } },
    count: 1,
  },
  sorting: {},
  pinning: {},
  language: 'english',
};

async function readText(relativePath: string): Promise<string> {
  try {
    return await readFile(join(repositoryRoot, relativePath), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

const [workflow, staticCheck, readme, pnpmWorkspace] = await Promise.all([
  readText('.github/workflows/ci.yml'),
  readText('scripts/check-static-export.mjs'),
  readText('README.md'),
  readText('pnpm-workspace.yaml'),
]);

async function writeStaticFixture(
  fixtureDirectory: string,
  searchPayload: unknown = validSearchPayload,
): Promise<void> {
  const outputDirectory = join(fixtureDirectory, 'out');

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    join(outputDirectory, '_headers'),
    '/llms.mdx/docs/*\n  Content-Type: text/markdown; charset=utf-8\n  Content-Disposition: inline\n',
  );

  for (const documentPath of documentPaths) {
    const absolutePath = join(outputDirectory, documentPath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, '<!doctype html><title>Loxa</title>');
  }

  for (const llmPath of llmPaths) {
    const absolutePath = join(outputDirectory, llmPath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, '# Loxa documentation');
  }

  const searchPath = join(outputDirectory, 'api/search');
  await mkdir(dirname(searchPath), { recursive: true });
  await writeFile(searchPath, JSON.stringify(searchPayload));
}

describe('CI and static-export contract', () => {
  test('allows only reviewed dependency build scripts', () => {
    expect(pnpmWorkspace).toContain('allowBuilds:');
    expect(pnpmWorkspace).toContain("'esbuild@0.28.1': true");
    expect(pnpmWorkspace).toContain("'sharp@0.34.5': true");
    expect(pnpmWorkspace).toContain("'unrs-resolver@1.12.2': true");
    expect(pnpmWorkspace).not.toContain('dangerouslyAllowAllBuilds');
  });

  test('runs the full check pipeline in order with read-only permissions', () => {
    expect(workflow).toContain('permissions:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('actions/checkout@v6');
    expect(workflow).toContain('pnpm/action-setup@v4');
    expect(workflow).toContain('actions/setup-node@v6');
    expect(workflow).toContain('node-version: 22');

    const phases = [
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm typecheck',
      'pnpm test',
      'pnpm check:links',
      'pnpm build',
      'pnpm check:static',
    ];
    const positions = phases.map((phase) => workflow.indexOf(phase));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(workflow).not.toMatch(/deploy|wrangler|cloudflare_api_token/i);
    expect(workflow).not.toMatch(/upload-artifact|secrets\./i);
  });

  test('checks the home page, every docs route, and the static search payload', () => {
    for (const route of [
      '/',
      '/docs',
      '/docs/doctor',
      '/docs/models',
      '/docs/cli',
      '/docs/troubleshooting',
      '/docs/project',
      '/docs/experimental/supervisor',
    ]) {
      expect(staticCheck).toContain("'" + route + "'");
    }

    expect(staticCheck).toContain("searchRoute = '/api/search'");
    expect(staticCheck).toContain("normalized + '.html'");
    expect(staticCheck).toContain("'index.html'");
    expect(staticCheck).toContain("payload.type !== 'advanced'");
    expect(staticCheck).toContain('internalDocumentIDStore');
    expect(staticCheck).toContain('internalIdToId');
    expect(staticCheck).toContain('payload.docs.docs');
    expect(staticCheck).toContain('payload.docs.count');
    expect(staticCheck).toContain('payload.index.indexes');
    expect(staticCheck).toContain('payload.index.searchableProperties');
    expect(staticCheck).toContain('payload.sorting');
    expect(staticCheck).toContain('payload.pinning');
    expect(staticCheck).toContain('language');
  });

  test('rejects runtime paths and scans every public textual artifact', () => {
    expect(staticCheck).toContain('middleware');
    expect(staticCheck).toContain('server-reference-manifest');
    expect(staticCheck).toContain('_next/server');

    for (const extension of ['html', 'txt', 'md', 'js', 'css', 'json', 'xml', 'svg']) {
      expect(staticCheck).toContain(extension);
    }

    expect(staticCheck).toContain('absolute user path');
    expect(staticCheck).toContain('context directory');
    expect(staticCheck).toContain('internal tooling path');
  });

  test('fails clearly when out is absent', async () => {
    const emptyDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: emptyDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('out/ is absent; run pnpm build first'),
      });
    } finally {
      await rm(emptyDirectory, { recursive: true, force: true });
    }
  });

  test('accepts the emitted extensionless Orama search payload', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));
    const outputDirectory = join(fixtureDirectory, 'out');

    try {
      await writeStaticFixture(fixtureDirectory);

      const allowedClientManifest = join(
        outputDirectory,
        '_next/static/build/_clientMiddlewareManifest.js',
      );
      await mkdir(dirname(allowedClientManifest), { recursive: true });
      await writeFile(allowedClientManifest, 'self.__BUILD_MANIFEST = {};');

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).resolves.toMatchObject({
        stdout: expect.stringContaining('16 routes checked'),
      });

      const forbiddenBundle = join(
        outputDirectory,
        '_next/static/chunks/site-server-action.js',
      );
      await mkdir(dirname(forbiddenBundle), { recursive: true });
      await writeFile(forbiddenBundle, 'export {};');

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('unsupported runtime artifact'),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test.each([
    ['absolute user path', '/Users/example/private-project'],
    ['context directory', 'internal_context/plan.md'],
    ['internal tooling path', '.superpowers/example.md'],
  ])('rejects a forbidden path in emitted Markdown (%s)', async (label, canary) => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory);

      const markdownAsset = join(fixtureDirectory, 'out/brand/README.md');
      await mkdir(dirname(markdownAsset), { recursive: true });
      await writeFile(markdownAsset, 'Local source: ' + canary);

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining(label),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('scans extensionless per-page Markdown output', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory);
      await writeFile(
        join(fixtureDirectory, 'out/llms.mdx/docs/cli'),
        'Local source: /Users/example/private-project',
      );

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('absolute user path'),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test.each([
    ['unsupported readiness claim', 'This is production-ready.'],
    ['credential-like token', 'ghp_123456789012345678901234567890'],
    ['credential assignment', 'CLOUDFLARE_API_TOKEN=0123456789abcdef0123456789abcdef'],
  ])('rejects unsafe generated Markdown (%s)', async (label, canary) => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory);
      await writeFile(join(fixtureDirectory, 'out/llms.mdx/docs/cli'), canary);

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining(label) });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('allows obvious credential placeholders in generated Markdown', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory);
      await writeFile(
        join(fixtureDirectory, 'out/llms.mdx/docs/cli'),
        'CLOUDFLARE_API_TOKEN=<YOUR_TOKEN>\nGITHUB_TOKEN=changeme\nCLOUDFLARE_ACCOUNT_ID=2aaca0cce1c18a7c4cb517ae9b3a1185',
      );

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).resolves.toMatchObject({ stdout: expect.stringContaining('16 routes checked') });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('rejects a generated Markdown artifact larger than 2 MiB', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory);
      await writeFile(
        join(fixtureDirectory, 'out/llms.mdx/docs/cli'),
        'x'.repeat(2 * 1024 * 1024 + 1),
      );

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('generated Markdown exceeds size ceiling'),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('rejects an empty advanced Orama payload', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory, {
        type: 'advanced',
        internalDocumentIDStore: { internalIdToId: ['doc-1'] },
        index: { indexes: {}, searchableProperties: [] },
        docs: { docs: {}, count: 0 },
        sorting: {},
        pinning: {},
        language: 'english',
      });

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('missing or invalid static Orama payload'),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('rejects an advanced Orama payload with no usable index entry', async () => {
    const fixtureDirectory = await mkdtemp(join(tmpdir(), 'loxa-static-check-'));

    try {
      await writeStaticFixture(fixtureDirectory, {
        ...validSearchPayload,
        index: {
          indexes: { content: {} },
          searchableProperties: ['content'],
        },
      });

      await expect(
        execFileAsync(process.execPath, [staticCheckPath], { cwd: fixtureDirectory }),
      ).rejects.toMatchObject({
        code: 1,
        stderr: expect.stringContaining('missing or invalid static Orama payload'),
      });
    } finally {
      await rm(fixtureDirectory, { recursive: true, force: true });
    }
  });

  test('documents the public static build contract', () => {
    expect(readme).toContain('Build command: `pnpm build`');
    expect(readme).toContain('Output directory: `out`');
  });
});
