import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/source', () => {
  const installPage = {
    slugs: ['install'],
    path: 'install.mdx',
    url: '/docs/install',
    data: {
      title: 'Install status',
      description: 'Planned installation channels and their current status.',
      getText: vi
        .fn()
        .mockResolvedValue(
          '## Planned installation channels\n\n<InstallStatusList />\n\nRelease gate.',
        ),
    },
  };

  return {
    source: {
      generateParams: () => [{ slug: ['install'] }],
      getPage: (slug?: string[]) => (slug?.[0] === 'install' ? installPage : undefined),
      getPages: () => [installPage],
    },
  };
});

import { GET as getFullText } from '@/app/llms-full.txt/route';
import { GET as getPageMarkdown } from '@/app/llms.mdx/docs/[[...slug]]/route';

const expectedStatusLines = [
  '- **curl:** Not available yet.',
  '- **npm:** Not available yet.',
  '- **cargo:** Not available yet.',
  '- **pip / uv:** Not available yet.',
  '- **brew:** Not available yet.',
];

async function expectInstallerCatalog(response: Response) {
  const content = await response.text();

  for (const line of expectedStatusLines) {
    expect(content).toContain(line);
  }
  expect(content).not.toContain('<InstallStatusList');
}

describe('AI-readable installer output', () => {
  test('serializes every channel state in the install Markdown route', async () => {
    await expectInstallerCatalog(
      await getPageMarkdown(new Request('https://loxa.dev/llms.mdx/docs/install'), {
        params: Promise.resolve({ slug: ['install'] }),
      }),
    );
  });

  test('serializes every channel state in the aggregate text route', async () => {
    await expectInstallerCatalog(await getFullText());
  });
});
