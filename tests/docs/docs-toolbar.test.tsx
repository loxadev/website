import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsToolbar } from '@/components/docs-toolbar';

const mocks = vi.hoisted(() => ({
  setOpenSearch: vi.fn(),
  addBreakpointListener: vi.fn(),
  removeBreakpointListener: vi.fn(),
}));

vi.mock('fumadocs-ui/contexts/search', () => ({
  useSearchContext: () => ({ setOpenSearch: mocks.setOpenSearch }),
}));

vi.mock('fumadocs-ui/contexts/tree', () => ({
  useTreeContext: () => ({
    root: {
      $id: 'root',
      type: 'root',
      name: 'Documentation',
      children: [
        { $id: 'overview', type: 'page', name: 'Overview', url: '/docs' },
        {
          $id: 'installation',
          type: 'page',
          name: 'Installation',
          url: '/docs/install',
        },
        { $id: 'models', type: 'page', name: 'Models', url: '/docs/models' },
      ],
    },
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/docs/models',
}));

vi.mock('next/link', () => ({
  default: ({ href, onClick, ...props }: ComponentProps<'a'>) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    />
  ),
}));

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    },
  });

  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });
});

afterEach(cleanup);

describe('DocsToolbar', () => {
  beforeEach(() => {
    mocks.setOpenSearch.mockReset();
    mocks.addBreakpointListener.mockReset();
    mocks.removeBreakpointListener.mockReset();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addEventListener: mocks.addBreakpointListener,
        removeEventListener: mocks.removeBreakpointListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('opens a tree-backed dialog and exposes the active documentation page', async () => {
    const user = userEvent.setup();
    render(<DocsToolbar />);

    const trigger = screen.getByRole('button', {
      name: 'Open documentation navigation',
    });
    expect(trigger).toHaveAttribute('aria-controls', 'docs-navigation-dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Documentation' });
    expect(dialog).toHaveAttribute('open');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'Models' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Installation' })).toHaveAttribute(
      'href',
      '/docs/install',
    );
    expect(screen.queryByRole('link', { name: 'Supervisor' })).not.toBeInTheDocument();
  });

  it('closes on cancel, link activation, backdrop, close control, and desktop crossing', async () => {
    const user = userEvent.setup();
    render(<DocsToolbar />);
    const trigger = screen.getByRole('button', {
      name: 'Open documentation navigation',
    });

    await user.click(trigger);
    fireEvent(
      screen.getByRole('dialog', { name: 'Documentation' }),
      new Event('cancel', { cancelable: true }),
    );
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('link', { name: 'Installation' }));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));

    await user.click(trigger);
    fireEvent.click(screen.getByRole('dialog', { name: 'Documentation' }));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close documentation navigation' }));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));

    await user.click(trigger);
    const breakpointListener = mocks.addBreakpointListener.mock.calls[0]?.[1];
    expect(breakpointListener).toBeTypeOf('function');
    act(() => breakpointListener({ matches: true } as MediaQueryListEvent));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(mocks.removeBreakpointListener).not.toHaveBeenCalled();
  });

  it('closes on a window Escape key event and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<DocsToolbar />);
    const trigger = screen.getByRole('button', {
      name: 'Open documentation navigation',
    });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(trigger).toHaveFocus();
  });

  it('opens documentation search from a standalone 44-pixel control', async () => {
    const user = userEvent.setup();
    render(<DocsToolbar />);

    await user.click(screen.getByRole('button', { name: 'Search documentation' }));

    expect(mocks.setOpenSearch).toHaveBeenCalledWith(true);
  });
});
