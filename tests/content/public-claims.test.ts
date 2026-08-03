import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

import { INSTALLERS, type Installer } from '@/lib/installer-catalog';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const execFileAsync = promisify(execFile);
const internalContextPattern = new RegExp(
  `(?:^|[^A-Za-z0-9])${['internal', 'context'].join('[-_ ]?')}(?:[/\\\\]|$)`,
  'i',
);

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
  /coming soon/i,
  /\bcurl\b[^\n]{0,120}\|\s*(?:ba)?sh\b/i,
  /\bnpm\s+(?:install|i|exec)(?:\s+(?:-g|--global))?\s+loxa\b/i,
  /\bnpx(?:\s+(?:-y|--yes))?\s+loxa\b/i,
  /\bcargo\s+install(?:\s+--locked)?\s+loxa\b/i,
  /\bpip(?:3)?\s+install(?:\s+--user)?\s+loxa\b/i,
  /\buv\s+(?:tool\s+install(?:\s+--upgrade)?|add(?:\s+--dev)?)\s+loxa\b/i,
  /\bbrew\s+install(?:\s+--cask)?\b/i,
  /(?:private|internal)\s+(?:repository|repo)\b/i,
  /\b\d+\s+(?:users?|customers?|pilots?)\b/i,
  /\b(?:has|serves?)\s+(?:(?:\d+\s+)?(?:users?|customers?|pilots?)|(?:an?\s+)(?:customer|pilot))\b/i,
  /\b(?:generates?|reports?|has)\s+(?:(?:\$\s*)?\d[\d,]*(?:\.\d+)?(?:[kmb])?\s+(?:in\s+)?)?revenue\b/i,
  /\b(?:mrr|arr)\s*(?:is|of|:|\$|\d)/i,
  /\bretention\s+(?:is|of|at|:)\s*(?:\d|high\b|strong\b|healthy\b|positive\b)/i,
  /\b(?:has|runs?)\s+(?:\d+\s+)?enterprise deployments?\b/i,
  /\/v1\/chat\/completions/i,
  /—/,
  /\/Users\/[^/\s]+(?:\/[^\s"'<>]*)?/i,
  /(?:^|[^A-Za-z0-9])private[-_ ]?context(?:[/\\]|$)/i,
  internalContextPattern,
  /(?:^|[^A-Za-z0-9])\.superpowers(?:[/\\]|$)/i,
];

const candidatePackageName = ['lo', 'xa'].join('');
const unsupportedInstallerExamples = [
  ['curl', '-fsSL', 'https://example.invalid/installer', '|', 'bash'],
  ['npm', 'install', '-g', candidatePackageName],
  ['npx', candidatePackageName],
  ['cargo', 'install', candidatePackageName],
  ['pip', 'install', candidatePackageName],
  ['uv', 'tool', 'install', candidatePackageName],
  ['brew', 'install', candidatePackageName],
].map((tokens) => tokens.join(' '));

const optionBearingUnsupportedInstallerExamples = [
  ['npm', 'install', '--global', candidatePackageName],
  ['npx', '--yes', candidatePackageName],
  ['cargo', 'install', '--locked', candidatePackageName],
  ['pip', 'install', '--user', candidatePackageName],
  ['uv', 'tool', 'install', '--upgrade', candidatePackageName],
  ['uv', 'add', '--dev', candidatePackageName],
  ['brew', 'install', '--cask', candidatePackageName],
].map((tokens) => tokens.join(' '));

const approvedCommands = new Map([
  ['curl', ['curl', '-fsSL', 'https://loxa.dev/install.sh', '|', 'bash'].join(' ')],
  ['npm', ['npm', 'install', '-g', '@loxadev/cli', '&&', 'loxa', 'runtime', 'install'].join(' ')],
  ['cargo', ['cargo', 'install', 'loxa', '--locked', '&&', 'loxa', 'runtime', 'install'].join(' ')],
  ['pip-uv', ['uv', 'tool', 'install', 'loxa', '&&', 'loxa', 'runtime', 'install'].join(' ')],
]);

const affirmativeTractionExamples = [
  ['Loxa', 'has', 'a', 'customer'],
  ['Loxa', 'has', 'a', 'pilot'],
  ['Loxa', 'has', 'revenue'],
  ['Our', 'retention', 'is', 'high'],
].map((tokens) => tokens.join(' '));

type PublicTextFile = {
  path: string;
  content: string;
};

const groups: Array<{ directory: string; extensions: ReadonlySet<string> }> = [
  { directory: 'app', extensions: new Set(['.ts', '.tsx']) },
  { directory: 'components', extensions: new Set(['.ts', '.tsx']) },
  { directory: 'content', extensions: new Set(['.md', '.mdx', '.json']) },
  { directory: 'lib', extensions: new Set(['.ts', '.tsx']) },
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
const prohibitedIdentifier = ['internal', 'context'].join('-');

function contentFor(path: string): string {
  return publicContent.get(path) ?? '';
}

function findPublicViolations(
  files: readonly PublicTextFile[],
  installers: readonly Installer[],
): string[] {
  const fileViolations = files
    .filter(({ path }) => path !== 'lib/installer-catalog.ts')
    .flatMap(({ path, content }) =>
      forbidden
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${path}: ${pattern}`),
    );
  const catalogViolations = installers.flatMap((installer) =>
    Object.entries(installer).flatMap(([field, value]) => {
      if (typeof value !== 'string') return [];
      if (field === 'command') {
        return installer.status === 'available' &&
          approvedCommands.get(installer.id) === value
          ? []
          : [`installer ${installer.id}: unapproved command`];
      }

      return forbidden
        .filter((pattern) => pattern.test(value))
        .map((pattern) => `installer ${installer.id}.${field}: ${pattern}`);
    }),
  );

  return [...fileViolations, ...catalogViolations];
}

describe('public claim firewall', () => {
  test('permits only exact reviewed available commands', () => {
    for (const installer of INSTALLERS) {
      if (installer.status === 'available') {
        expect(approvedCommands.get(installer.id)).toBe(installer.command);
      } else {
        expect(installer).not.toHaveProperty('command');
      }
    }
  });

  test('keeps homepage product capabilities future-facing', () => {
    const homepage = contentFor('app/(marketing)/page.tsx');
    const normalizedHomepage = homepage.replace(/\s+/g, ' ');

    expect(normalizedHomepage).toContain(
      'Loxa is in early development, with Apple Silicon support first.',
    );
    expect(normalizedHomepage).toContain('The first stable release is underway.');
    expect(homepage).toContain('Loxa is being built');
    expect(homepage).toContain('href="/docs/install"');
    expect(homepage).not.toMatch(/stress testing|test evidence|owner approves|siteConfig\.version/i);
    expect(homepage).not.toMatch(
      /What works today|Current source behavior|Current Loxa workflow|Loxa (?:manages|provides|recovers)/i,
    );
  });

  test('keeps install channels non-actionable until verification', () => {
    const install = contentFor('content/docs/install.mdx');

    expect(INSTALLERS).toHaveLength(5);
    for (const installer of INSTALLERS) {
      expect(installer.status).not.toBe('available');
      expect(installer).not.toHaveProperty('command');
      if (installer.status !== 'available') {
        expect(installer.message).toBe('Not available yet.');
      }
    }
    expect(install).toContain(
      'When an option is ready, this page will include its supported copy-and-paste command.',
    );
    expect(install).not.toMatch(
      /curl\s|npm\s+(?:install|i)|npx\s+loxa|cargo\s+install|pip(?:3)?\s+install|uv\s+(?:tool\s+install|add)|brew\s+install/i,
    );
  });

  test('keeps the removed homepage-only component out of public source', () => {
    expect(contentFor('components/evidence-flow.tsx')).toBe('');
  });

  test.each(unsupportedInstallerExamples)(
    'rejects an unsupported installer canary: %s',
    (example) => {
      expect(forbidden.some((pattern) => pattern.test(example))).toBe(true);
    },
  );

  test.each(optionBearingUnsupportedInstallerExamples)(
    'rejects an option-bearing unsupported installer canary: %s',
    (example) => {
      expect(forbidden.some((pattern) => pattern.test(example))).toBe(true);
    },
  );

  test.each(affirmativeTractionExamples)(
    'rejects an unsupported affirmative traction canary: %s',
    (example) => {
      expect(forbidden.some((pattern) => pattern.test(example))).toBe(true);
    },
  );

  test.each([
    'The website does not claim customers, revenue, retention, or enterprise deployments.',
    'Customer validation is not current product behavior.',
  ])('allows neutral public-truth language: %s', (text) => {
    expect(forbidden.some((pattern) => pattern.test(text))).toBe(false);
  });

  test('rejects forbidden or unsupported public claims', () => {
    expect(findPublicViolations(publicFiles, INSTALLERS)).toEqual([]);
  });

  test.each([
    ['forbidden claim', 'Production-ready today.'],
    ['private text', prohibitedIdentifier],
    ['unsupported command', `Use ${unsupportedInstallerExamples[1]} today.`],
  ])('rejects %s embedded in an installer status message', (_label, message) => {
    const canaryCatalog = [
      {
        id: 'curl',
        label: 'curl',
        status: 'development',
        message,
      },
    ] as const satisfies readonly Installer[];

    expect(findPublicViolations([], canaryCatalog)).not.toEqual([]);
  });

  test('keeps retired branch-diary material out of public source', () => {
    const retiredPaths = [
      'content/docs/experimental/meta.json',
      'content/docs/experimental/supervisor.mdx',
    ];
    const staleClaims = [/origin\/main@/i, /feature\/supervisor/i, /14daf02/i, /a59aec2/i];

    expect(retiredPaths.map(contentFor)).toEqual(['', '']);
    expect(
      publicFiles.flatMap(({ path, content }) =>
        staleClaims
          .filter((pattern) => pattern.test(content))
          .map((pattern) => `${path}: ${pattern}`),
      ),
    ).toEqual([]);
  });

  test('binds command facts to the CLI reference', () => {
    const cli = contentFor('content/docs/cli.mdx');
    const required = [
      'loxa calibrate',
      'loxa doctor',
      'loxa pull <id> [--quant <quant>]',
      'loxa list',
      'loxa rm <id>',
      'loxa load <id>',
      'loxa unload',
      'loxa chat [--chat <id>] <prompt>',
      'loxa chats <subcommand>',
      'loxa run <id> [--ctx <u32>] [--port <u16>] [--engine <backend>]',
      'loxa serve [--model <id>] [--port <u16>] [--inference-port <u16>] [--engine <backend>]',
      'loxa ps',
      'loxa stop <target>',
    ];

    expect(required.filter((fact) => !cli.includes(fact))).toEqual([]);
    expect(cli).not.toMatch(/\bpi-acceptance\b/i);
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
      '| `gemma-4-e4b-it-q4` | E4B | Q4_K_M | apache-2.0 |',
      '| `loxa` | 12B | UD-Q4_K_XL | apache-2.0 |',
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

  test('binds current development, platform, installation, and license facts to project status', () => {
    const project = contentFor('content/docs/project.mdx');
    const required = [
      '| Development | Early development; first stable release underway |',
      '| Platform focus | Apple Silicon first |',
      '| Installation | No public install command yet |',
      'Apache License 2.0',
      'github.com/loxadev/loxa',
    ];

    expect(required.filter((fact) => !project.includes(fact))).toEqual([]);
    expect(project).not.toMatch(/manual stress|Rust 1\.96\.1|Windows|experimental/i);
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
