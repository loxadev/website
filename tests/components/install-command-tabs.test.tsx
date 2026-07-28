import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InstallCommandTabs } from '@/components/install-command-tabs';
import { INSTALLERS, type Installer, type InstallerId } from '@/lib/installer-catalog';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

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

const allowedColorKeywords = new Set(
  [
    'accentcolor',
    'accentcolortext',
    'activetext',
    'buttonborder',
    'buttonface',
    'buttontext',
    'canvas',
    'canvastext',
    'currentcolor',
    'field',
    'fieldtext',
    'graytext',
    'highlight',
    'highlighttext',
    'inherit',
    'initial',
    'linktext',
    'mark',
    'marktext',
    'revert',
    'revert-layer',
    'selecteditem',
    'selecteditemtext',
    'transparent',
    'unset',
    'visitedtext',
  ],
);
const literalColorSyntax =
  /#[\da-f]{3,8}\b|(?:color|color-mix|device-cmyk|hsl|hsla|hwb|lab|lch|light-dark|oklab|oklch|rgb|rgba)\s*\([^;{}]*?\)/gi;

function isNamedCssColor(token: string): boolean {
  if (allowedColorKeywords.has(token.toLowerCase())) return false;

  const probe = document.createElement('span').style;
  probe.color = '';
  probe.color = token;
  return probe.color !== '';
}

function isColorCapableProperty(property: string): boolean {
  const normalized = property.toLowerCase().replace(/^--/, '');

  return (
    /^(?:accent|background|border|caret|column-rule|filter|mask|outline|scrollbar|text-decoration|text-emphasis)(?:-|$)/.test(
      normalized,
    ) ||
    /(?:^|-)(?:color|fill|shadow|stroke)(?:-|$)/.test(normalized) ||
    /^(?:brand|foreground|ink|surface|text)(?:-|$)/.test(normalized)
  );
}

function findLiteralColorValues(styles: string): string[] {
  const withoutComments = styles.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarationValues = Array.from(
    withoutComments.matchAll(/(?:^|[;{])\s*([-\w]+)\s*:\s*([^;{}]+);/gm),
    (match) => ({ property: match[1], value: match[2].trim() }),
  ).filter(({ property }) => isColorCapableProperty(property));

  return declarationValues.flatMap(({ value }) => {
    const scannableValue = value
      .replace(/url\([^)]*\)/gi, ' ')
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');
    const explicitSyntax = Array.from(
      scannableValue.matchAll(literalColorSyntax),
      (match) => match[0],
    );
    const keywordSource = scannableValue
      .replace(literalColorSyntax, ' ')
      .replace(/--[A-Za-z0-9_-]+/g, ' ');
    const namedColors = (keywordSource.match(/[A-Za-z][A-Za-z-]*/g) ?? []).filter(
      isNamedCssColor,
    );

    return [...explicitSyntax, ...namedColors];
  });
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
    const npmTab = screen.getByRole('tab', { name: 'npm' });
    expect(npmTab).toHaveFocus();
    expect(npmTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', npmTab.id);
    await user.keyboard('{End}');
    const brewTab = screen.getByRole('tab', { name: 'brew' });
    expect(brewTab).toHaveFocus();
    expect(brewTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/^Coming soon\.$/);
    await user.keyboard('{Home}{ArrowLeft}');
    expect(brewTab).toHaveFocus();
    expect(brewTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/^Coming soon\.$/);
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

  it('keeps tab and panel identifiers unique across component instances', () => {
    render(
      <>
        <InstallCommandTabs installers={allUnavailableFixture} />
        <InstallCommandTabs installers={allUnavailableFixture} />
      </>,
    );

    const tabs = screen.getAllByRole('tab');
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(new Set(tabs.map((tab) => tab.id)).size).toBe(tabs.length);
    expect(new Set(panels.map((panel) => panel.id)).size).toBe(panels.length);
    for (const tab of tabs) {
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

  it('clears stale feedback while a repeated copy attempt is pending and announces it again', async () => {
    const user = userEvent.setup();
    const secondWrite = deferred();
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(secondWrite.promise);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(<InstallCommandTabs installers={availableFixture} />);

    const copy = screen.getByRole('button', { name: 'Copy curl command' });
    await user.click(copy);
    expect(screen.getByRole('status')).toHaveTextContent('Copied curl command.');

    await user.click(copy);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    secondWrite.resolve();
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Copied curl command.');
    });
  });

  it('renders the selected unavailable message in its server HTML', () => {
    const html = renderToString(<InstallCommandTabs installers={allUnavailableFixture} />);
    const host = window.document.createElement('div');
    host.innerHTML = html;
    const selectedPanel = host.querySelector('[role="tabpanel"]:not([hidden])');

    expect(selectedPanel).not.toBeNull();
    expect(selectedPanel).not.toHaveAttribute('hidden');
    expect(selectedPanel).toHaveTextContent('Still in development. No supported install command yet.');
  });

  it('protects the installer target, breakpoint, color, motion, and typography contracts', async () => {
    const styles = await readFile(
      join(repositoryRoot, 'components/install-command-tabs.module.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.tab\s*\{[\s\S]*?min-height:\s*44px;/);
    expect(styles).toMatch(/\.copyButton\s*\{[\s\S]*?min-height:\s*48px;/);
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.availablePanel\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/,
    );
    expect(styles).toMatch(
      /@media\s*\(forced-colors:\s*active\)\s*\{[\s\S]*?\.panel,\s*\.tab,\s*\.copyButton\s*\{[^}]*border-color:\s*CanvasText;/,
    );
    expect(findLiteralColorValues(styles)).toEqual([]);
    expect(styles).not.toMatch(/transition\s*:\s*all\b/i);
    expect(styles).not.toMatch(/\.dark\b/);
    expect(styles).toMatch(
      /\.message,\s*\.copyMessage\s*\{[\s\S]*?font-family:\s*var\(--font-ibm-plex-mono\),\s*monospace;/,
    );
  });

  it('detects literal colors in shorthand and other color-capable declarations', () => {
    const canaryStyles = `
      .border-canary { border: 1px solid rebeccapurple; }
      .shadow-canary { box-shadow: 0 1px 2px #123456; }
    `;

    expect(findLiteralColorValues(canaryStyles)).toEqual([
      'rebeccapurple',
      '#123456',
    ]);
  });

  it('ignores color-like tokens in comments and non-color declarations', () => {
    const canaryStyles = `
      /* border: 1px solid red; */
      .font-canary { font-family: "Coral", sans-serif; }
      .animation-canary { animation-name: red; }
      .content-canary { content: "#123456"; }
      .url-canary { background: url("#abc"); }
    `;

    expect(findLiteralColorValues(canaryStyles)).toEqual([]);
  });
});
