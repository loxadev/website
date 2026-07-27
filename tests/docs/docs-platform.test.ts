import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import { INSTALLERS } from '@/lib/installer-catalog';

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
    expect(globalStyles).toContain('max-width: 920px');
    expect(globalStyles).toContain('max-width: 72ch');
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
    expect(pageText).not.toContain('tableOfContentPopover={{ enabled: false }}');
    expect(pageText).toContain('className="loxaDocsBody"');

    expect(globalStyles).toContain('@media (max-width: 1023px)');
    expect(globalStyles).toMatch(/grid-template:\s*\n\s*'header'/);
    expect(globalStyles).toContain("'main' minmax(0, 1fr) / minmax(0, 1fr) !important");
    expect(globalStyles).toContain('[data-sidebar-placeholder]');
    expect(globalStyles).toContain('[data-sidebar-panel]');
    expect(globalStyles).toContain('max-width: 920px');

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
    const marketingStyles = await readText('app/(marketing)/page.module.css');
    const layoutText = await readText('app/layout.tsx');

    expect(globalStyles).toContain('--color-fd-muted-foreground: #555c58');
    expect(globalStyles).toContain('--loxa-control-border: #69716c');
    expect(globalStyles).toContain('--loxa-control-border: #c5ddd4');
    expect(globalStyles).toContain('--loxa-control-selected-surface: #69716c');
    expect(globalStyles).toContain('--loxa-control-selected-foreground: #f4f6f0');
    expect(globalStyles).toContain('--loxa-control-selected-surface: #c5ddd4');
    expect(globalStyles).toContain('--loxa-control-selected-foreground: #101410');
    expect(globalStyles).toContain('--loxa-control-hover:');
    expect(globalStyles).toContain('--loxa-accent-hover:');
    expect(globalStyles).toContain('--loxa-surface: var(--loxa-snow)');
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
    expect(headerStyles).toMatch(
      /\.themeCell\[data-selected-theme\][\s\S]*background: var\(--loxa-control-selected-surface\)[\s\S]*color: var\(--loxa-control-selected-foreground\)/,
    );
    expect(headerStyles).not.toMatch(/:global\(\.dark\) \.primaryAction/);
    expect(headerStyles).not.toMatch(/:global\(\.dark\) \.searchButton:hover/);
    expect(marketingStyles).not.toMatch(/color-mix\(in srgb, var\(--loxa-(?:signal|glacier|snow)\)/);
    expect(marketingStyles).not.toMatch(/:global\(\.dark\) \.secondaryAction/);
    expect(layoutText).not.toContain("'themeTransition'");
  });

  test('marks generated discovery routes as static exports', async () => {
    const robotsText = await readText('app/robots.ts');
    const sitemapText = await readText('app/sitemap.ts');

    expect(robotsText).toContain("dynamic = 'force-static'");
    expect(sitemapText).toContain("dynamic = 'force-static'");
  });

  test('offers copy, view, and GitHub edit actions for processed Markdown', async () => {
    const pageText = await readText('app/docs/[[...slug]]/page.tsx');
    const actionsText = await readText('components/docs-page-actions.tsx');
    const globalStyles = await readText('app/globals.css');

    expect(pageText).toContain('DocsPageActions');
    expect(actionsText).toContain('MarkdownCopyButton');
    expect(actionsText).toContain('Copy Markdown');
    expect(actionsText).toContain('View Markdown');
    expect(actionsText).toContain('Edit on GitHub');
    expect(actionsText).toContain('min-h-11');
    expect(actionsText).toContain('border-[var(--loxa-control-border)]');
    expect(actionsText).toContain('<nav');
    expect(actionsText).toContain('aria-label="Page actions"');
    expect(globalStyles).toMatch(
      /@media \(max-width: 420px\)[\s\S]*\.loxaDocsPageActions > \*[\s\S]*width: 100%/,
    );
  });

  test('publishes installation status without unsupported commands', async () => {
    const [installText, statusListText, indexText, projectText, metaText, staticCheckText] =
      await Promise.all([
        readText('content/docs/install.mdx'),
        readText('components/install-status-list.tsx'),
        readText('content/docs/index.mdx'),
        readText('content/docs/project.mdx'),
        readText('content/docs/meta.json'),
        readText('scripts/check-static-export.mjs'),
      ]);

    const meta = JSON.parse(metaText) as { pages: string[] };

    expect(meta.pages).toContain('install');
    expect(staticCheckText).toContain("'/docs/install'");
    expect(staticCheckText).toContain("'/llms.mdx/docs/install'");
    expect(installText).toContain('There is no supported public installer yet.');
    expect(installText).toContain(
      "import { InstallStatusList } from '@/components/install-status-list';",
    );
    expect(installText).not.toContain("import { INSTALLERS } from '@/lib/installer-catalog';");
    expect(installText).toContain('<InstallStatusList />');
    expect(installText).not.toContain('<InstallStatusList installers={INSTALLERS} />');
    expect(statusListText).toContain("import { INSTALLERS } from '@/lib/installer-catalog';");
    expect(installText).not.toContain('| Channel | Status | Current instruction |');
    expect(installText).not.toContain('| Bash | Still in development |');
    expect(installText).not.toContain('| Homebrew | Coming soon |');
    expect(INSTALLERS).toHaveLength(5);
    for (const installer of INSTALLERS) {
      expect(installer).not.toHaveProperty('command');
    }
    expect(installText).not.toMatch(
      /curl\s|npm\s+(?:install|i)|cargo\s+install|pip(?:3)?\s+install|uv\s+(?:tool\s+install|add)|brew\s+install/i,
    );
    expect(indexText).toContain('Loxa is **still in development** at `0.1.0-dev`.');
    expect(indexText).toContain('[Install status](/docs/install)');
    expect(projectText).toContain('| Development stage | Still in development |');
    expect(projectText).toContain('| Platform focus | Apple Silicon first |');
    expect(projectText).toContain('| Validation | Manual stress testing in progress |');
    expect(projectText).toContain('| Public installers | No supported public installer yet |');
  });
});
