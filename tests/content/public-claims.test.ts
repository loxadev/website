import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const execFileAsync = promisify(execFile);

const forbidden = [
  /loxa bench/i,
  /tokens per second/i,
  /tokens?\s*\/\s*s(?:ec(?:ond)?s?)?/i,
  /time to first token/i,
  /\bfastest\b/i,
  /production[- ]ready/i,
  /openai[- ]compatible/i,
  /compatible(?:\s+|-)+with(?:\s+|-)+(?:the(?:\s+|-)+)?openai/i,
  /anthropic[- ]compatible/i,
  /cloud.{0,20}failover/i,
  /cloud.{0,20}fails?\s+over/i,
  /fails?\s+over.{0,20}(?:to\s+)?(?:the\s+)?cloud/i,
  /no orphan processes/i,
  /cargo install loxa/i,
  /brew install/i,
  /curl.{0,40}loxa/i,
  /\/v1\/chat\/completions/i,
  /—/,
  /\/Users\/[^/\s]+(?:\/[^\s"'<>]*)?/i,
  /(?:^|[^A-Za-z0-9])(?:private|internal)[-_ ]?context(?:[/\\]|$)/i,
  /(?:^|[^A-Za-z0-9])\.superpowers(?:[/\\]|$)/i,
];

type PublicTextFile = {
  path: string;
  content: string;
};

const groups: Array<{ directory: string; extensions: ReadonlySet<string> }> = [
  { directory: 'app', extensions: new Set(['.ts', '.tsx']) },
  { directory: 'components', extensions: new Set(['.ts', '.tsx']) },
  { directory: 'content', extensions: new Set(['.md', '.mdx', '.json']) },
];

const standalonePublicMarkdown = ['README.md', 'public/brand/README.md'];

function normalizePath(path: string): string {
  return path.split(sep).join('/');
}

function isTestPath(path: string): boolean {
  const normalized = normalizePath(path);
  return (
    normalized.split('/').some((part) => part === 'tests' || part === '__tests__') ||
    /\.(?:test|spec)\.[^/]+$/i.test(normalized)
  );
}

async function walk(directory: string, extensions: ReadonlySet<string>): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const nested = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry): Promise<string[]> => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return walk(path, extensions);
        if (!entry.isFile() || !extensions.has(extname(entry.name))) return [];

        const relativePath = normalizePath(relative(repositoryRoot, path));
        return isTestPath(relativePath) ? [] : [path];
      }),
  );

  return nested.flat();
}

async function collectPublicText(): Promise<PublicTextFile[]> {
  const groupedPaths = await Promise.all(
    groups.map(({ directory, extensions }) =>
      walk(join(repositoryRoot, directory), extensions),
    ),
  );
  const paths = [
    ...groupedPaths.flat(),
    ...standalonePublicMarkdown.map((path) => join(repositoryRoot, path)),
  ].sort();

  return Promise.all(
    paths.map(async (path) => ({
      path: normalizePath(relative(repositoryRoot, path)),
      content: await readFile(path, 'utf8'),
    })),
  );
}

const publicFiles = await collectPublicText();
const publicContent = new Map(publicFiles.map(({ path, content }) => [path, content]));

function contentFor(path: string): string {
  return publicContent.get(path) ?? '';
}

describe('public claim firewall', () => {
  test('rejects forbidden or unsupported public claims', () => {
    const violations = publicFiles.flatMap(({ path, content }) =>
      forbidden
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${path}: ${pattern}`),
    );

    expect(violations).toEqual([]);
  });

  test('keeps supervisor commands inside the labeled experimental page', () => {
    const experimentalPath = 'content/docs/experimental/supervisor.mdx';
    const experimental = contentFor(experimentalPath);
    const experimentalLabel = 'Experimental · feature/supervisor at 14daf02';
    const labelLocations = publicFiles
      .filter(({ content }) => content.includes(experimentalLabel))
      .map(({ path }) => path);
    const nonExperimentalViolations = publicFiles
      .filter(({ path }) => path !== experimentalPath)
      .flatMap(({ path, content }) =>
        ['run', 'ps', 'stop']
          .filter((command) => new RegExp(`\\bloxa\\s+${command}\\b`, 'i').test(content))
          .map((command) => `${path}: loxa ${command}`),
      );

    expect(labelLocations).toEqual([experimentalPath]);
    expect(experimental).toContain(experimentalLabel);
    expect(experimental).toContain('loxa run <id>');
    expect(experimental).toContain('loxa ps');
    expect(experimental).toContain('loxa stop <target>');
    expect(nonExperimentalViolations).toEqual([]);
  });

  test('binds command facts to the CLI reference', () => {
    const cli = contentFor('content/docs/cli.mdx');
    const required = ['loxa doctor', 'loxa list', 'loxa pull <id>', 'loxa rm <id>'];

    expect(required.filter((fact) => !cli.includes(fact))).toEqual([]);
  });

  test('binds registry rows and token variables to the models reference', () => {
    const models = contentFor('content/docs/models.mdx');
    const requiredRows = [
      '| `qwen3-coder-30b-a3b-q4` | 30B-A3B | Q4_K_M | apache-2.0 |',
      '| `qwen3-coder-30b-a3b-q8` | 30B-A3B | Q8_0 | apache-2.0 |',
      '| `qwen25-coder-7b-q4` | 7B | Q4_K_M | apache-2.0 |',
      '| `qwen25-coder-7b-q8` | 7B | Q8_0 | apache-2.0 |',
      '| `gemma-3-4b-it-q4` | 4B | Q4_K_M | gemma |',
      '| `qwen3-14b-q4` | 14B | Q4_K_M | apache-2.0 |',
    ];
    const requiredVariables = [
      'HF_TOKEN',
      'HF_TOKEN_PATH',
      'HF_HOME',
      'XDG_CACHE_HOME',
      'HF_HUB_DISABLE_IMPLICIT_TOKEN',
    ];

    expect(requiredRows.filter((row) => !models.includes(row))).toEqual([]);
    expect(requiredVariables.filter((variable) => !models.includes(variable))).toEqual([]);
  });

  test('binds version, toolchain, and license facts to project status', () => {
    const project = contentFor('content/docs/project.mdx');
    const required = ['0.1.0-dev', 'Rust 1.96.1', 'Apache License 2.0'];

    expect(required.filter((fact) => !project.includes(fact))).toEqual([]);
  });
});

describe('documentation link checker', () => {
  test('imports the generated Fumadocs source as ESM before validating links', async () => {
    const { stderr } = await execFileAsync(
      process.execPath,
      ['--import', 'tsx', join(repositoryRoot, 'scripts/check-links.ts')],
      { cwd: repositoryRoot },
    );

    expect(stderr).toBe('');
  });
});
