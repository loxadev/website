import Link from 'next/link';

import { siteLinks } from '@/lib/site';

import { BrandLockup } from './brand-lockup';
import { SiteControls } from './site-controls';
import styles from './site-header.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brandLink} href="/" aria-label="Loxa">
          <BrandLockup />
        </Link>

        <nav className={styles.primaryNavigation} aria-label="Primary">
          {siteLinks.map((link) => (
            <Link
              className={styles.navigationLink}
              href={link.href}
              key={link.label}
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

        <Link className={styles.primaryAction} href="/docs">
          Read docs
        </Link>

        <SiteControls />
      </div>
    </header>
  );
}
