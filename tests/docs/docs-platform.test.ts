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
    const shellText = await readText('components/docs-shell.tsx');
    const globalStyles = await readText('app/globals.css');

    expect(shellText).toContain('DocsLayout');
    expect(shellText).toContain("'--fd-layout-width': '90rem'");
    expect(shellText).toContain("'--fd-sidebar-width': '268px'");
    expect(shellText).not.toContain("'--fd-toc-width'");
    expect(shellText).toContain('slots={{ header: DocsToolbar }}');
    expect(globalStyles).toContain('@media (min-width: 1280px)');
    expect(globalStyles).toContain('--fd-toc-width: 240px !important');
    expect(globalStyles).toContain('#nd-docs-layout [data-sidebar-placeholder]');
    expect(globalStyles).toContain('#nd-docs-layout #nd-toc');
    expect(globalStyles).toContain('top: var(--loxa-header-height)');
    expect(globalStyles).toContain('top: calc(var(--loxa-header-height) + 1rem)');
  });

  test('uses a single-column docs layout and independent navigation below desktop', async () => {
    const pageText = await readText('app/docs/[[...slug]]/page.tsx');
    const globalStyles = await readText('app/globals.css');
    const toolbarStyles = await readText('components/docs-toolbar.module.css');
    const headerStyles = await readText('components/site-header.module.css');

    expect(pageText).toContain('role="main"');
    expect(pageText).toContain('tableOfContentPopover={{ enabled: false }}');

    expect(globalStyles).toContain('@media (max-width: 1023px)');
    expect(globalStyles).toMatch(/grid-template:\s*\n\s*'header'/);
    expect(globalStyles).toContain("'main' minmax(0, 1fr) / minmax(0, 1fr) !important");
    expect(globalStyles).toContain('[data-sidebar-placeholder]');
    expect(globalStyles).toContain('[data-sidebar-panel]');
    expect(globalStyles).toContain('max-width: 808px');

    expect(toolbarStyles).toContain('min-width: 44px');
    expect(toolbarStyles).toContain('min-height: 44px');
    expect(toolbarStyles).toContain('backdrop-filter: none');
    expect(headerStyles).toContain('z-index: 40');
  });

  test('gives sidebar and document copy controls 44-pixel targets', async () => {
    const globalStyles = await readText('app/globals.css');

    expect(globalStyles).toMatch(
      /#nd-sidebar a,\s*#nd-sidebar button,\s*#main-content button\[aria-label='Copy Anchor Link'\],\s*#main-content button\[aria-label='Copy Text'\],\s*#main-content button\[aria-label='Copied Text'\]\s*\{\s*min-width: 44px;\s*min-height: 44px;/,
    );
  });

  test('removes every backdrop blur utility used by the documentation UI', async () => {
    const globalStyles = await readText('app/globals.css');

    expect(globalStyles).toMatch(
      /\.backdrop-blur-xs,\s*\.backdrop-blur-sm,\s*\.backdrop-blur-lg\s*\{\s*-webkit-backdrop-filter: none !important;\s*backdrop-filter: none !important;/,
    );
  });

  test('centers code block copy controls vertically', async () => {
    const globalStyles = await readText('app/globals.css');

    expect(globalStyles).toMatch(
      /#main-content figure > \.backdrop-blur-lg\s*\{\s*top: 0;\s*bottom: 0;\s*display: flex;\s*align-items: center;/,
    );
  });

  test('uses the accessible theme contrast and motion contract', async () => {
    const globalStyles = await readText('app/globals.css');
    const headerStyles = await readText('components/site-header.module.css');

    expect(globalStyles).toContain('--color-fd-muted-foreground: #555c58');
    expect(globalStyles).toMatch(
      /\.themeTransition[\s\S]*transition-property:[^;]*color[^;]*background-color[^;]*border-color[^;]*outline-color[^;]*fill[^;]*stroke/,
    );
    expect(globalStyles).toContain('transition-duration: 190ms');
    expect(globalStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.themeTransition[\s\S]*transition-duration: 0\.01ms !important/,
    );
    expect(globalStyles).not.toMatch(/transition:\s*all\b/);
    expect(headerStyles).toContain('width: 72px');
    expect(headerStyles).toContain('height: 44px');
  });

  test('marks generated discovery routes as static exports', async () => {
    const robotsText = await readText('app/robots.ts');
    const sitemapText = await readText('app/sitemap.ts');

    expect(robotsText).toContain("dynamic = 'force-static'");
    expect(sitemapText).toContain("dynamic = 'force-static'");
  });
});
