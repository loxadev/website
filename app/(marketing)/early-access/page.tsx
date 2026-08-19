import type { Metadata } from 'next';

import { EarlyAccessFormSelector } from './form-selector';
import styles from './page.module.css';

const description =
  'Help shape Loxa whether you already run local AI or are just getting started.';

export const metadata: Metadata = {
  title: 'Early access',
  description,
  alternates: { canonical: '/early-access' },
  openGraph: {
    type: 'website',
    url: '/early-access',
    title: 'Help shape Loxa',
    description,
  },
  twitter: {
    card: 'summary',
    title: 'Help shape Loxa',
    description,
  },
};

export default function EarlyAccessPage() {
  return (
    <main className={styles.page} id="main-content">
      <section className={styles.hero} aria-labelledby="early-access-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Early access · Help shape Loxa</p>
          <h1 className={styles.title} id="early-access-title">
            Help decide what Loxa should solve first.
          </h1>
          <p className={styles.lede}>
            Whether you already run local AI or are just curious, choose the short form
            that fits you best.
          </p>
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby="research-form-title">
        <div className={styles.formIntro}>
          <p className={styles.sectionLabel}>Product research</p>
          <h2 id="research-form-title">Which best describes you?</h2>
          <p className={styles.formDescription}>
            Pick the technical form if you already run local AI. Pick the non-technical
            form if you are new to it or simply curious.
          </p>
          <p className={styles.privacyNote}>
            Each form explains how your responses will be used before you begin.
          </p>
        </div>

        <EarlyAccessFormSelector />
      </section>
    </main>
  );
}
