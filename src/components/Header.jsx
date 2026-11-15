import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.logo}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M9 1L2 5v8l7 4 7-4V5L9 1z"
              stroke="var(--green-live)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M9 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
              fill="var(--green-live)"
            />
          </svg>
        </span>
        <span className={styles.wordmark}>Obserவனம்</span>
        <span className={styles.separator}>·</span>
        <span className={styles.subtitle}>SAR Change Detection</span>
      </div>
      <div className={styles.right}>
        <span className={styles.badge}>NISAR / PyTorch</span>
      </div>
    </header>
  )
}
