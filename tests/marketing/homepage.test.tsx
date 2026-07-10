import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MarketingPage from '@/app/(marketing)/page';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('MarketingPage', () => {
  it('presents the current public Loxa workflow without unverified claims', () => {
    const { container } = render(<MarketingPage />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Open-source CLI · Early development')).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Inspect your machine. Manage local model files.',
      }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Read the docs' })).toHaveAttribute(
      'href',
      '/docs',
    );
    expect(screen.getByRole('link', { name: 'View source' })).toHaveAttribute(
      'href',
      'https://github.com/loxadev/loxa',
    );
    expect(screen.getByText('0.1.0-dev')).toBeVisible();
    expect(screen.queryByText(/install/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/benchmark|fastest|production-ready|openai-compatible/i),
    ).not.toBeInTheDocument();

    expect(container.querySelector('section#capabilities')).toBeInTheDocument();
    const workflow = screen.getByRole('region', { name: 'Current Loxa workflow' });
    expect(workflow).toBeVisible();
    expect(within(workflow).getByText('loxa doctor')).toBeVisible();
    expect(within(workflow).getByText('loxa list')).toBeVisible();
    expect(within(workflow).getByText('loxa pull <model-id>')).toBeVisible();
    expect(within(workflow).getByText('~/.loxa/models')).toBeVisible();
    expect(within(workflow).getByText('Size and SHA-256 checks').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );

    for (const image of container.querySelectorAll('[role="img"]')) {
      expect(
        image.hasAttribute('aria-label') || image.hasAttribute('aria-labelledby'),
      ).toBe(true);
    }
  });

  it('keeps capability numbers beside their content without empty alternating columns', async () => {
    const styles = await readFile(
      join(repositoryRoot, 'app/(marketing)/page.module.css'),
      'utf8',
    );

    expect(styles).toContain(
      'grid-template-columns: 64px minmax(0, 1fr);',
    );
    expect(styles).not.toContain('.narrativeRow:nth-child(even)');
  });
});
