import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteHeader } from '@/components/site-header';

const mocks = vi.hoisted(() => ({
  setOpenSearch: vi.fn(),
  setTheme: vi.fn(),
  resolvedTheme: 'light',
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
    resolvedTheme: mocks.resolvedTheme,
    setTheme: mocks.setTheme,
  }),
}));

describe('SiteHeader', () => {
  beforeEach(() => {
    mocks.setOpenSearch.mockReset();
    mocks.setTheme.mockReset();
    mocks.resolvedTheme = 'light';
  });

  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('themeTransition');
    vi.unstubAllGlobals();
    vi.useRealTimers();
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
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(container.querySelectorAll('[data-theme-icon]')).toHaveLength(2);
    expect(screen.queryByText('Dark')).not.toBeInTheDocument();
    expect(screen.queryByText('Light')).not.toBeInTheDocument();

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

  it('switches back to light from the dark theme', async () => {
    mocks.resolvedTheme = 'dark';
    const user = userEvent.setup();

    render(<SiteHeader />);
    const themeButton = screen.getByRole('button', { name: 'Switch to light theme' });

    expect(themeButton).toHaveAttribute('aria-pressed', 'true');
    await user.click(themeButton);
    expect(mocks.setTheme).toHaveBeenCalledWith('light');
  });

  it('limits theme transitions to the toggle window', () => {
    vi.useFakeTimers();

    render(<SiteHeader />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).toHaveClass('themeTransition');
    vi.advanceTimersByTime(190);
    expect(document.documentElement).not.toHaveClass('themeTransition');
  });

  it('does not animate theme changes when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }),
    );
    const user = userEvent.setup();

    render(<SiteHeader />);
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement).not.toHaveClass('themeTransition');
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });
});
