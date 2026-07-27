import Link from 'next/link';

import { InstallCommandTabs } from '@/components/install-command-tabs';
import { INSTALLERS } from '@/lib/installer-catalog';
import { siteConfig } from '@/lib/site';

import styles from './page.module.css';

const productDirections = [
  'Inspect hardware and choose compatible known model recipes.',
  'Download and verify model artifacts.',
  'Supervise the model runtime.',
  'Provide one local API for trusted applications.',
  'Grow toward independently useful nodes, multiple model slots, secure device access, runtime updates, and optional team-level management.',
] as const;

const docsLinks = [
  { href: '/docs/project', label: 'Project status' },
  { href: '/docs/cli', label: 'Source CLI reference' },
] as const;

export default function MarketingPage() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Open source · Still in development · Apple Silicon first
          </p>
          <h1 className={styles.title} id="hero-title">
            Run open models reliably on your hardware.
          </h1>
          <p className={styles.lede}>
            Loxa is being built as a local AI node that will manage compatible models
            and a supervised runtime, then give trusted applications one local API
            while models and requests remain on hardware you control.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/docs">
              Read the docs
            </Link>
            <a className={styles.secondaryAction} href={siteConfig.sourceUrl}>
              View source
            </a>
          </div>
        </div>
      </section>

      <section className={styles.installer} aria-labelledby="installer-title">
        <div className={styles.installerCopy}>
          <p className={styles.sectionLabel}>Still in development</p>
          <h2 id="installer-title">Install Loxa with your favorite package manager.</h2>
          <p className={styles.installerDescription}>
            Installation channels are being verified one at a time. Available commands
            appear here only after their release artifacts pass clean-machine testing.
          </p>
        </div>
        <InstallCommandTabs installers={INSTALLERS} />
      </section>

      <section className={styles.problem} aria-labelledby="problem-title">
        <div>
          <p className={styles.sectionLabel}>Why Loxa</p>
          <h2 id="problem-title">Running an open model is easy. Keeping it reliable is not.</h2>
          <p className={styles.problemContext}>
            Choosing a compatible model and runtime, managing processes and ports,
            reconnecting clients, and handling failures turns a quick local setup into
            ongoing operational work.
          </p>
        </div>
        <p className={styles.problemFocus}>
          Loxa is being built to manage the node around the model, not to become
          another inference engine.
        </p>
      </section>

      <aside className={styles.statusBand} aria-label="Development status">
        <p>
          Still in development at <strong>{siteConfig.version}</strong>.
          <span>Apple Silicon first.</span>
          <span>Manual stress testing is in progress.</span>
          <span>
            Public capability and availability statements will be added only after the
            owner approves the test evidence.
          </span>
        </p>
      </aside>

      <section
        className={styles.direction}
        id="product-direction"
        aria-labelledby="direction-title"
      >
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>In development</p>
          <h2 id="direction-title">Loxa is being built to:</h2>
        </div>
        <ol className={styles.directionList}>
          {productDirections.map((direction, index) => (
            <li key={direction}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <p>{direction}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.sourceBand} aria-labelledby="source-title">
        <h2 id="source-title">Built in public.</h2>
        <p>
          Loxa is available under the{' '}
          <a href={siteConfig.licenseUrl}>Apache License 2.0</a>. Read the{' '}
          <a href={siteConfig.sourceUrl}>source</a> and follow development on{' '}
          <a href={siteConfig.sourceUrl}>GitHub</a>.
        </p>
      </section>

      <section className={styles.docsEntry} aria-labelledby="docs-title">
        <div>
          <p className={styles.sectionLabel}>Documentation</p>
          <h2 id="docs-title">Follow the project as it develops.</h2>
        </div>
        <nav className={styles.docsLinks} aria-label="Documentation entry points">
          <Link href="/docs/install">
            Install status
            <span aria-hidden="true">→</span>
          </Link>
          {docsLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
