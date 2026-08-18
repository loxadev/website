import type { Metadata } from 'next';

import styles from './page.module.css';

const responderUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSdiywaLR4RieIqkJXi1dVGqcYycfhtzTz9tNbpwomY4eujWSA/viewform';
const embedUrl = responderUrl + '?embedded=true';
const description =
  'Help shape Loxa by sharing how you run local AI, what breaks, and what would make it dependable.';

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
            Loxa is still early. Tell us how you run local AI, what breaks, and what
            would make it dependable.
          </p>
          <p className={styles.formDetails}>About 45 seconds · 3 required questions</p>
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby="research-form-title">
        <div className={styles.formIntro}>
          <p className={styles.sectionLabel}>Product research</p>
          <h2 id="research-form-title">Tell us what gets in your way.</h2>
          <p className={styles.formDescription}>
            Short answers are enough. Optional questions help us understand your setup
            without making the form harder to finish.
          </p>
          <p className={styles.privacyNote}>
            Your email is used for early-access updates. If you volunteer, we may also
            contact you for product research. You can opt out at any time.
          </p>
        </div>

        <div className={styles.formColumn}>
          <div className={styles.formShell}>
            <iframe
              className={styles.form}
              src={embedUrl}
              title="Loxa early-access and product-research form"
              width="100%"
              height="2800"
              loading="lazy"
            >
              Loading the Loxa early-access form…
            </iframe>
          </div>
          <p className={styles.fallback}>
            If the embedded form does not load,{' '}
            <a href={responderUrl} target="_blank" rel="noreferrer">
              Open the form in a new tab
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
