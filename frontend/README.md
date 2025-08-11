# GlobeTrotter Frontend

Stack: React + Vite + Tailwind CSS + React Router + Axios + react-hot-toast

## Setup

1. Copy env and install deps

```powershell
Copy-Item .env.example .env -Force
npm install
```

2. Run

```powershell
npm run dev
```

Open the URL printed by Vite (default http://localhost:5173).

## Config
- VITE_API_BASE_URL: Backend base URL (default http://localhost:5000)

## Pages
- /login, /signup
- / (Dashboard)
- /trips/:tripId
- /trips/:tripId/add-stop
- /stops/:stopId/add-activity

## Notes
- JWT is stored in localStorage and sent via Authorization: Bearer header.
- Error and success notifications use react-hot-toast.
- Tailwind is preconfigured via PostCSS.
