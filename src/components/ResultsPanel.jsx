import { useState } from 'react'
import { SARMap } from './SARMap.jsx'
import styles from './ResultsPanel.module.css'

export function ResultsPanel({ status, result, nisarBrowseDates, mode, errorMessage, livePhase, elapsed }) {
  if (status === 'idle') return <EmptyState />
  if (status === 'loading') return <LoadingState livePhase={livePhase} elapsed={elapsed} />
  if (status === 'error') return <ErrorState mode={mode} message={errorMessage} />
  if (status === 'done' && result) return <Results result={result} nisarBrowseDates={nisarBrowseDates} />
  return null
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyInner}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="6" y="10" width="36" height="28" rx="2" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="6" y="10" width="12" height="28" stroke="var(--border)" strokeWidth="1.5" />
          <rect x="30" y="10" width="12" height="28" stroke="var(--border)" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="4" stroke="var(--text-muted)" strokeWidth="1.5" />
        </svg>
        <p className={styles.emptyText}>
          Select a region and date range, choose a mode, then click the button.
        </p>
      </div>
    </div>
  )
}

const PHASES = [
  { key: 'queued',    label: 'Preparing inputs',    sub: 'Loading selected SAR images' },
  { key: 'inferring', label: 'Model inferring',     sub: 'Siamese U-Net running on API' },
  { key: 'rendering', label: 'Displaying mask',     sub: 'Prediction image received' },
]

function LoadingState({ livePhase, elapsed }) {
  const isLive = livePhase !== null

  return (
    <div className={styles.empty}>
      <div className={styles.emptyInner}>
        {isLive ? (
          <>
            <div className={styles.phaseTracker}>
              {PHASES.map((p) => {
                const phaseOrder = PHASES.findIndex(x => x.key === livePhase)
                const thisOrder  = PHASES.findIndex(x => x.key === p.key)
                const state =
                  thisOrder < phaseOrder ? 'done' :
                  thisOrder === phaseOrder ? 'active' : 'pending'

                return (
                  <div key={p.key} className={`${styles.phase} ${styles[state]}`}>
                    <div className={styles.phaseIcon}>
                      {state === 'done' ? '✓' :
                       state === 'active' ? <SpinnerSmall color="var(--amber)" /> : '·'}
                    </div>
                    <div className={styles.phaseText}>
                      <span className={styles.phaseLabel}>{p.label}</span>
                      <span className={styles.phaseSub}>{p.sub}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className={styles.elapsed}>
              <span className={styles.elapsedValue}>{elapsed}s</span>
              <span className={styles.elapsedLabel}>elapsed</span>
            </div>
            <p className={styles.liveNote}>
              Live inference running on the prediction API. The first request may take up to 2 minutes while the service starts.
            </p>
          </>
        ) : (
          <>
            <SpinnerLarge />
            <p className={styles.emptyText}>Retrieving precomputed analysis…</p>
          </>
        )}
      </div>
    </div>
  )
}

function ErrorState({ mode, message }) {
  const wasLive = mode === 'live'
  return (
    <div className={styles.empty}>
      <div className={styles.emptyInner}>
        <p className={styles.errorText}>
          {wasLive
            ? `Live inference failed: ${message}`
            : message || 'Failed to load analysis. Please try again.'}
        </p>
        {wasLive && (
          <p className={styles.errorHint}>
            Tip: switch to <strong>Precomputed</strong> mode to demo without a running backend.
          </p>
        )}
      </div>
    </div>
  )
}

function Results({ result, nisarBrowseDates }) {
  const { images, stats, pair, mode } = result
  const isLive = mode === 'live'

  return (
    <div className={styles.results}>
      <div className={styles.imageGrid}>
        <SARMap
          roi={result.roi}
          imageUrl={images.before}
          browseDate={nisarBrowseDates.before}
          label="Before"
          sublabel={pair.t1}
          nisarCaption="NISAR pre-event image"
          mapCaption="Map context — pre-event"
        />
        <SARMap
          roi={result.roi}
          imageUrl={images.after}
          browseDate={nisarBrowseDates.after}
          label="After"
          sublabel={pair.t2}
          nisarCaption="NISAR post-event image"
          mapCaption="Map context — post-event"
        />
        <SARMap
          roi={result.roi}
          imageUrl={images.prediction}
          browseDate={nisarBrowseDates.after}
          label="Detection"
          sublabel="Model output"
          nisarCaption="Change mask from NISAR inputs"
          mapCaption="Map context — analyzed region outlined"
        />
      </div>

      <div className={styles.statsRow}>
        <Stat
          value={isLive ? '—' : `${stats.areaKm2} km²`}
          label={isLive ? 'Area estimate (not returned)' : 'Forest area changed'}
          accent="alert"
        />
        <Stat
          value={isLive ? '—' : `${(stats.f1Score * 100).toFixed(0)}%`}
          label={isLive ? 'F1 score (not returned)' : 'Model F1 confidence'}
          accent="green"
        />
        <Stat value={`${stats.processingTimeSec}s`} label={isLive ? 'End-to-end request time' : 'Inference time (precomputed)'} accent="neutral" />

        <div className={styles.sourceBadgeWrap}>
          <div className={`${styles.sourceBadge} ${isLive ? styles.sourceLive : styles.sourceDemo}`}>
            <span className={styles.sourceDot} />
            {isLive ? 'Live inference' : 'Precomputed demo'}
          </div>
          <span className={styles.timestampValue}>{pair.label}</span>
        </div>
      </div>
    </div>
  )
}

function ImagePane({ src, label, sublabel, caption, isAlert }) {
  const [loaded, setLoaded]   = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <figure className={`${styles.pane} ${isAlert ? styles.paneAlert : ''}`}>
      <div className={styles.imageWrap}>
        {!loaded && !errored && <div className={styles.imgPlaceholder} aria-hidden="true" />}
        {errored ? (
          <div className={styles.imgMissing}>
            <span>Image not found</span>
            <code className={styles.imgPath}>{src}</code>
          </div>
        ) : (
          <img
            src={src}
            alt={`${label} SAR image`}
            className={`${styles.img} ${loaded ? styles.imgLoaded : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setErrored(true); setLoaded(true) }}
          />
        )}
        {isAlert && loaded && !errored && (
          <div className={styles.alertBadge}>⚑ change detected</div>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.captionLabel}>{label}</span>
        <span className={styles.captionSub}>{sublabel}</span>
        <span className={styles.captionNote}>{caption}</span>
      </figcaption>
    </figure>
  )
}

function Stat({ value, label, accent }) {
  const accentClass =
    accent === 'alert' ? styles.statAlert :
    accent === 'green' ? styles.statGreen :
    styles.statNeutral

  return (
    <div className={`${styles.stat} ${accentClass}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function SpinnerSmall({ color }) {
  return (
    <svg className={styles.spinSmall} width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SpinnerLarge() {
  return (
    <svg className={styles.loadSpinner} width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke="var(--border)" strokeWidth="2" />
      <path d="M16 4A12 12 0 0 1 28 16" stroke="var(--green-live)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
