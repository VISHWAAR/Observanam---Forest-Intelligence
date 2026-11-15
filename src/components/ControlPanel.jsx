import { NISAR_BROWSE_DATE_LIMITS, REGIONS } from '../data/regions.js'
import { ModeToggle } from './ModeToggle.jsx'
import styles from './ControlPanel.module.css'

export function ControlPanel({
  selectedRoi,
  selectedPairId,
  nisarBrowseDates,
  sensitivity,
  availablePairs,
  mode,
  onRoiChange,
  onPairChange,
  onNisarBrowseDateChange,
  onSensitivityChange,
  onModeChange,
  onAnalyze,
  status,
}) {
  const isLoading = status === 'loading'

  const sensitivityLabel =
    sensitivity < 33 ? 'Strict — fewer false positives' :
    sensitivity < 66 ? 'Balanced' :
                       'Loose — catches subtle change'

  return (
    <aside className={styles.panel}>
      <div className={styles.section}>
        <label className={styles.label} htmlFor="roi-select">Region of interest</label>
        <select
          id="roi-select"
          className={styles.select}
          value={selectedRoi}
          onChange={e => onRoiChange(e.target.value)}
          disabled={isLoading}
        >
          {REGIONS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <RegionMeta roi={REGIONS.find(r => r.id === selectedRoi)} />
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="pair-select">Date range</label>
        <select
          id="pair-select"
          className={styles.select}
          value={selectedPairId}
          onChange={e => onPairChange(e.target.value)}
          disabled={isLoading}
        >
          {availablePairs.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <span className={styles.hint}>{availablePairs.length} available windows</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>NISAR browse dates</span>
        <div className={styles.browseDateFields}>
          <label className={styles.browseDateField} htmlFor="nisar-before-date">
            <span className={styles.hint}>Before reference</span>
            <input
              id="nisar-before-date"
              className={styles.dateInput}
              type="date"
              min={NISAR_BROWSE_DATE_LIMITS.min}
              max={NISAR_BROWSE_DATE_LIMITS.max}
              value={nisarBrowseDates.before}
              onChange={event => onNisarBrowseDateChange('before', event.target.value)}
            />
          </label>
          <label className={styles.browseDateField} htmlFor="nisar-after-date">
            <span className={styles.hint}>After reference</span>
            <input
              id="nisar-after-date"
              className={styles.dateInput}
              type="date"
              min={NISAR_BROWSE_DATE_LIMITS.min}
              max={NISAR_BROWSE_DATE_LIMITS.max}
              value={nisarBrowseDates.after}
              onChange={event => onNisarBrowseDateChange('after', event.target.value)}
            />
          </label>
        </div>
        <span className={styles.hint}>
          NASA GIBS browse references only; these dates do not change analysis inputs. Tiles may be transparent where no scene is available.
        </span>
      </div>

      <div className={styles.section}>
        <label className={styles.label} htmlFor="sensitivity-range">
          Detection sensitivity
        </label>
        <input
          id="sensitivity-range"
          type="range"
          min="0"
          max="100"
          value={sensitivity}
          onChange={e => onSensitivityChange(Number(e.target.value))}
          className={styles.slider}
          disabled={isLoading || mode === 'live'}
        />
        <div className={styles.sliderRow}>
          <span className={styles.hint}>Strict</span>
          <span className={styles.sensitivityValue}>{sensitivityLabel}</span>
          <span className={styles.hint}>Loose</span>
        </div>
        {mode === 'live' && (
          <span className={styles.hint}>Live API uses a fixed 0.5 threshold.</span>
        )}
      </div>

      <ModeToggle mode={mode} onChange={onModeChange} disabled={isLoading} />

      <button
        className={`${styles.analyzeBtn} ${mode === 'live' ? styles.analyzeBtnLive : ''}`}
        onClick={onAnalyze}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className={styles.loadingRow}>
            <Spinner mode={mode} />
            {mode === 'live' ? 'Running inference…' : 'Loading results…'}
          </span>
        ) : mode === 'live' ? (
          'Run live inference'
        ) : (
          'Show precomputed results'
        )}
      </button>

      {mode === 'live' && !isLoading && (
        <div className={styles.liveWarning}>
          <span className={styles.liveWarningIcon}>⚠</span>
          <p>
            Selected NISAR images are uploaded to the prediction API. The first request may take up to 2 minutes while the service starts.
          </p>
        </div>
      )}

      {mode === 'demo' && !isLoading && (
        <div className={styles.explainer}>
          <p>
            Precomputed demo predictions — no inference runs during this demo.
            Live mode sends the selected input images to the prediction API.
          </p>
        </div>
      )}
    </aside>
  )
}

function RegionMeta({ roi }) {
  if (!roi) return null
  return (
    <div className={styles.regionMeta}>
      <span className={styles.coord}>{roi.coordinates}</span>
      <span className={styles.regionDesc}>{roi.description}</span>
    </div>
  )
}

function Spinner({ mode }) {
  const color = mode === 'live' ? 'var(--amber)' : 'var(--green-live)'
  return (
    <svg
      className={styles.spinner}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5.5" stroke="var(--border)" strokeWidth="1.5" />
      <path
        d="M7 1.5A5.5 5.5 0 0 1 12.5 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
