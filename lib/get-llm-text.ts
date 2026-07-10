import { source } from '@/lib/source';

export const canonicalOrigin = 'https://loxa.dev';

export type DocsPage = ReturnType<typeof source.getPages>[number];

export function isExperimentalPage(page: DocsPage): boolean {
  return page.slugs[0] === 'experimental';
}

export function isStablePage(page: DocsPage): boolean {
  return !isExperimentalPage(page);
}

export function markdownUrlForPage(page: DocsPage): string {
  return page.slugs.length === 0 ? '/llms.mdx/docs/index' : `/llms.mdx${page.url}`;
}

export function githubUrlForPage(page: DocsPage): string {
  return `https://github.com/loxadev/website/edit/main/content/docs/${page.path}`;
}

export async function getLlmText(page: DocsPage): Promise<string> {
  const markdown = (await page.data.getText('processed')).trim();
  const title = page.data.title ?? 'Loxa documentation';
  const description = page.data.description?.trim();
  const metadata = [
    `# ${title}`,
    description ? `> ${description}` : undefined,
    `Canonical: ${new URL(page.url, canonicalOrigin)}`,
    isExperimentalPage(page) ? 'Maturity: Experimental' : undefined,
  ].filter(Boolean);

  // The processed document already contains its frontmatter title as a heading in
  // some Fumadocs versions. Avoid duplicating it in the public text output.
  const withoutDuplicateTitle = markdown.replace(
    new RegExp(`^# ${escapeRegExp(title)}\\s*\\n+`),
    '',
  );

  return `${metadata.join('\n\n')}\n\n${withoutDuplicateTitle}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
