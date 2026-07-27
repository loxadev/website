import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MarketingPage from '@/app/(marketing)/page';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('MarketingPage', () => {
  it('presents Loxa as still in development without current-availability claims', () => {
    const { container } = render(<MarketingPage />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(
      screen.getByText('Open source · Still in development · Apple Silicon first'),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Run open models reliably on your hardware.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Loxa is being built as a local AI node that will manage compatible models and a supervised runtime, then give trusted applications one local API while models and requests remain on hardware you control.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Read the docs' })).toHaveAttribute(
      'href',
      '/docs',
    );
    for (const sourceLink of screen.getAllByRole('link', { name: 'View source' })) {
      expect(sourceLink).toHaveAttribute('href', 'https://github.com/loxadev/loxa');
    }

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Install Loxa with your favorite package manager.',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('tablist', { name: 'Installation methods' }),
    ).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Running an open model is easy. Keeping it reliable is not.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Choosing a compatible model and runtime, managing processes and ports, reconnecting clients, and handling failures turns a quick local setup into ongoing operational work.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Loxa is being built to manage the node around the model, not to become another inference engine.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Manual stress testing is in progress.')).toBeVisible();
    expect(
      screen.getByText(
        'Public capability and availability statements will be added only after the owner approves the test evidence.',
      ),
    ).toBeVisible();
    expect(screen.getByText('0.1.0-dev')).toBeVisible();

    expect(screen.queryByText(/what works today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/current source behavior/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /current loxa workflow/i }),
    ).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/\bloxa (?:doctor|list|pull|run|ps|stop)\b/i);
    expect(screen.queryByRole('button', { name: /copy .* command/i })).not.toBeInTheDocument();

    const sections = Array.from(container.querySelectorAll('main > section'));
    expect(sections[1]).toHaveAttribute('aria-labelledby', 'installer-title');
    expect(sections[2]).toHaveAttribute('aria-labelledby', 'problem-title');
  });

  it('keeps homepage actions large enough for keyboard and touch use', async () => {
    const styles = await readFile(
      join(repositoryRoot, 'app/(marketing)/page.module.css'),
      'utf8',
    );

    expect(styles).toMatch(
      /\.primaryAction,\s*\.secondaryAction\s*\{[^}]*min-height:\s*48px;/,
    );
    expect(styles).not.toContain('.capabilities');
    expect(styles).not.toContain('.currentMarker');
  });

  it('keeps metadata, navigation, and footer status future-facing', async () => {
    const [site, layout, footer] = await Promise.all([
      readFile(join(repositoryRoot, 'lib/site.ts'), 'utf8'),
      readFile(join(repositoryRoot, 'app/layout.tsx'), 'utf8'),
      readFile(join(repositoryRoot, 'components/site-footer.tsx'), 'utf8'),
    ]);

    expect(site).toContain(
      'Loxa is being built as an open-source local AI node for running open models on hardware you control. Still in development and Apple Silicon first.',
    );
    expect(site).toContain("{ label: 'Product', href: '/#product-direction' }");
    expect(layout).toContain('Loxa | Local AI node in development');
    expect(footer).toContain('Still in development');
    expect(footer).toContain("{ label: 'Install status', href: '/docs/install' }");
    expect(footer).not.toContain('Early development');
  });
});
