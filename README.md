
<div align="center">
  <img src="frontend/public/logo.svg" alt="GlobeTrotter Logo" width="120" />
  
  # 🌍 GlobeTrotter – Empowering Personalized Travel Planning
  <b>Plan smarter, travel further. Your all-in-one platform for collaborative, AI-powered trip planning.</b>
</div>

---

## 🚀 Features

- **AI-Powered Smart Suggestions**: Personalized trip ideas and nearby places using HuggingFace and OSM APIs.
- **Rich Itinerary Builder**: Add cities, drag-and-drop days, inline activities, and persistent data.
- **Live Interactive Map**: Visualize your route, auto-fit bounds, and see distance summaries.
- **Real-Time Collaboration**: Invite friends, assign roles, and co-edit trips with notifications.
- **Budget & Expense Management**: Track budgets, split expenses, and convert currencies on the fly.
- **Packing List Generator**: Smart lists based on your itinerary and destination.
- **Weather Integration**: Get weather snapshots for each city in your trip.
- **Public Trip Boards**: Share your adventures with the world or keep them private.
- **Gamification & Badges**: Earn achievements as you explore and plan.

---

## 🏗️ Architecture Overview

- **Frontend**: React, Vite, TypeScript, TailwindCSS, ShadCN UI, Radix UI, Lucide Icons, Leaflet, Framer Motion, Embla Carousel, React DnD, React Hook Form, and more.
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM, JWT Auth, Socket.IO, PDFKit, Multer, CORS, dotenv, bcrypt, node-fetch.
- **Dev Tools**: ESLint, Jest, Nodemon, Supertest.
- **Infrastructure**: Prisma migrations, environment variables, health checks, proxy for free-tier APIs.

See full architecture and sequence diagrams in architecture.md.

---

## 📦 Repository Structure

- frontend – Modern React app (Vite, TypeScript, Tailwind). Entry: `src/main.tsx`. Screens in `src/components`.
- globetrotter-backend – Express API for authentication, trips, stops, activities, budgets, and more.
- `prisma/` – Database schema and migrations.
- docs – Architecture and sequence diagrams (Mermaid).

---

## 🧑‍💻 Quick Start

### Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL v14+

### Setup

1. **Clone the repo**
2. **Copy environment files:**
   ```powershell
   Copy-Item globetrotter-backend/.env.example globetrotter-backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```
3. **Edit `globetrotter-backend/.env` and add your API keys:**
   - `OPENWEATHER_API_KEY`, `HUGGINGFACE_API_KEY` (OSM Overpass/Nominatim require no keys)
   - Database connection string (`DATABASE_URL`)
   - JWT secret (`JWT_SECRET`)
4. **Edit `frontend/.env` and set API URL:**
   - `VITE_API_URL=http://localhost:5000`
5. **Install dependencies & run:**
   ```powershell
   # Backend
   cd globetrotter-backend
   npm install
   npm run dev

   # In a new terminal – Frontend
   cd ../frontend
   npm install
   npm run dev
   ```
6. **Health check:** [http://localhost:5000/health](http://localhost:5000/health) (db=true and env flags=true when keys are present)

---

## 🗺️ Core Use Cases

- **Onboard:** Signup, login, and get personalized Smart Suggestions.
- **Create Trip:** Name, dates, cover photo, public/private toggle.
- **Build Itinerary:** Add cities, set days, drag to reorder, auto-flow dates, live map route visualization, inline activities per city.
- **Smart Suggestions:** AI trip ideas via HuggingFace, nearby places via OSM Overpass, weather snapshot per city via OpenWeather.
- **Collaborate:** Invite users, assign roles, notifications, public itinerary sharing.
- **Budget & Utilities:** Track budgets, split expenses, packing list, currency conversion.

---

## 🔌 Backend API Surface (Selected Endpoints)

- **Auth:** `POST /auth/login`, `POST /auth/register`
- **Trips:** `GET/POST/PUT /trips`, `GET /trips/:id`
- **Stops:** `GET /stops/:tripId`, `POST /stops/:tripId`, `DELETE /stops/:stopId`, `PATCH /stops/reorder`
- **Activities:** `GET /activities/stop/:stopId`, `POST /activities/:stopId`, `PUT/DELETE /activities/:activityId`
- **Budgets/Expenses:** `/budgets/:tripId`, `/expenses/...`
- **Proxies:** `/ai/suggest`, `/geo/...`, `/places/...`, `/weather`, `/currency`

> All protected endpoints require `Authorization: Bearer <JWT>`

---

## ⚙️ Environment & Config

- **Frontend:** `frontend/.env`
  - `VITE_API_URL=http://localhost:5000`
- **Backend:** `globetrotter-backend/.env`
  - `DATABASE_URL` or `DB_*` fields
  - `JWT_SECRET`
  - `OPENWEATHER_API_KEY`, `HUGGINGFACE_API_KEY`
  - Optional: `HUGGINGFACE_MODEL`

---

## 🧪 Testing & Quality

- **Lint/Typecheck:** TypeScript + Vite build for frontend; Node for backend.
- **Health check:** `/health` confirms DB connectivity and API key presence.
- **Error handling:** Proxy routes use fallbacks for robust demo UX.
- **Unit & API tests:** Run `npm test` in backend for Jest/Supertest coverage.

---

## 🛠️ Technologies Used

### Frontend

- React, Vite, TypeScript, TailwindCSS, ShadCN UI, Radix UI, Lucide Icons, Leaflet, Framer Motion, Embla Carousel, React DnD, React Hook Form, class-variance-authority, cmdk, input-otp, next-themes, react-day-picker, react-device-detect, react-resizable-panels, etc.

### Backend

- Node.js, Express, PostgreSQL, Prisma ORM, JWT Auth, Socket.IO, PDFKit, Multer, CORS, dotenv, bcrypt, node-fetch, Jest, Nodemon, Supertest.

### Config & Build

- tailwind.config.js, postcss.config.js, vite.config.ts, .env.example files for both frontend and backend.

---

## 🎬 Demo Tips

> Seed a sample trip, add 2–3 cities, then show:
> - Add city with manual days; drag to reorder and watch dates flow.
> - Activities add/remove updating cost totals.
> - Map auto-fitting the route.
> - Dashboard Smart Suggestions combining AI text + nearby places + weather.
> - Collaborator invite and public share toggle.

---

## 📄 License

MIT (for hackathon use). External APIs subject to their own terms.
