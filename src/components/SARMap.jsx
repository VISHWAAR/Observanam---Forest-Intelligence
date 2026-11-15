import { useEffect, useRef, useState } from 'react'
import { NISAR_BROWSE_DATE_LIMITS, REGIONS } from '../data/regions.js'
import styles from './SARMap.module.css'

const NISAR_TILE_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/' +
  'NISAR_L2_Geocoded_Polarimetric_Covariance/default/{time}/' +
  'GoogleMapsCompatible_Level13/{z}/{y}/{x}.png'

const ROI_BOUNDS = {
  amazon:  [[-4.5, -61.2], [-2.3, -58.8]],
  wayanad: [[11.3, 75.7],  [11.9, 76.5]],
}

export function SARMap({ roi, imageUrl, browseDate, label, sublabel, nisarCaption, mapCaption }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const mapLayerRef  = useRef(null)
  const imageLayerRef = useRef(null)
  const nisarLayerRef = useRef(null)
  const roiLayerRef  = useRef(null)
  const browseDateRef = useRef(browseDate)
  const [viewMode, setViewMode] = useState('image')
  const [mapVersion, setMapVersion] = useState(0)
  const [tileError, setTileError] = useState(false)
  const region = REGIONS.find(item => item.id === roi)

  const canShowNisar = Boolean(
    browseDate &&
    browseDate >= NISAR_BROWSE_DATE_LIMITS.min &&
    browseDate <= NISAR_BROWSE_DATE_LIMITS.max
  )

  useEffect(() => {
    let destroyed = false

    async function init() {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (destroyed || !containerRef.current) return

      const bounds = ROI_BOUNDS[roi]
      if (!bounds) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      })
      mapRef.current = map
      map.fitBounds(bounds, { padding: [12, 12] })

      mapLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }
      ).addTo(map)

      imageLayerRef.current = imageUrl
        ? L.imageOverlay(imageUrl, bounds, { opacity: 1, alt: `${label} image` })
        : null
      nisarLayerRef.current = L.tileLayer(
        NISAR_TILE_URL.replace('{time}', browseDateRef.current || ''),
        {
          attribution: 'NASA GIBS / <a href="https://gibs.earthdata.nasa.gov/">NISAR L2 GCOV</a>',
          maxNativeZoom: 13,
          maxZoom: 18,
          opacity: 1,
        }
      )
      nisarLayerRef.current.on('tileerror', () => setTileError(true))
      roiLayerRef.current = L.rectangle(bounds, {
        color: '#ff3b45',
        weight: 3,
        opacity: 1,
        fill: false,
        interactive: false,
      }).addTo(map)
      setMapVersion(version => version + 1)
    }

    init()
    return () => {
      destroyed = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      mapLayerRef.current = null
      imageLayerRef.current = null
      nisarLayerRef.current = null
      roiLayerRef.current = null
    }
  }, [roi, imageUrl, label])

  useEffect(() => {
    const map = mapRef.current
    const mapLayer = mapLayerRef.current
    const imageLayer = imageLayerRef.current
    const nisarLayer = nisarLayerRef.current
    const roiLayer = roiLayerRef.current
    if (!map) return

    if (viewMode === 'image' && imageLayer) {
      mapLayer?.remove()
      nisarLayer?.remove()
      imageLayer.addTo(map)
    } else if (viewMode === 'nisar') {
      imageLayer?.remove()
      mapLayer?.addTo(map)
      nisarLayer?.addTo(map)
    } else {
      imageLayer?.remove()
      nisarLayer?.remove()
      mapLayer?.addTo(map)
    }
    roiLayer?.bringToFront()
  }, [viewMode, mapVersion])

  useEffect(() => {
    browseDateRef.current = browseDate
    if (!canShowNisar) {
      return
    }

    setTileError(false)
    nisarLayerRef.current?.setUrl(NISAR_TILE_URL.replace('{time}', browseDate))
  }, [browseDate, canShowNisar])

  useEffect(() => {
    if (!canShowNisar && viewMode === 'nisar') setViewMode('map')
  }, [canShowNisar, viewMode])

  const canShowImage = !!imageUrl

  return (
    <figure className={styles.figure}>
      <div className={styles.toggleWrap}>
        <button
          className={`${styles.toggleBtn} ${viewMode === 'image' ? styles.active : ''}`}
          onClick={() => setViewMode('image')}
          disabled={!canShowImage}
          aria-pressed={viewMode === 'image'}
          type="button"
        >
          Image
        </button>
        <button
          className={`${styles.toggleBtn} ${viewMode === 'nisar' ? styles.active : ''}`}
          onClick={() => setViewMode('nisar')}
          disabled={!canShowNisar}
          type="button"
          aria-pressed={viewMode === 'nisar'}
          title="NASA GIBS NISAR browse imagery; not an analysis input"
        >
          NISAR
        </button>
        <button
          className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.active : ''}`}
          onClick={() => setViewMode('map')}
          aria-pressed={viewMode === 'map'}
          type="button"
        >
          Map
        </button>
      </div>

      <div ref={containerRef} className={styles.map} />
      {tileError && viewMode === 'nisar' && (
        <div className={styles.tileNotice} role="status">
          Some NASA GIBS NISAR tiles failed to load.
        </div>
      )}
      {region && (
        <div className={styles.roiLegend}>
          <span className={styles.roiSwatch} aria-hidden="true" />
          <span>
            <strong>{region.label}</strong>
            <small>Red outline: selected region of interest (area analyzed)</small>
          </span>
        </div>
      )}

      <figcaption className={styles.caption}>
        <span className={styles.captionLabel}>{label}</span>
        <span className={styles.captionSub}>{sublabel}</span>
        <span className={styles.captionNote}>
          {viewMode === 'nisar'
            ? `NASA GIBS NISAR browse reference — ${browseDate}; not used for inference.`
            : viewMode === 'image' ? nisarCaption : mapCaption}
        </span>
      </figcaption>
    </figure>
  )
}