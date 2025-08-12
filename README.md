# 🌍 GlobeTrotter

**AI-Powered Collaborative Travel Planning Platform**

[![Features](https://img.shields.io/badge/Features-Complete-blue?logo=vercel)](#features)
[![Architecture](https://img.shields.io/badge/Architecture-Modern-brightgreen?logo=react)](#architecture)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?logo=open-source-initiative)](#license)

---

## Executive Summary

GlobeTrotter is a next-generation, full-stack travel planning platform designed for individuals, teams, and organizations. It leverages AI, real-time collaboration, and modern UX to deliver a seamless, end-to-end trip planning experience. Built with enterprise-grade best practices, GlobeTrotter is scalable, secure, and extensible for both personal and professional use cases.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Security](#security)
- [Testing & Quality](#testing--quality)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **AI-Powered Smart Suggestions**: Personalized trip ideas, activities, and places using HuggingFace and OSM APIs.
- **Rich Itinerary Builder**: Drag-and-drop cities, days, and activities with persistent, real-time updates.
- **Interactive Route Map**: Visualize your trip, auto-fit bounds, and see total distance.
- **Real-Time Collaboration**: Invite collaborators, assign roles, and co-edit with live notifications.
- **Budget & Expense Management**: Plan budgets, split expenses, and convert currencies instantly.
- **Packing List Generator**: Smart lists tailored to your itinerary and destinations.
- **Weather Integration**: Get weather forecasts for each city in your trip.
- **Public & Private Trip Boards**: Share your adventures or keep them private.
- **Gamification**: Earn badges and achievements as you plan and travel.
- **PDF & Calendar Export**: Download your itinerary as PDF or ICS.

---

## Architecture

- **Frontend**: React (Vite, TypeScript, TailwindCSS, ShadCN UI, Radix UI, Lucide Icons, Leaflet, Framer Motion, React DnD, React Hook Form, etc.)
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM, JWT Auth, Socket.IO, PDFKit, Multer, dotenv, bcrypt, node-fetch.
- **DevOps & Tooling**: ESLint, Jest, Nodemon, Supertest, Prisma migrations, environment variables, health checks, API proxying.

> See [`docs/architecture.md`](docs/architecture.md) for C4 diagrams and sequence flows.

---

## Repository Structure

```
frontend/             # React app (Vite, TypeScript, Tailwind)
globetrotter-backend/ # Express API (Node.js, PostgreSQL, Prisma)
prisma/               # Database schema and migrations
docs/                 # Architecture and sequence diagrams
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- PostgreSQL v14+

### Setup
1. **Clone the repository**
2. **Copy environment files:**
   ```sh
   cp globetrotter-backend/.env.example globetrotter-backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. **Configure environment variables:**
   - Backend: `DATABASE_URL`, `JWT_SECRET`, `OPENWEATHER_API_KEY`, `HUGGINGFACE_API_KEY`
   - Frontend: `VITE_API_URL=http://localhost:5000`
4. **Install dependencies & run:**
   ```sh
   # Backend
   cd globetrotter-backend
   npm install
   npm run dev

   # Frontend (in a new terminal)
   cd ../frontend
   npm install
   npm run dev
   ```
5. **Health check:** [http://localhost:5000/health](http://localhost:5000/health)

---

## Configuration
- **Frontend:** `frontend/.env`
- **Backend:** `globetrotter-backend/.env`
- **Database:** `prisma/schema.prisma` (migrations auto-applied)

---

## Usage Guide

### Core Flows
- **Sign Up & Login:** Secure JWT authentication.
- **Create Trip:** Name, dates, cover photo, privacy toggle.
- **Build Itinerary:** Add cities, set days, reorder, add activities, live map, and weather.
- **Smart Suggestions:** AI-powered ideas, nearby places, and weather per city.
- **Collaborate:** Invite users, assign roles, notifications, public/private sharing.
- **Budget & Expenses:** Plan, split, and track expenses; convert currencies.
- **Export:** Download PDF or ICS calendar of your trip.

### Demo Tips
- Seed a sample trip, add cities, drag to reorder, add activities, view map, invite collaborators, and export PDF.

---

## API Reference

### Authentication
- `POST /auth/login` – Login
- `POST /auth/register` – Register

### Trips & Itinerary
- `GET /trips` – List trips
- `POST /trips` – Create trip
- `PUT /trips/:id` – Update trip
- `GET /stops/:tripId` – List stops
- `POST /stops/:tripId` – Add stop
- `PATCH /stops/reorder` – Reorder stops
- `GET /activities/stop/:stopId` – List activities
- `POST /activities/:stopId` – Add activity

### Collaboration
- `GET /collaborators/:tripId` – List collaborators
- `POST /collaborators/:tripId/invite` – Invite collaborator

### Budget & Expenses
- `GET /budgets/:tripId` – Get budget
- `POST /budgets/:tripId` – Upsert budget
- `GET /expenses/:tripId` – List expenses
- `POST /expenses/:tripId` – Add expense

### Utilities
- `POST /ai/suggest` – AI trip suggestions
- `GET /geo/forward` – Geocode city
- `GET /places/nearby` – Nearby places
- `GET /weather` – Weather snapshot
- `GET /pdf-export/:tripId` – Export PDF

> All protected endpoints require `Authorization: Bearer <JWT>`

---

## Security
- **Authentication:** JWT-based, password hashing with bcrypt.
- **Authorization:** Role-based access for trips and collaboration.
- **Input Validation:** All endpoints validate and sanitize input.
- **Environment Variables:** Secrets and API keys never committed.
- **CORS:** Configured for frontend-backend separation.
- **Rate Limiting:** (Optional, can be enabled for production)

---

## Testing & Quality
- **Linting:** ESLint for code quality.
- **Type Safety:** TypeScript enforced throughout.
- **Unit & API Tests:** Jest & Supertest for backend, Vite for frontend.
- **Health Checks:** `/health` endpoint for DB and API key status.
- **CI/CD:** Ready for integration with GitHub Actions or similar.

---

## Contributing
We welcome contributions! Please open issues or pull requests for bug fixes, features, or documentation improvements.
- Follow conventional commit messages.
- Ensure all tests pass before submitting PRs.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (if available).

---

## License
MIT License. See [LICENSE](LICENSE) for details. External APIs are subject to their own terms.
