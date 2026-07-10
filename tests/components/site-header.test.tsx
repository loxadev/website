import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteHeader } from '@/components/site-header';

const mocks = vi.hoisted(() => ({
  setOpenSearch: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('fumadocs-ui/contexts/search', () => ({
  useSearchContext: () => ({
    enabled: true,
    open: false,
    hotKey: [],
    setOpenSearch: mocks.setOpenSearch,
  }),
}));

vi.mock('fumadocs-ui/provider/base', () => ({
  useTheme: () => ({
    resolvedTheme: 'light',
    setTheme: mocks.setTheme,
  }),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    mocks.setOpenSearch.mockReset();
    mocks.setTheme.mockReset();
  });

  it('renders the shared navigation and operates its controls', async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loxa' })).toHaveAttribute('href', '/');
    expect(container.querySelectorAll('img[src^="/brand/"]')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Search documentation' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeEnabled();

    const menuButton = screen.getByRole('button', { name: 'Open navigation' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Read docs' })).toHaveAttribute('href', '/docs');

    await user.click(screen.getByRole('button', { name: 'Search documentation' }));
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    await user.click(menuButton);

    expect(mocks.setOpenSearch).toHaveBeenCalledWith(true);
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();
  });
});
