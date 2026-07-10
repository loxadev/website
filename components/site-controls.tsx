'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTheme } from 'fumadocs-ui/provider/base';

import { siteLinks } from '@/lib/site';

import styles from './site-header.module.css';

export function SiteControls() {
  const { setOpenSearch } = useSearchContext();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const themeTransitionTimerRef = useRef<number | null>(null);
  const themeReady = resolvedTheme === 'light' || resolvedTheme === 'dark';
  const dark = themeReady && resolvedTheme === 'dark';

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (themeTransitionTimerRef.current !== null) {
        window.clearTimeout(themeTransitionTimerRef.current);
      }
      document.documentElement.classList.remove('themeTransition');
    },
    [],
  );

  function toggleTheme() {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!reducedMotion) {
      document.documentElement.classList.add('themeTransition');
      if (themeTransitionTimerRef.current !== null) {
        window.clearTimeout(themeTransitionTimerRef.current);
      }
      themeTransitionTimerRef.current = window.setTimeout(() => {
        document.documentElement.classList.remove('themeTransition');
        themeTransitionTimerRef.current = null;
      }, 190);
    }

    setTheme(dark ? 'light' : 'dark');
  }

  const themeLabel = themeReady
    ? dark
      ? 'Switch to light theme'
      : 'Switch to dark theme'
    : 'Choose color theme';
  const menuLabel = menuOpen ? 'Close navigation' : 'Open navigation';

  return (
    <div className={styles.controls}>
      <button
        className={styles.searchButton}
        type="button"
        aria-label="Search documentation"
        onClick={() => setOpenSearch(true)}
      >
        <span className={styles.searchGlyph} aria-hidden="true" />
        <span className={styles.searchText}>Search</span>
        <kbd className={styles.hotkey} aria-hidden="true">
          ⌘K
        </kbd>
      </button>

      <button
        className={styles.themeButton}
        type="button"
        aria-label={themeLabel}
        aria-pressed={themeReady ? dark : undefined}
        data-theme-ready={themeReady}
        disabled={!themeReady}
        onClick={toggleTheme}
      >
        <span className={`${styles.themeCell} ${styles.sunCell}`} data-selected-theme={themeReady && !dark ? 'light' : undefined} aria-hidden="true">
          <svg data-theme-icon viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="3.25" />
            <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42" />
          </svg>
        </span>
        <span className={`${styles.themeCell} ${styles.moonCell}`} data-selected-theme={themeReady && dark ? 'dark' : undefined} aria-hidden="true">
          <svg data-theme-icon viewBox="0 0 24 24" focusable="false">
            <path d="M20.1 15.25A8.5 8.5 0 0 1 8.75 3.9a8.5 8.5 0 1 0 11.35 11.35Z" />
          </svg>
        </span>
      </button>

      <button
        ref={menuButtonRef}
        className={styles.menuButton}
        type="button"
        aria-label={menuLabel}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className={styles.menuGlyph} aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      {menuOpen ? (
        <nav
          id="mobile-navigation"
          className={styles.mobileNavigation}
          aria-label="Mobile"
        >
          {siteLinks.map((link) => (
            <Link
              className={styles.mobileLink}
              href={link.href}
              key={link.label}
              onClick={() => setMenuOpen(false)}
              {...(link.external
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {link.label}
              {link.external ? (
                <span className={styles.srOnly}> (opens in a new tab)</span>
              ) : null}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
