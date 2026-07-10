import { readFile } from 'node:fs/promises';
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

describe('static documentation platform', () => {
  test('loads docs at the canonical route and enumerates every static page', async () => {
    const sourceText = await readText('lib/source.ts');
    const pageText = await readText('app/docs/[[...slug]]/page.tsx');

    expect(sourceText).toContain("baseUrl: '/docs'");
    expect(pageText).toContain('source.generateParams()');
    expect(pageText).toContain('dynamicParams = false');
    expect(pageText).toContain('source.getPage');
  });

  test('exports an Orama search index at build time', async () => {
    const searchText = await readText('app/api/search/route.ts');

    expect(searchText).toContain('createFromSource(source)');
    expect(searchText).toContain('staticGET: GET');
    expect(searchText).toContain('revalidate = false');
  });

  test('uses the approved docs column widths', async () => {
    const layoutText = await readText('app/docs/layout.tsx');

    expect(layoutText).toContain('DocsLayout');
    expect(layoutText).toContain("'--fd-sidebar-width': '268px'");
    expect(layoutText).toContain("'--fd-toc-width': '240px'");
  });

  test('marks generated discovery routes as static exports', async () => {
    const robotsText = await readText('app/robots.ts');
    const sitemapText = await readText('app/sitemap.ts');

    expect(robotsText).toContain("dynamic = 'force-static'");
    expect(sitemapText).toContain("dynamic = 'force-static'");
  });
});
