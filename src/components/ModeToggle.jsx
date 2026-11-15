import styles from './ModeToggle.module.css'

export function ModeToggle({ mode, onChange, disabled }) {
  return (
    <div className={styles.wrap}>
      <span className={styles.groupLabel}>Analysis mode</span>
      <div className={styles.toggle} role="group" aria-label="Analysis mode">
        <button
          className={`${styles.btn} ${mode === 'demo' ? styles.active : ''}`}
          onClick={() => onChange('demo')}
          disabled={disabled}
          aria-pressed={mode === 'demo'}
          type="button"
        >
          <span className={styles.dot} data-mode="demo" />
          <span className={styles.btnText}>
            <span className={styles.btnLabel}>Precomputed</span>
            <span className={styles.btnSub}>Instant · no GPU needed</span>
          </span>
        </button>

        <button
          className={`${styles.btn} ${mode === 'live' ? styles.active : ''} ${styles.btnLive}`}
          onClick={() => onChange('live')}
          disabled={disabled}
          aria-pressed={mode === 'live'}
          type="button"
        >
          <span className={styles.dot} data-mode="live" />
          <span className={styles.btnText}>
            <span className={styles.btnLabel}>Live inference</span>
            <span className={styles.btnSub}>Runs the model · ~30–90s</span>
          </span>
        </button>
      </div>
    </div>
  )
}
