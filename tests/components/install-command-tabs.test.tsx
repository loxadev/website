import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InstallCommandTabs } from '@/components/install-command-tabs';
import { INSTALLERS, type Installer, type InstallerId } from '@/lib/installer-catalog';

const allUnavailableFixture = [
  {
    id: 'curl',
    label: 'curl',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'npm',
    label: 'npm',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'cargo',
    label: 'cargo',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  {
    id: 'pip-uv',
    label: 'pip / uv',
    status: 'development',
    message: 'Still in development. No supported install command yet.',
  },
  { id: 'brew', label: 'brew', status: 'coming-soon', message: 'Coming soon.' },
] as const satisfies readonly Installer[];

const availableFixture = [
  { id: 'curl', label: 'curl', status: 'available', command: 'loxa-fixture install' },
  ...allUnavailableFixture.slice(1),
] as const satisfies readonly Installer[];

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}

describe('InstallCommandTabs', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });

  it('keeps every current catalog channel unavailable and command-free', () => {
    expect(INSTALLERS).toEqual(allUnavailableFixture);
    for (const installer of INSTALLERS) {
      expect(installer.status).not.toBe('available');
      expect(installer).not.toHaveProperty('command');
    }
  });

  it('selects the first available panel and preserves tab/panel associations', () => {
    render(<InstallCommandTabs installers={availableFixture} />);

    const tab = screen.getByRole('tab', { name: 'curl' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('tabindex', '0');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    expect(screen.getByText('loxa-fixture install')).toBeVisible();
  });

  it('selects a valid explicit default and safely falls back from an invalid one', () => {
    const { unmount } = render(
      <InstallCommandTabs installers={allUnavailableFixture} defaultInstaller="pip-uv" />,
    );
    expect(screen.getByRole('tab', { name: 'pip / uv' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    unmount();
    render(
      <InstallCommandTabs
        installers={allUnavailableFixture}
        defaultInstaller={'missing' as InstallerId}
      />,
    );
    expect(screen.getByRole('tab', { name: 'curl' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves selection and focus with arrows, Home, and End', async () => {
    const user = userEvent.setup();
    render(<InstallCommandTabs installers={allUnavailableFixture} />);

    screen.getByRole('tab', { name: 'curl' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'npm' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'brew' })).toHaveFocus();
    await user.keyboard('{Home}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'brew' })).toHaveFocus();
  });

  it('scrolls the selected tab into view after keyboard selection', async () => {
    const user = userEvent.setup();
    render(<InstallCommandTabs installers={allUnavailableFixture} />);

    screen.getByRole('tab', { name: 'curl' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('renders a panel for every tab with a resolvable aria-controls target', () => {
    render(<InstallCommandTabs installers={allUnavailableFixture} />);

    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(5);
    for (const tab of screen.getAllByRole('tab')) {
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    }
  });

  it('copies only an available command and announces success', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<InstallCommandTabs installers={availableFixture} />);

    await user.click(screen.getByRole('button', { name: 'Copy curl command' }));

    expect(writeText).toHaveBeenCalledWith('loxa-fixture install');
    expect(screen.getByRole('status')).toHaveTextContent('Copied curl command.');
  });

  it('keeps the command visible and explains a rejected clipboard write', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<InstallCommandTabs installers={availableFixture} />);

    await user.click(screen.getByRole('button', { name: 'Copy curl command' }));

    expect(screen.getByText('loxa-fixture install')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not copy the command. Select and copy it manually.',
    );
  });

  it('handles a missing Clipboard API without throwing', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<InstallCommandTabs installers={availableFixture} />);

    await user.click(screen.getByRole('button', { name: 'Copy curl command' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not copy the command. Select and copy it manually.',
    );
  });

  it('clears copy feedback when the selected tab changes', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(<InstallCommandTabs installers={availableFixture} />);

    await user.click(screen.getByRole('button', { name: 'Copy curl command' }));
    await user.click(screen.getByRole('tab', { name: 'npm' }));

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('does not render copy controls for unavailable panels', () => {
    render(<InstallCommandTabs installers={allUnavailableFixture} />);

    expect(screen.queryByRole('button', { name: /copy .* command/i })).not.toBeInTheDocument();
  });

  it('does not publish a copy result that resolves after a tab change', async () => {
    const user = userEvent.setup();
    const firstWrite = deferred();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockReturnValue(firstWrite.promise) },
    });
    render(<InstallCommandTabs installers={availableFixture} />);

    await user.click(screen.getByRole('button', { name: 'Copy curl command' }));
    await user.click(screen.getByRole('tab', { name: 'npm' }));
    firstWrite.resolve();
    await Promise.resolve();

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('does not let an older overlapping copy result replace the newest feedback', async () => {
    const user = userEvent.setup();
    const firstWrite = deferred();
    const secondWrite = deferred();
    const writeText = vi.fn().mockReturnValueOnce(firstWrite.promise).mockReturnValueOnce(secondWrite.promise);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<InstallCommandTabs installers={availableFixture} />);

    const copy = screen.getByRole('button', { name: 'Copy curl command' });
    await user.click(copy);
    await user.click(copy);
    secondWrite.resolve();
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Copied curl command.');
    });
    firstWrite.reject(new Error('older failure'));
    await Promise.resolve();

    expect(screen.getByRole('status')).toHaveTextContent('Copied curl command.');
  });

  it('renders the selected unavailable message in its server HTML', () => {
    const html = renderToString(<InstallCommandTabs installers={allUnavailableFixture} />);

    expect(html).toContain('Still in development. No supported install command yet.');
  });
});
