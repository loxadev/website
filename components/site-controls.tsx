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
  const dark = resolvedTheme === 'dark';

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

  const themeLabel = dark ? 'Switch to light theme' : 'Switch to dark theme';
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
        onClick={() => setTheme(dark ? 'light' : 'dark')}
      >
        <span aria-hidden="true">{dark ? 'Light' : 'Dark'}</span>
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
