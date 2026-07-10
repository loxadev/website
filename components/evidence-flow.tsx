import styles from './evidence-flow.module.css';

const steps = [
  { command: 'loxa doctor', annotation: 'Machine report' },
  { command: 'loxa list', annotation: 'Built-in registry' },
  {
    command: 'loxa pull <model-id>',
    annotation: 'Size and SHA-256 checks',
    current: true,
  },
  { command: '~/.loxa/models', annotation: 'Model files' },
] as const;

export function EvidenceFlow() {
  return (
    <section className={styles.flow} aria-label="Current Loxa workflow">
      <div className={styles.header}>
        <p>Current workflow</p>
        <span>Source behavior</span>
      </div>

      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li className={styles.step} key={step.command}>
            <span className={styles.index} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <code className={styles.command}>{step.command}</code>
            <span className={styles.annotation}>
              {'current' in step ? (
                <span className={styles.currentMarker} aria-hidden="true" />
              ) : null}
              {step.annotation}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
