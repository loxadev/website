import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MarketingPage from '@/app/(marketing)/page';

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

    for (const image of container.querySelectorAll('[role="img"]')) {
      expect(
        image.hasAttribute('aria-label') || image.hasAttribute('aria-labelledby'),
      ).toBe(true);
    }
  });
});
