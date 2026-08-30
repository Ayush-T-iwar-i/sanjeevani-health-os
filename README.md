# Sanjeevani Health OS

Offline-first, multilingual rural healthcare platform for India.

## Quick Start (Local Dev)

```bash
cp .env.example .env
docker-compose up -d
cd backend && npm install && npm run migrate && npm run dev
```

## Architecture

| Layer | Stack |
|---|---|
| Mobile | React Native + TypeScript + WatermelonDB |
| Web Dashboard | React + Vite + TanStack Query |
| Backend API | Node.js + Express + TypeScript |
| AI Service | Python + FastAPI |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |

## Build Phases

1. **Foundation** — auth, users, patients, EHR groundwork (Problem 4)
2. **Core clinical** — triage, appointments, consultations (Problems 1, 2, 6)
3. **Continuity** — referrals, inventory, follow-ups (Problems 3, 5, 7, 11)
4. **Offline & access** — mobile sync, i18n, voice, WhatsApp (Problems 8, 9, 10)
5. **Safety net** — SOS, audit, security (Problem 12)
6. **Dashboards** — web analytics
7. **Deploy** — k8s, CI/CD, staging

## API Base URL

`http://localhost:4000/api`
