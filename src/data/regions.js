/**
 * Static catalog of available analyses.
 * Each entry maps to: /static/{roi}/{date_t1}_{date_t2}/{before|after|prediction}.png
 *
 * To add a new result:
 *  1. Run the model, save PNGs to /public/static/<roi>/<t1>_<t2>/
 *  2. Add an entry to the datePairs array for that roi.
 */

export const REGIONS = [
    {
    id: 'amazon',
    label: 'Amazon Basin, Brazil',
    coordinates: '3.4°S, 60.0°W',
    description: 'Para state — active deforestation frontier',
    lat: -3.4,
    lng: -60.0,
    zoom: 10,
  },
  {
    id: 'wayanad',
    label: 'Wayanad, Kerala',
    coordinates: '11.6°N, 76.1°E',
    description: 'Western Ghats — landslide & encroachment zone',
    lat: 11.6,
    lng: 76.1,
    zoom: 11,
  },
]

export const NISAR_BROWSE_DATES = {
  amazon: {
    before: '2026-06-18',
    after: '2026-09-15',
  },
  wayanad: {
    before: '2026-06-22',
    after: '2026-08-14',
  },
}

export const NISAR_BROWSE_DATE_LIMITS = {
  min: '2025-10-29',
  max: '2026-11-13',
}

export const DATE_PAIRS = {
  amazon: [
    {
      id: '2023-06-01_2023-08-01',
      label: 'Jun 2023 → Aug 2023',
      t1: '2023-06-01',
      t2: '2023-08-01',
      stats: {
        areaKm2: 12.3,
        f1Score: 0.87,
        processingTimeSec: 4.2,
      },
    },
    {
      id: '2023-03-01_2023-06-01',
      label: 'Mar 2023 → Jun 2023',
      t1: '2023-03-01',
      t2: '2023-06-01',
      stats: {
        areaKm2: 7.8,
        f1Score: 0.91,
        processingTimeSec: 3.9,
      },
    },
    {
      id: '2022-09-01_2023-03-01',
      label: 'Sep 2022 → Mar 2023',
      t1: '2022-09-01',
      t2: '2023-03-01',
      stats: {
        areaKm2: 23.1,
        f1Score: 0.84,
        processingTimeSec: 5.1,
      },
    },
  ],
  wayanad: [
    {
      id: '2023-06-01_2023-08-01',
      label: 'Jun 2023 → Aug 2023',
      t1: '2023-06-01',
      t2: '2023-08-01',
      stats: {
        areaKm2: 3.4,
        f1Score: 0.89,
        processingTimeSec: 3.7,
      },
    },
    {
      id: '2023-01-01_2023-06-01',
      label: 'Jan 2023 → Jun 2023',
      t1: '2023-01-01',
      t2: '2023-06-01',
      stats: {
        areaKm2: 1.9,
        f1Score: 0.93,
        processingTimeSec: 3.5,
      },
    },
  ],
}

/**
 * Returns the URL path for a given roi, pairId, and image type.
 * Images must exist at /public/static/...
 */
export function getImagePath(roi, pairId, type) {
  // type: 'before' | 'after' | 'prediction'
  return `/static/${roi}/${pairId}/${type}.png`
}
