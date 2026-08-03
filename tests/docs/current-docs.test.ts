import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const execFileAsync = promisify(execFile);

const currentDocsRoutes = [
  '/docs',
  '/docs/install',
  '/docs/doctor',
  '/docs/models',
  '/docs/cli',
  '/docs/troubleshooting',
  '/docs/project',
];

const currentCliCommands = [
  'loxa calibrate',
  'loxa doctor',
  'loxa pull <id-or-reference> [--quant <quant>]',
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

const currentModelRows = [
  ['`qwen3-coder-30b-a3b-q4`', '30B-A3B', 'Q4_K_M', 'apache-2.0'],
  ['`qwen3-coder-30b-a3b-q8`', '30B-A3B', 'Q8_0', 'apache-2.0'],
  ['`qwen25-coder-7b-q4`', '7B', 'Q4_K_M', 'apache-2.0'],
  ['`qwen25-coder-7b-q8`', '7B', 'Q8_0', 'apache-2.0'],
  ['`gemma-3-4b-it-q4`', '4B', 'Q4_K_M', 'gemma'],
  ['`qwen3-14b-q4`', '14B', 'Q4_K_M', 'apache-2.0'],
  ['`gemma-4-e4b-it-q4`', 'E4B', 'Q4_K_M', 'apache-2.0'],
  ['`loxa`', '12B', 'UD-Q4_K_XL', 'apache-2.0'],
];

type DocumentationSnapshot = {
  url: string;
  slugs: string[];
  title?: string;
  description?: string;
  text: string;
};

const sourceSnapshotProgram = `
import { register } from 'fumadocs-mdx/node';

register();

const { source } = await import('./lib/source.ts');
const pages = await Promise.all(
  source.getPages().map(async (page) => ({
    url: page.url,
    slugs: page.slugs,
    title: page.data.title,
    description: page.data.description,
    text: await page.data.getText('processed'),
  })),
);
process.stdout.write(JSON.stringify(pages));
`;

let snapshots: Promise<DocumentationSnapshot[]> | undefined;

function docs(): Promise<DocumentationSnapshot[]> {
  snapshots ??= execFileAsync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '--eval', sourceSnapshotProgram],
    { cwd: repositoryRoot },
  ).then(({ stdout, stderr }) => {
    if (stderr) throw new Error(stderr);
    return JSON.parse(stdout) as DocumentationSnapshot[];
  });
  return snapshots;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tableRows(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.trimStart().startsWith('|'))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll('\\_', '_')),
    )
    .filter((row) => !row.every((cell) => /^-+$/.test(cell)));
}

function pageFor(pages: readonly DocumentationSnapshot[], slug?: string[]): DocumentationSnapshot {
  const page = pages.find((candidate) =>
    candidate.slugs.join('/') === (slug ?? []).join('/'),
  );
  if (!page) throw new Error(`Missing documentation page: /docs/${slug?.join('/') ?? ''}`);
  return page;
}

describe('current public documentation', () => {
  test('registers only current documentation routes and labels the installation page', async () => {
    const pages = await docs();

    expect(pages.map((page) => page.url).sort()).toEqual([...currentDocsRoutes].sort());
    expect(pageFor(pages, ['install']).title).toBe('Installation');
    expect(pages.find((page) => page.url === '/docs/experimental/supervisor')).toBeUndefined();
  });

  test('publishes the approved early-development and installation status', async () => {
    const pages = await docs();
    const indexPage = pageFor(pages);
    const index = indexPage.text;
    const install = pageFor(pages, ['install']).text;
    const project = pageFor(pages, ['project']).text;

    expect(indexPage.description).toBe(
      'Reference for Loxa, an open-source local AI node in early development.',
    );
    expect(normalize(index)).toContain(
      'Loxa is in early development, with Apple Silicon support first. The first stable release is underway.',
    );
    expect(normalize(index)).toContain(
      'These pages describe the CLI and model-management features in the current public source. Details may change before the first stable release.',
    );
    expect(normalize(index)).toContain(
      'Installation options are being prepared. No public install command is available yet; see [Installation](/docs/install).',
    );
    expect(normalize(install)).toContain(
      'Installation options are being prepared. No public install command is available yet.',
    );
    expect(install).toContain('## Installation options');
    expect(normalize(install)).toContain(
      'When an option is ready, this page will include its supported copy-and-paste command.',
    );
    expect(normalize(project)).toContain(
      'Loxa is in early development. This page summarizes what is available today and what is still being prepared.',
    );
    expect(tableRows(project)).toEqual([
      ['Item', 'Status'],
      ['Development', 'Early development; first stable release underway'],
      ['Platform focus', 'Apple Silicon first'],
      ['Installation', 'No public install command yet'],
      ['License', '[Apache License 2.0](https://github.com/loxadev/loxa/blob/main/LICENSE)'],
      ['Source', '[github.com/loxadev/loxa](https://github.com/loxadev/loxa)'],
    ]);
  });

  test('uses branch-neutral troubleshooting metadata', async () => {
    const troubleshooting = pageFor(await docs(), ['troubleshooting']);

    expect(troubleshooting.description).toBe(
      'Evidence-backed checks for common public CLI errors.',
    );
  });

  test('documents the current ordinary CLI surface without acceptance tooling', async () => {
    const cli = pageFor(await docs(), ['cli']).text;

    expect(currentCliCommands.filter((command) => !cli.includes(command))).toEqual([]);
    expect(tableRows(cli)).toContainEqual([
      '`loxa pull <id-or-reference> [--quant <quant>]`',
      'Required built-in/user registry ID or Hugging Face reference',
      'Download a registry model or resolve and download a Hugging Face model.',
    ]);
    expect(normalize(cli)).toContain(
      'The required argument is either a built-in or user registry ID, or a Hugging Face reference.',
    );
    expect(normalize(cli)).toContain(
      '`owner/repo` or `hf://owner/repo[@revision][:filename]`.',
    );
    expect(normalize(cli)).toContain(
      '`--quant <quant>` participates only in Hugging Face resolution, where it selects a matching verified GGUF.',
    );
    expect(normalize(cli)).toContain(
      'For a registry ID, the registry path ignores `--quant`.',
    );
    expect(tableRows(cli)).toContainEqual([
      '`loxa run <id> [--ctx <u32>] [--port <u16>] [--engine <backend>]`',
      'Required model',
      'Start one managed model runtime.',
    ]);
    expect(tableRows(cli)).toContainEqual([
      '`loxa serve [--model <id>] [--port <u16>] [--inference-port <u16>] [--engine <backend>]`',
      'Optional model',
      'Start a managed node.',
    ]);
    expect(cli).not.toMatch(/\bpi-acceptance\b/i);
  });

  test('lists every current built-in model with its registry metadata', async () => {
    const models = pageFor(await docs(), ['models']).text;

    expect(models).toContain('The built-in registry contains these eight IDs:');
    expect(tableRows(models).filter((row) => row[0]?.startsWith('`'))).toEqual(currentModelRows);
  });

  test('keeps stable documentation free of stale source snapshots and branch diary claims', async () => {
    const text = (await docs()).map((page) => page.text);

    expect(text.join('\n')).not.toMatch(/origin\/main@|feature\/supervisor|14daf02|a59aec2/i);
  });
});
