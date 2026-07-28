import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function readText(relativePath: string): Promise<string> {
  try {
    return await readFile(join(repositoryRoot, relativePath), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

async function sha256(relativePath: string): Promise<string> {
  const contents = await readFile(join(repositoryRoot, relativePath));
  return createHash('sha256').update(contents).digest('hex');
}

function pngDimensions(contents: Buffer): { width: number; height: number } {
  expect(contents.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(contents.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return {
    width: contents.readUInt32BE(16),
    height: contents.readUInt32BE(20),
  };
}

function icoDimensions(contents: Buffer): string[] {
  expect(contents.readUInt16LE(0)).toBe(0);
  expect(contents.readUInt16LE(2)).toBe(1);
  const count = contents.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    const width = contents[offset] || 256;
    const height = contents[offset + 1] || 256;
    return `${width}x${height}`;
  }).sort();
}

const packageJson = JSON.parse(await readText('package.json')) as {
  packageManager: string;
  engines: { node: string };
};
const tsConfig = JSON.parse(await readText('tsconfig.json')) as {
  compilerOptions: {
    incremental?: boolean;
    tsBuildInfoFile?: string;
  };
  include?: string[];
};
const nextEnvironmentTypes = await readText('next-env.d.ts');
const nextConfigText = await readText('next.config.mjs');
const rootLayoutText = await readText('app/layout.tsx');
const sourceConfigText = await readText('source.config.ts');
const gitAttributes = await readText('.gitattributes');
const brandDirectory = join(repositoryRoot, 'public/brand');
const brandFiles = (await readdir(brandDirectory))
  .filter((file) => file.endsWith('.svg'))
  .sort();
const brandSvg = (
  await Promise.all(brandFiles.map((file) => readFile(join(brandDirectory, file), 'utf8')))
).join('\n');

describe('deterministic static platform', () => {
  test('pins the package manager and Node runtime', () => {
    expect(packageJson.packageManager).toBe('pnpm@11.11.0');
    expect(packageJson.engines.node).toBe('>=22.13 <23');
  });

  test('enables a portable static export', () => {
    expect(nextConfigText).toContain("output: 'export'");
    expect(nextConfigText).toContain('unoptimized: true');
  });

  test('declares smooth scrolling to Next.js on the root element', () => {
    expect(rootLayoutText).toContain('data-scroll-behavior="smooth"');
  });

  test('commits the Next TypeScript baseline without leaking incremental state', () => {
    expect(nextEnvironmentTypes).toContain('/// <reference types="next" />');
    expect(nextEnvironmentTypes).toContain('import "./.next/types/routes.d.ts";');
    expect(tsConfig.include).toContain('.next/dev/types/**/*.ts');
    expect(tsConfig.compilerOptions.incremental).toBe(true);
    expect(tsConfig.compilerOptions.tsBuildInfoFile).toBe(
      '.next/cache/tsconfig.tsbuildinfo',
    );
  });

  test('reads documentation from the canonical content directory', () => {
    expect(sourceConfigText).toContain("dir: 'content/docs'");
  });

  test('vendors the audited official font files and licenses', async () => {
    expect(await sha256('app/fonts/InstrumentSans-Variable.woff2')).toBe(
      'aa72922aafcc0dc18f36ec1d805b0212057dabe8b9d5b8b57f67035aea1b826d',
    );
    expect(await sha256('app/fonts/IBMPlexMono-Regular.woff2')).toBe(
      'ba204497f16b6d334cee9d1e963a831b73e3a56e1d6300a8489d18df7214b350',
    );
    expect(await sha256('app/fonts/IBMPlexMono-Medium.woff2')).toBe(
      '33faf307fa6031fb4062276d7320a6d632de890cbb347576fd80cfa01077bc25',
    );
    expect(await sha256('app/fonts/LICENSE-instrument-sans.txt')).toBe(
      '9e27a72ed30eb49a08678f6a5d6ed98ec7ba5368f541637ee0683ec9134ef966',
    );
    expect(await sha256('app/fonts/LICENSE-ibm-plex.txt')).toBe(
      '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
    );
  });

  test('scopes vendored license whitespace exceptions', () => {
    expect(gitAttributes.split(/\r?\n/)).toContain(
      'app/fonts/LICENSE-*.txt whitespace=-blank-at-eol,cr-at-eol',
    );
  });

  test('keeps the immutable brand marks path-only', () => {
    expect(brandFiles.length).toBeGreaterThan(0);
    expect(brandSvg).not.toMatch(/<(?:filter|mask|clipPath|rect|circle|ellipse)\b/);
    expect(brandSvg).not.toMatch(/\b(?:transform|stroke)=/);
  });

  test('commits the approved cross-browser favicon assets', async () => {
    expect(await sha256('app/icon.svg')).toBe(
      'f3db540bdb0f0f8b9b25f4f6ae9a6ee3b5de973057c1703ebfa4f3563fb47a9d',
    );

    const icon32 = await readFile(join(repositoryRoot, 'app/icon1.png'));
    const appleIcon = await readFile(join(repositoryRoot, 'app/apple-icon.png'));
    const favicon = await readFile(join(repositoryRoot, 'app/favicon.ico'));
    const svg = await readText('app/icon.svg');

    expect(pngDimensions(icon32)).toEqual({ width: 32, height: 32 });
    expect(pngDimensions(appleIcon)).toEqual({ width: 180, height: 180 });
    expect(icoDimensions(favicon)).toEqual(['16x16', '32x32', '48x48']);
    expect(svg).toContain('fill="#101410"');
    expect(svg).toContain('fill="#F4F6F0"');
  });
});
