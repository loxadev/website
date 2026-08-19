import type { Metadata } from 'next';
import type { ComponentType } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';

vi.mock('@/lib/source', () => ({
  source: { getPages: () => [] },
}));

const technicalResponderUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSdiywaLR4RieIqkJXi1dVGqcYycfhtzTz9tNbpwomY4eujWSA/viewform';
const technicalEmbedUrl = technicalResponderUrl + '?embedded=true';
const nonTechnicalResponderUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSedsXWsjs2nmlw8luv4i5edHLz-atibAHaCuRQeSifXDw3z6Q/viewform?usp=publish-editor';
const nonTechnicalEmbedUrl = nonTechnicalResponderUrl + '&embedded=true';

describe('EarlyAccessPage', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState({}, '', '/early-access');
  });

  it('lets visitors choose either audience without changing the technical form', async () => {
    const user = userEvent.setup();
    const route = await vi
      .importActual<{
        default: ComponentType;
        metadata: Metadata;
      }>('@/app/(marketing)/early-access/page')
      .catch(() => null);

    expect(route, 'expected the /early-access route module to exist').not.toBeNull();
    if (!route) return;

    const EarlyAccessPage = route.default;
    render(<EarlyAccessPage />);

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByText('Early access · Help shape Loxa')).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Help decide what Loxa should solve first.',
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/whether you already run local ai or are just curious/i),
    ).toBeVisible();
    expect(screen.queryByTitle(/product-research form/i)).not.toBeInTheDocument();

    const technicalChoice = screen.getByRole('button', {
      name: /technical.*already use or build local ai/i,
    });
    const nonTechnicalChoice = screen.getByRole('button', {
      name: /non-technical.*new to local ai/i,
    });

    expect(technicalChoice).toHaveAttribute('aria-pressed', 'false');
    expect(nonTechnicalChoice).toHaveAttribute('aria-pressed', 'false');

    await user.click(technicalChoice);

    const technicalForm = screen.getByTitle(
      'Loxa technical early-access and product-research form',
    );
    expect(technicalForm).toHaveAttribute('src', technicalEmbedUrl);
    expect(technicalForm).toHaveAttribute('width', '100%');
    expect(technicalForm).toHaveAttribute('loading', 'lazy');
    expect(technicalChoice).toHaveAttribute('aria-pressed', 'true');
    expect(window.location.search).toBe('?audience=technical');

    const technicalFallbackLink = screen.getByRole('link', {
      name: 'Open the technical form in a new tab',
    });
    expect(technicalFallbackLink).toHaveAttribute('href', technicalResponderUrl);
    expect(
      technicalFallbackLink.compareDocumentPosition(technicalForm) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(nonTechnicalChoice);

    expect(
      screen.queryByTitle('Loxa technical early-access and product-research form'),
    ).not.toBeInTheDocument();

    const nonTechnicalForm = screen.getByTitle(
      'Loxa non-technical early-access and product-research form',
    );
    expect(nonTechnicalForm).toHaveAttribute('src', nonTechnicalEmbedUrl);
    expect(nonTechnicalChoice).toHaveAttribute('aria-pressed', 'true');
    expect(window.location.search).toBe('?audience=non-technical');
    const nonTechnicalFallbackLink = screen.getByRole('link', {
      name: 'Open the non-technical form in a new tab',
    });
    expect(nonTechnicalFallbackLink).toHaveAttribute('href', nonTechnicalResponderUrl);
    expect(
      nonTechnicalFallbackLink.compareDocumentPosition(nonTechnicalForm) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(route.metadata).toMatchObject({
      title: 'Early access',
      alternates: { canonical: '/early-access' },
      openGraph: { url: '/early-access' },
    });
  });

  it('preselects the non-technical form from its QR-code destination', async () => {
    window.history.replaceState({}, '', '/early-access?audience=non-technical');

    const route = await vi.importActual<{
      default: ComponentType;
    }>('@/app/(marketing)/early-access/page');

    render(<route.default />);

    expect(
      await screen.findByTitle('Loxa non-technical early-access and product-research form'),
    ).toHaveAttribute('src', nonTechnicalEmbedUrl);
  });

  it('publishes the early-access route in the sitemap', () => {
    expect(sitemap()).toContainEqual({ url: 'https://loxa.dev/early-access' });
  });
});
