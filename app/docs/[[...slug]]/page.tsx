import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';

import { DocsPageActions } from '@/components/docs-page-actions';
import { githubUrlForPage, markdownUrlForPage } from '@/lib/get-llm-text';
import { source } from '@/lib/source';
import { getMDXComponents, headingsWithoutCopyControls } from '@/mdx-components';

type PageProps = Readonly<{
  params: Promise<{ slug?: string[] }>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: new URL(page.url, 'https://loxa.dev').toString(),
    },
  };
}

export default async function DocumentationPage({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) notFound();

  const MDX = page.data.body;
  const isInstallPage = page.url === '/docs/install';

  return (
    <DocsPage
      toc={page.data.toc}
      id="main-content"
      role="main"
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsPageActions
        githubUrl={githubUrlForPage(page)}
        markdownUrl={markdownUrlForPage(page)}
        showCopyMarkdown={!isInstallPage}
      />
      <DocsBody className="loxaDocsBody">
        <MDX
          components={getMDXComponents(
            isInstallPage ? headingsWithoutCopyControls : undefined,
          )}
        />
      </DocsBody>
    </DocsPage>
  );
}
