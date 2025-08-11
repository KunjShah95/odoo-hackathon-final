# GlobeTrotter Backend

## Setup

1. Copy `.env.example` to `.env` and fill values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/globetrotter
JWT_SECRET=change_me_super_secret
OPENWEATHER_API_KEY=your_openweather_key
HUGGINGFACE_API_KEY=your_huggingface_token
# HUGGINGFACE_MODEL=tiiuae/falcon-7b-instruct
```

1. Install dependencies:

```bash
npm install
```

1. Run dev server:

```bash
npm run dev
```

## Proxied External APIs

- `GET /geo/forward?city=Paris` → Nominatim (OpenStreetMap)
- `GET /places/nearby?lat=&lon=&radius=&limit=` → Overpass API (OpenStreetMap)
- `GET /places/details/:type/:id` → Overpass API detail (type in node|way|relation)
- `GET /currency/convert?from=&to=&amount=` → exchangerate.host (no key)
- `POST /ai/suggest` `{ prompt }` → HuggingFace Inference API (requires HUGGINGFACE_API_KEY)
- `GET /weather?city=` → OpenWeather

All routes require a JWT via `Authorization: Bearer <token>` unless explicitly public.
