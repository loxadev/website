import Image from 'next/image';

import styles from './site-header.module.css';

export function BrandLockup() {
  return (
    <span className={styles.lockup}>
      <span className={styles.mark} aria-hidden="true">
        <Image
          className={styles.inkMark}
          src="/brand/loxa-mark-ink.svg"
          alt=""
          width={42}
          height={34}
          unoptimized
        />
        <Image
          className={styles.snowMark}
          src="/brand/loxa-mark-snow.svg"
          alt=""
          width={42}
          height={34}
          unoptimized
        />
      </span>
      <span className={styles.wordmark}>Loxa</span>
    </span>
  );
}
