import type { Metadata } from 'next';
import type { ComponentType } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import sitemap from '@/app/sitemap';

vi.mock('@/lib/source', () => ({
  source: { getPages: () => [] },
}));

const responderUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSdiywaLR4RieIqkJXi1dVGqcYycfhtzTz9tNbpwomY4eujWSA/viewform';
const embedUrl = responderUrl + '?embedded=true';

describe('EarlyAccessPage', () => {
  it('renders the approved low-friction research flow', async () => {
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
    expect(screen.getByText('About 45 seconds · 3 required questions')).toBeVisible();
    expect(
      screen.getByText(
        'Your email is used for early-access updates. If you volunteer, we may also contact you for product research. You can opt out at any time.',
      ),
    ).toBeVisible();

    const form = screen.getByTitle('Loxa early-access and product-research form');
    expect(form).toHaveAttribute('src', embedUrl);
    expect(form).toHaveAttribute('width', '100%');
    expect(form).toHaveAttribute('height', '2800');
    expect(form).toHaveAttribute('loading', 'lazy');

    expect(screen.getByRole('link', { name: 'Open the form in a new tab' })).toHaveAttribute(
      'href',
      responderUrl,
    );
    expect(screen.getByRole('link', { name: 'Open the form in a new tab' })).toHaveAttribute(
      'target',
      '_blank',
    );

    expect(route.metadata).toMatchObject({
      title: 'Early access',
      alternates: { canonical: '/early-access' },
      openGraph: { url: '/early-access' },
    });
  });

  it('publishes the early-access route in the sitemap', () => {
    expect(sitemap()).toContainEqual({ url: 'https://loxa.dev/early-access' });
  });
});
