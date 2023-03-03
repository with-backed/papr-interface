import styles from './AuctionCountdown.module.css';

type AuctionCountdownProps = {
  animate?: boolean;
};

export function AuctionCountdown({ animate = true }: AuctionCountdownProps) {
  return (
    <svg
      className={styles.mainSvg}
      width="53"
      height="53"
      viewBox="0 0 53 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle
        className={`${styles.dot} ${animate ? styles.d1 : ''}`}
        fill="#EEEEEE"
        cx="18.0451"
        cy="6.56455"
        r="3.5"
        transform="rotate(22.5 18.0451 6.56455)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d2 : ''}`}
        fill="#EEEEEE"
        cx="6.56418"
        cy="18.0449"
        r="3.5"
        transform="rotate(-22.5 6.56418 18.0449)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d7 : ''}`}
        fill="#EEEEEE"
        cx="45.7614"
        cy="18.045"
        r="3.5"
        transform="rotate(22.5 45.7614 18.045)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d5 : ''}`}
        fill="#EEEEEE"
        cx="34.2809"
        cy="45.7614"
        r="3.5"
        transform="rotate(22.5 34.2809 45.7614)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d3 : ''}`}
        fill="#EEEEEE"
        cx="6.5646"
        cy="34.2809"
        r="3.5"
        transform="rotate(22.5 6.5646 34.2809)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d8 : ''}`}
        fill="#EEEEEE"
        cx="34.281"
        cy="6.56447"
        r="3.5"
        transform="rotate(-22.5 34.281 6.56447)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d6 : ''}`}
        fill="#EEEEEE"
        cx="45.7614"
        cy="34.281"
        r="3.5"
        transform="rotate(-22.5 45.7614 34.281)"
      />

      <circle
        className={`${styles.dot} ${animate ? styles.d4 : ''}`}
        fill="#EEEEEE"
        cx="18.0451"
        cy="45.7615"
        r="3.5"
        transform="rotate(-22.5 18.0451 45.7615)"
      />
    </svg>
  );
}
