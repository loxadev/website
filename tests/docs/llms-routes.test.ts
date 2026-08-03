import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';

import { getLlmText, type DocsPage } from '@/lib/get-llm-text';

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

  test('does not publish a retired experimental maturity label in processed Markdown', async () => {
    const page = {
      slugs: ['experimental'],
      path: 'experimental/supervisor.mdx',
      url: '/docs/experimental/supervisor',
      data: {
        title: 'Supervisor',
        description: 'Retired branch-diary fixture.',
        getText: vi.fn().mockResolvedValue('# Supervisor\n'),
      },
    } as unknown as DocsPage;

    await expect(getLlmText(page)).resolves.not.toContain('Maturity: Experimental');
  });

  test('pre-renders every current documentation page as Markdown', async () => {
    const [helper, route] = await Promise.all([
      read('lib/get-llm-text.ts'),
      read('app/llms.mdx/docs/[[...slug]]/route.ts'),
    ]);
    expect(route).toContain('source.generateParams()');
    expect(route).toContain('dynamicParams = false');
    expect(route).toContain("'text/markdown; charset=utf-8'");
    expect(route).toContain("status: 404");
    expect(helper).toContain('/edit/main/');
    expect(helper).not.toMatch(/process\.env|readFile|private-fixture-marker|\.superpowers/);
  });

  test('keeps the leak fixture synthetic while preserving the real canary elsewhere', async () => {
    const fixtureSource = await read('tests/docs/llms-routes.test.ts');
    const prohibitedIdentifier = ['internal', 'context'].join('-');

    expect(fixtureSource).not.toContain(prohibitedIdentifier);
    expect(fixtureSource).toContain('private-fixture-marker');
  });

  test('serves extensionless Markdown inline on Cloudflare Pages', async () => {
    const headers = await read('public/_headers');

    expect(headers).toContain('/llms.mdx/docs/*');
    expect(headers).toContain('Content-Type: text/markdown; charset=utf-8');
    expect(headers).toContain('Content-Disposition: inline');
  });
});
