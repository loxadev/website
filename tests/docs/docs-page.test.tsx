import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps, ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DocumentationPage from '@/app/docs/[[...slug]]/page';
import { InstallStatusList } from '@/components/install-status-list';

type TestMdxComponents = {
  h2: ComponentType<ComponentProps<'h2'>>;
  a: ComponentType<ComponentProps<'a'>>;
};

vi.mock('@/lib/source', async () => {
  const { createElement, Fragment } = await import('react');

  function pageForSlug(slug?: string[]) {
    const pageSlug = slug?.[0];
    if (pageSlug !== 'install' && pageSlug !== 'models') return undefined;

    const isInstallPage = pageSlug === 'install';
    const title = isInstallPage ? 'Install status' : 'Models';
    const heading = isInstallPage ? 'Planned installation channels' : 'Registry';

    return {
      slugs: [pageSlug],
      path: `${pageSlug}.mdx`,
      url: `/docs/${pageSlug}`,
      data: {
        title,
        description: `${title} documentation.`,
        toc: [],
        body: ({ components }: { components: TestMdxComponents }) =>
          createElement(
            Fragment,
            null,
            createElement(components.h2, { id: 'section' }, heading),
            isInstallPage
              ? createElement(
                  Fragment,
                  null,
                  createElement(InstallStatusList),
                  createElement(
                    components.a,
                    { href: 'https://github.com/loxadev/loxa' },
                    'public source',
                  ),
                )
              : null,
          ),
      },
    };
  }

  return {
    source: {
      generateParams: () => [],
      getPage: pageForSlug,
    },
  };
});

vi.mock('fumadocs-ui/page', async () => {
  const { createElement } = await import('react');

  return {
    DocsPage: ({
      children,
      toc,
      ...props
    }: ComponentProps<'main'> & { toc?: unknown }) => {
      void toc;
      return createElement('main', props, children);
    },
    DocsTitle: (props: ComponentProps<'h1'>) => createElement('h1', props),
    DocsDescription: (props: ComponentProps<'p'>) => createElement('p', props),
    DocsBody: (props: ComponentProps<'div'>) => createElement('div', props),
  };
});

afterEach(cleanup);

describe('DocumentationPage copy controls', () => {
  it('keeps copy controls on ordinary documentation pages', async () => {
    render(
      await DocumentationPage({
        params: Promise.resolve({ slug: ['models'] }),
      }),
    );

    expect(screen.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Copy Anchor Link' }).length,
    ).toBeGreaterThan(0);
  });

  it('omits copy controls from the install page while preserving its content and links', async () => {
    render(
      await DocumentationPage({
        params: Promise.resolve({ slug: ['install'] }),
      }),
    );

    expect(
      screen.queryAllByRole('button', {
        name: /^(?:Copy Markdown|Copy Anchor Link)$/,
      }),
    ).toHaveLength(0);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Install status' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Planned installation channels',
      }),
    ).toBeVisible();
    expect(screen.getByRole('list', { name: 'Installation methods' })).toBeVisible();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'curlStill in development. No supported install command yet.',
      'npmStill in development. No supported install command yet.',
      'cargoStill in development. No supported install command yet.',
      'pip / uvStill in development. No supported install command yet.',
      'brewComing soon. No supported install command yet.',
    ]);
    expect(screen.queryByRole('button', { name: /copy .* command/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Markdown' })).toHaveAttribute(
      'href',
      '/llms.mdx/docs/install',
    );
    expect(screen.getByRole('link', { name: 'Edit on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/loxadev/website/edit/main/content/docs/install.mdx',
    );
    expect(screen.getByRole('link', { name: 'public source' })).toHaveAttribute(
      'href',
      'https://github.com/loxadev/loxa',
    );
  });
});
