import Link from 'next/link';

import { EvidenceFlow } from '@/components/evidence-flow';
import { siteConfig } from '@/lib/site';

import styles from './page.module.css';

const capabilities = [
  {
    number: '01',
    heading: 'See what the machine reports',
    copy: (
      <>
        <code>loxa doctor</code> reports the chip, physical and logical cores, RAM,
        swap, root-disk capacity, operating system, and detection evidence for Ollama
        and LM Studio.
      </>
    ),
  },
  {
    number: '02',
    heading: 'Work from a committed model registry',
    copy: (
      <>
        <code>loxa list</code> shows six model entries with parameter size,
        quantization, file size, license label, and download status.
      </>
    ),
  },
  {
    number: '03',
    heading: 'Verify completed downloads',
    copy: (
      <>
        <code>loxa pull {'<model-id>'}</code> compares the remote file size with the
        registry, downloads through a partial file, and checks the completed file
        against the registry&apos;s SHA-256 value before renaming it.
      </>
    ),
  },
] as const;

const docsLinks = [
  { href: '/docs/doctor', label: 'Machine reports' },
  { href: '/docs/models', label: 'Model files' },
  { href: '/docs/cli', label: 'CLI reference' },
] as const;

export default function MarketingPage() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Open-source CLI · Early development</p>
          <h1 className={styles.title} id="hero-title">
            Inspect your machine. Manage local model files.
          </h1>
          <p className={styles.lede}>
            Loxa reports hardware and local AI tools, then manages model downloads
            from a built-in registry. Completed downloads are checked against the
            registry&apos;s expected size and SHA-256 value.
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

        <EvidenceFlow />
      </section>

      <section
        className={styles.capabilities}
        id="capabilities"
        aria-labelledby="capabilities-title"
      >
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Current source behavior</p>
          <h2 id="capabilities-title">A short path from inspection to verified files.</h2>
        </div>

        <div className={styles.narrativeList}>
          {capabilities.map((capability) => (
            <article className={styles.narrativeRow} key={capability.number}>
              <p className={styles.narrativeNumber} aria-hidden="true">
                {capability.number}
              </p>
              <div className={styles.narrativeCopy}>
                <h3>{capability.heading}</h3>
                <p>{capability.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className={styles.statusBand} aria-label="Project status">
        <p>
          Version <strong>{siteConfig.version}</strong>. Current CI builds and tests on
          Ubuntu and macOS Arm64. Expect sharp edges before 0.1.0.
        </p>
      </aside>

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
          <h2 id="docs-title">Read the current command surface.</h2>
        </div>
        <nav className={styles.docsLinks} aria-label="Documentation entry points">
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
