import Link from 'next/link';

import { siteConfig, type SiteLink } from '@/lib/site';

import styles from './site-footer.module.css';

const footerLinks: readonly SiteLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Project', href: '/docs/project' },
  { label: 'GitHub', href: siteConfig.sourceUrl, external: true },
  { label: 'Apache 2.0', href: siteConfig.licenseUrl, external: true },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <Link className={styles.name} href="/">
            Loxa
          </Link>
          <p className={styles.status}>
            Early development <span aria-hidden="true">·</span> {siteConfig.version}
          </p>
        </div>

        <nav className={styles.navigation} aria-label="Footer">
          {footerLinks.map((link) => (
            <Link
              className={styles.link}
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
      </div>
    </footer>
  );
}
