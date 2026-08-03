import Link from 'next/link';

import { InstallCommandTabs } from '@/components/install-command-tabs';
import { INSTALLERS } from '@/lib/installer-catalog';
import { siteConfig } from '@/lib/site';

import styles from './page.module.css';

const productDirections = [
  'Match your hardware with a compatible model.',
  'Download and verify model files.',
  'Keep the model server running.',
  'Give local apps one API.',
  'Start with one dependable local node, then grow from there.',
] as const;

const docsLinks = [
  { href: '/docs/project', label: 'Project status' },
  { href: '/docs/cli', label: 'CLI reference' },
] as const;

export default function MarketingPage() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Open source · Apple Silicon first
          </p>
          <h1 className={styles.title} id="hero-title">
            Run open models reliably on your hardware.
          </h1>
          <p className={styles.lede}>
            Loxa is an open-source local AI node for running open models on hardware
            you control. It is being built to manage compatible models and the runtime
            behind one local API.
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
            Package manager installs are still in development. Commands will appear here
            when they are ready.
          </p>
        </div>
        <InstallCommandTabs installers={INSTALLERS} />
      </section>

      <section className={styles.problem} aria-labelledby="problem-title">
        <div>
          <p className={styles.sectionLabel}>Why Loxa</p>
          <h2 id="problem-title">Running an open model is easy. Keeping it reliable is not.</h2>
          <p className={styles.problemContext}>
            A quick local setup turns into ongoing work: choosing a compatible model and
            runtime, managing processes and ports, reconnecting clients, and handling
            failures.
          </p>
        </div>
        <p className={styles.problemFocus}>
          Loxa is being built to handle the setup around the model, not replace the engine
          that runs it.
        </p>
      </section>

      <aside className={styles.statusBand} aria-label="Development status">
        <p>
          Loxa is in early development, with Apple Silicon support first. The first stable
          release is underway.
        </p>
      </aside>

      <section
        className={styles.direction}
        id="product-direction"
        aria-labelledby="direction-title"
      >
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>In development</p>
          <h2 id="direction-title">What Loxa is being built to do</h2>
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
        <h2 id="source-title">Open source.</h2>
        <p>
          Loxa is available under the{' '}
          <a href={siteConfig.licenseUrl}>Apache License 2.0</a>. The source is on{' '}
          <a href={siteConfig.sourceUrl}>GitHub</a>.
        </p>
      </section>

      <section className={styles.docsEntry} aria-labelledby="docs-title">
        <div>
          <p className={styles.sectionLabel}>Documentation</p>
          <h2 id="docs-title">Explore the documentation.</h2>
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
