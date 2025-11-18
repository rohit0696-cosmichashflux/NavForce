NAV Force — World Dashboard (Starter)

What this package contains
- A React + Vite starter app (PWA-ready) showing a world map with interactive layers:
  NAV Warnings (GeoJSON), AIS clustering, Weather tile overlay placeholder, Draw geofence.
- Mock data only — replace with real endpoints when ready.

How to run locally
1. Ensure Node 18+ and npm are installed.
2. From project root run:
   npm install
   npm run dev
3. Open the URL printed by Vite (usually http://localhost:5173)

Notes
- To enable weather tiles replace YOUR_OPENWEATHERMAP_API_KEY in src/App.jsx with an API key.
- For real AIS replace MOCK_AIS with API fetches and consider server-side aggregation (recommended).
