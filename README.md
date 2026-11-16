# Observanam — SAR Deforestation Frontend

React + Vite frontend for SAR change-detection demo.
One page. Three inputs. Three images. Three numbers.

---

## Project structure

```
src/
  main.jsx               Entry point
  App.jsx                Shell layout (header + sidebar + results)
  App.module.css         Two-column layout
  index.css              Global tokens (colors, type, resets)

  data/
    regions.js           ← THE ONLY FILE YOU EDIT FOR THE DEMO
                           Add regions, date pairs, and stats here

  hooks/
    useAnalysis.js       All state: selection → loading → result

  components/
    Header.jsx / .css    Top bar
    ControlPanel.jsx / .css   Left sidebar (dropdowns, slider, button)
    ResultsPanel.jsx / .css   Right area (images + stats)

public/
  static/
    amazon/
      2023-06-01_2023-08-01/
        before.png
        after.png
        prediction.png
      ...more date pairs...
    wayanad/
      ...
```

---

## Adding your real model outputs

1. Run the model, save three PNGs per date pair:
   - `before.png` — NISAR image, pre-event
   - `after.png` — NISAR image, post-event
   - `prediction.png` — model output with red overlay

2. Place them at:
   ```
   public/static/<roi>/<YYYY-MM-DD>_<YYYY-MM-DD>/before.png
   public/static/<roi>/<YYYY-MM-DD>_<YYYY-MM-DD>/after.png
   public/static/<roi>/<YYYY-MM-DD>_<YYYY-MM-DD>/prediction.png
   ```

3. Add an entry to `src/data/regions.js`:
   ```js
   {
     id: '2023-09-01_2023-11-01',
     label: 'Sep 2023 → Nov 2023',
     t1: '2023-09-01',
     t2: '2023-11-01',
     stats: {
       areaKm2: 8.7,
       f1Score: 0.88,
       processingTimeSec: 4.1,
     },
   }
   ```

That's it. No other code changes needed.

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run preview    # serve the built bundle
```

---

## Live inference

1. Select **Live inference** in the mode toggle.
2. Select a region and date range, then click **Run live inference**.

The app loads the selected NISAR `before.png` and `after.png` from `public/static/`
and sends them as multipart form-data fields `t1` and `t2` to
`POST https://observanam-api.onrender.com/predict`. The API returns a PNG
prediction mask, which is shown in the Detection map.

To use another API host, set `VITE_API_BASE` in a `.env` file, for example:

```env
VITE_API_BASE=https://your-api-host.example
```

The prediction API does not return area or F1 statistics, so those values are
shown as unavailable during live inference. Its mask threshold is fixed at 0.5;
the sensitivity slider applies to the precomputed demo only. The API must allow
cross-origin requests from the frontend.

### NISAR browse map

The map's **NISAR** view uses NASA GIBS WMTS tiles from the
`NISAR_L2_Geocoded_Polarimetric_Covariance` layer (NISAR L2 GCOV normalized
radar backscatter). The separate browse-date fields control this reference
imagery only; they do not change the selected analysis dates or the files sent
to `/predict`. Transparent tiles can indicate that no browse scene is available
over the selected region for that date.

The tile layer is limited to the dates currently advertised by GIBS
(2025-10-29 through 2026-11-13). We acknowledge the use of imagery provided by
NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data
and Information System (ESDIS).
