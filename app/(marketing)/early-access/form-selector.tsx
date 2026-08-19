'use client';

import { useState, useSyncExternalStore } from 'react';

import styles from './page.module.css';

type Audience = 'technical' | 'non-technical';

const subscribeToClientMount = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const forms = {
  technical: {
    label: 'technical',
    responderUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSdiywaLR4RieIqkJXi1dVGqcYycfhtzTz9tNbpwomY4eujWSA/viewform',
    embedUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSdiywaLR4RieIqkJXi1dVGqcYycfhtzTz9tNbpwomY4eujWSA/viewform?embedded=true',
    title: 'Loxa technical early-access and product-research form',
  },
  'non-technical': {
    label: 'non-technical',
    responderUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSedsXWsjs2nmlw8luv4i5edHLz-atibAHaCuRQeSifXDw3z6Q/viewform?usp=publish-editor',
    embedUrl:
      'https://docs.google.com/forms/d/e/1FAIpQLSedsXWsjs2nmlw8luv4i5edHLz-atibAHaCuRQeSifXDw3z6Q/viewform?usp=publish-editor&embedded=true',
    title: 'Loxa non-technical early-access and product-research form',
  },
} as const;

function audienceFromLocation(): Audience | null {
  const audience = new URLSearchParams(window.location.search).get('audience');
  return audience === 'technical' || audience === 'non-technical' ? audience : null;
}

export function EarlyAccessFormSelector() {
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const audience = selectedAudience ?? (mounted ? audienceFromLocation() : null);

  function chooseAudience(nextAudience: Audience) {
    setSelectedAudience(nextAudience);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('audience', nextAudience);
    window.history.replaceState({}, '', nextUrl);
  }

  const selectedForm = audience ? forms[audience] : null;

  return (
    <div className={styles.selector}>
      <div className={styles.choiceGrid} role="group" aria-label="Choose your form">
        <button
          className={styles.choiceButton}
          type="button"
          aria-pressed={audience === 'technical'}
          onClick={() => chooseAudience('technical')}
        >
          <span className={styles.choiceTitle}>Technical</span>
          <span className={styles.choiceDescription}>
            I already use or build local AI
          </span>
        </button>
        <button
          className={styles.choiceButton}
          type="button"
          aria-pressed={audience === 'non-technical'}
          onClick={() => chooseAudience('non-technical')}
        >
          <span className={styles.choiceTitle}>Non-technical</span>
          <span className={styles.choiceDescription}>I’m new to local AI</span>
        </button>
      </div>

      {selectedForm ? (
        <div className={styles.formColumn}>
          <div className={styles.formShell}>
            <iframe
              className={`${styles.form} ${
                audience === 'technical' ? styles.technicalForm : styles.nonTechnicalForm
              }`}
              src={selectedForm.embedUrl}
              title={selectedForm.title}
              width="100%"
              loading="lazy"
            >
              Loading the Loxa {selectedForm.label} early-access form…
            </iframe>
          </div>
          <p className={styles.fallback}>
            If the embedded form does not load,{' '}
            <a href={selectedForm.responderUrl} target="_blank" rel="noreferrer">
              Open the {selectedForm.label} form in a new tab
            </a>
            .
          </p>
        </div>
      ) : (
        <p className={styles.selectionHint}>Choose the option that fits you to continue.</p>
      )}
    </div>
  );
}
