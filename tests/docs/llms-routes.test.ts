import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path: string) => readFile(join(root, path), 'utf8');

describe('AI-readable documentation routes', () => {
  test('enables processed Markdown and publishes a canonical Fumadocs index', async () => {
    const [config, route] = await Promise.all([
      read('source.config.ts'),
      read('app/llms.txt/route.ts'),
    ]);
    expect(config).toContain('includeProcessedMarkdown: true');
    expect(route).toContain('llms(source)');
    expect(route).toContain("dynamic = 'force-static'");
    expect(route).toContain('canonicalOrigin');
  });

  test('aggregates stable processed Markdown only', async () => {
    const [helper, route] = await Promise.all([
      read('lib/get-llm-text.ts'),
      read('app/llms-full.txt/route.ts'),
    ]);
    expect(helper).toContain("getText('processed')");
    expect(helper).toContain("page.slugs[0] === 'experimental'");
    expect(route).toContain('filter(isStablePage)');
    expect(route).toContain("dynamic = 'force-static'");
  });

  test('pre-renders every page and labels experimental output', async () => {
    const [helper, route] = await Promise.all([
      read('lib/get-llm-text.ts'),
      read('app/llms.mdx/docs/[[...slug]]/route.ts'),
    ]);
    expect(route).toContain('source.generateParams()');
    expect(route).toContain('dynamicParams = false');
    expect(route).toContain("'text/markdown; charset=utf-8'");
    expect(route).toContain("status: 404");
    expect(helper).toContain('Maturity: Experimental');
    expect(helper).toContain('/edit/main/');
    expect(helper).not.toMatch(/process\.env|readFile|internal-context|\.superpowers/);
  });
});
