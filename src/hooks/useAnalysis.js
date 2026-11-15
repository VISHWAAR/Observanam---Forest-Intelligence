import { useState, useCallback, useEffect, useRef } from 'react'
import { DATE_PAIRS, NISAR_BROWSE_DATES, REGIONS, getImagePath } from '../data/regions.js'

const DEMO_DELAY_MS = 800   // simulate a brief load for demo mode
const LIVE_TIMEOUT_MS = 120_000  // 2 min cap on live inference

const LIVE_API_BASE = (import.meta.env.VITE_API_BASE || 'https://observanam-api.onrender.com')
  .replace(/\/+$/, '')

export function useAnalysis() {
  const [selectedRoi, setSelectedRoi]     = useState(REGIONS[0].id)
  const [selectedPairId, setSelectedPairId] = useState(DATE_PAIRS[REGIONS[0].id][0].id)
  const [nisarBrowseDates, setNisarBrowseDates] = useState(NISAR_BROWSE_DATES[REGIONS[0].id])
  const [sensitivity, setSensitivity]     = useState(50)
  const [mode, setMode]                   = useState('demo') // 'demo' | 'live'

  const [status, setStatus]   = useState('idle')  // idle | loading | done | error
  const [result, setResult]   = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [livePhase, setLivePhase] = useState(null) // null | 'queued' | 'inferring' | 'rendering'
  const [elapsed, setElapsed]     = useState(0)

  const timerRef   = useRef(null)
  const timeoutRef = useRef(null)
  const abortRef   = useRef(null)
  const predictionUrlRef = useRef(null)
  const availablePairs = DATE_PAIRS[selectedRoi] ?? []

  const resetOutput = useCallback(() => {
    setResult(null)
    setStatus('idle')
    setErrorMessage('')
    setLivePhase(null)
    setElapsed(0)
    clearInterval(timerRef.current)
    clearTimeout(timeoutRef.current)
    abortRef.current?.abort()
    if (predictionUrlRef.current) {
      URL.revokeObjectURL(predictionUrlRef.current)
      predictionUrlRef.current = null
    }
  }, [])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearTimeout(timeoutRef.current)
    abortRef.current?.abort()
    if (predictionUrlRef.current) URL.revokeObjectURL(predictionUrlRef.current)
  }, [])

  const handleRoiChange = useCallback((roi) => {
    setSelectedRoi(roi)
    setSelectedPairId(DATE_PAIRS[roi][0].id)
    setNisarBrowseDates(NISAR_BROWSE_DATES[roi])
    resetOutput()
  }, [resetOutput])

  const handleNisarBrowseDateChange = useCallback((dateKey, date) => {
    setNisarBrowseDates(current => ({ ...current, [dateKey]: date }))
  }, [])

  const handlePairChange = useCallback((pairId) => {
    setSelectedPairId(pairId)
    resetOutput()
  }, [resetOutput])

  const handleSensitivityChange = useCallback((val) => {
    setSensitivity(val)
    resetOutput()
  }, [resetOutput])

  const handleModeChange = useCallback((m) => {
    setMode(m)
    resetOutput()
  }, [resetOutput])

  // ── Demo path ──────────────────────────────────────────────────────────────
  const runDemo = useCallback((pair) => {
    setTimeout(() => {
      setResult({
        roi: selectedRoi,
        pair,
        sensitivity,
        mode: 'demo',
        images: {
          before:     getImagePath(selectedRoi, pair.id, 'before'),
          after:      getImagePath(selectedRoi, pair.id, 'after'),
          prediction: getImagePath(selectedRoi, pair.id, 'prediction'),
        },
        stats: pair.stats,
        generatedAt: new Date().toISOString(),
      })
      setStatus('done')
    }, DEMO_DELAY_MS)
  }, [selectedRoi, sensitivity])

  // ── Live inference path ────────────────────────────────────────────────────
  const runLive = useCallback(async (pair) => {
    const controller = new AbortController()
    abortRef.current = controller
    let timedOut = false

    // Tick a wall-clock timer so the judge can see it working
    const start = Date.now()
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1))
    }, 200)

    try {
      setLivePhase('queued')

      timeoutRef.current = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, LIVE_TIMEOUT_MS)

      const beforePath = getImagePath(selectedRoi, pair.id, 'before')
      const afterPath = getImagePath(selectedRoi, pair.id, 'after')
      const [beforeResponse, afterResponse] = await Promise.all([
        fetch(beforePath, { signal: controller.signal }),
        fetch(afterPath, { signal: controller.signal }),
      ])
      if (!beforeResponse.ok) throw new Error(`Could not load input image: ${beforePath}`)
      if (!afterResponse.ok) throw new Error(`Could not load input image: ${afterPath}`)

      const input = new FormData()
      input.append('t1', await beforeResponse.blob(), 'before.png')
      input.append('t2', await afterResponse.blob(), 'after.png')

      setLivePhase('inferring')
      const response = await fetch(`${LIVE_API_BASE}/predict`, {
        method: 'POST',
        body: input,
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`Predict API returned ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) {
        throw new Error(`Predict API returned an unexpected response type: ${contentType || 'unknown'}`)
      }

      setLivePhase('rendering')
      const predictionBlob = await response.blob()
      if (!predictionBlob.size) throw new Error('Predict API returned an empty mask image')
      const predictionUrl = URL.createObjectURL(predictionBlob)
      predictionUrlRef.current = predictionUrl

      clearInterval(timerRef.current)
      clearTimeout(timeoutRef.current)
      const totalSec = ((Date.now() - start) / 1000).toFixed(1)

      setResult({
        roi: selectedRoi,
        pair,
        sensitivity,
        mode: 'live',
        images: {
          before:     beforePath,
          after:      afterPath,
          prediction: predictionUrl,
        },
        stats: {
          areaKm2:          null,
          f1Score:          null,
          processingTimeSec: parseFloat(totalSec),
        },
        generatedAt: new Date().toISOString(),
      })
      setStatus('done')
      setLivePhase(null)
    } catch (err) {
      clearInterval(timerRef.current)
      clearTimeout(timeoutRef.current)
      if (err.name === 'AbortError' && !timedOut) return
      setErrorMessage(timedOut
        ? 'The prediction request timed out after 2 minutes.'
        : err instanceof Error ? err.message : 'An unexpected error occurred.')
      setStatus('error')
      setLivePhase(null)
    }
  }, [selectedRoi, sensitivity])

  // ── Entry point ────────────────────────────────────────────────────────────
  const runAnalysis = useCallback(() => {
    const pair = availablePairs.find(p => p.id === selectedPairId)
    if (!pair) return

    setStatus('loading')
    setResult(null)
    setErrorMessage('')
    setElapsed(0)
    if (predictionUrlRef.current) {
      URL.revokeObjectURL(predictionUrlRef.current)
      predictionUrlRef.current = null
    }

    if (mode === 'demo') {
      runDemo(pair)
    } else {
      runLive(pair)
    }
  }, [mode, availablePairs, selectedPairId, runDemo, runLive])

  return {
    selectedRoi, selectedPairId, nisarBrowseDates, sensitivity, mode, availablePairs,
    handleRoiChange, handlePairChange, handleNisarBrowseDateChange, handleSensitivityChange,
    handleModeChange, runAnalysis,
    status, result, errorMessage, livePhase, elapsed,
  }
}
