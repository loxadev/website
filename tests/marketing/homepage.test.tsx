import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { metadata } from '@/app/layout';
import MarketingPage from '@/app/(marketing)/page';
import { SiteFooter } from '@/components/site-footer';
import { INSTALLERS } from '@/lib/installer-catalog';
import { siteConfig, siteLinks } from '@/lib/site';

vi.mock('next/font/local', () => ({
  default: () => ({ variable: 'font-variable' }),
}));

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('MarketingPage', () => {
  it('presents Loxa as an early-development local node without install commands', () => {
    const { container } = render(<MarketingPage />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Open source · Apple Silicon first')).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Run open models reliably on your hardware.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Loxa is an open-source local AI node for running open models on hardware you control. It is being built to manage compatible models and the runtime behind one local API.',
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
      screen.getByText(
        'Package manager installs are still in development. Commands will appear here when they are ready.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('tablist', { name: 'Installation methods' }),
    ).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(INSTALLERS.some((installer) => installer.status === 'available')).toBe(false);
    const unavailableMessages = screen.getAllByText('Not available yet.');
    expect(unavailableMessages).toHaveLength(5);
    expect(unavailableMessages[0]).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Running an open model is easy. Keeping it reliable is not.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'A quick local setup turns into ongoing work: choosing a compatible model and runtime, managing processes and ports, reconnecting clients, and handling failures.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Loxa is being built to handle the setup around the model, not replace the engine that runs it.',
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Development status')).toHaveTextContent(
      /^Loxa is in early development, with Apple Silicon support first\. The first stable release is underway\.$/,
    );
    expect(screen.getByLabelText('Development status')).not.toHaveTextContent(
      /0\.1\.0-dev|stress testing|test evidence|owner approves/i,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What Loxa is being built to do',
      }),
    ).toBeVisible();
    expect(screen.getByText('In development')).toBeVisible();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '01Match your hardware with a compatible model.',
      '02Download and verify model files.',
      '03Keep the model server running.',
      '04Give local apps one API.',
      '05Start with one dependable local node, then grow from there.',
    ]);

    const sourceSection = screen
      .getByRole('heading', { level: 2, name: 'Open source.' })
      .closest('section');
    expect(sourceSection).not.toBeNull();
    expect(sourceSection).toHaveTextContent(
      'Loxa is available under the Apache License 2.0. The source is on GitHub.',
    );
    expect(within(sourceSection!).getByRole('link', { name: 'Apache License 2.0' })).toHaveAttribute(
      'href',
      'https://github.com/loxadev/loxa/blob/main/LICENSE',
    );
    expect(within(sourceSection!).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/loxadev/loxa',
    );
    expect(within(sourceSection!).getAllByRole('link')).toHaveLength(2);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Explore the documentation.' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'CLI reference' })).toHaveAttribute(
      'href',
      '/docs/cli',
    );

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

  it('keeps installer labels distinct from descriptive copy styling', async () => {
    const [homepage, styles] = await Promise.all([
      readFile(join(repositoryRoot, 'app/(marketing)/page.tsx'), 'utf8'),
      readFile(join(repositoryRoot, 'app/(marketing)/page.module.css'), 'utf8'),
    ]);

    expect(homepage).toContain(
      '<p className={styles.sectionLabel}>Still in development</p>',
    );
    expect(homepage).toContain('<p className={styles.installerDescription}>');
    expect(styles).toMatch(
      /\.installerDescription,\s*\.problemContext,\s*\.problemFocus\s*\{[^}]*font-size:/,
    );
    expect(styles).not.toContain('.installerCopy > p');
  });

  it('publishes exact metadata and footer status through rendered public contracts', () => {
    const title = 'Loxa | Open models on your hardware';
    const description =
      'Loxa is an open-source local AI node for running open models on hardware you control. It is in early development, with Apple Silicon support first.';

    expect(siteConfig.description).toBe(description);
    expect(siteLinks).toContainEqual({ label: 'Product', href: '/#product-direction' });
    expect(metadata.title).toEqual({ default: title, template: '%s | Loxa' });
    expect(metadata.description).toBe(description);
    expect(metadata.openGraph).toMatchObject({ title, description });
    expect(metadata.twitter).toMatchObject({ card: 'summary', title, description });

    render(<SiteFooter />);

    const footer = screen.getByRole('contentinfo');
    const footerStatus = within(footer).getByText(
      (_content, element) =>
        element?.tagName === 'P' &&
        element.textContent === 'Early development · Apple Silicon first',
    );
    expect(footerStatus).toBeVisible();
    expect(within(footer).getByRole('link', { name: 'Installation' })).toHaveAttribute(
      'href',
      '/docs/install',
    );
  });
});
