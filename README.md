# Rufus & Anastasii — Love Locks Photo Map

Interactive map with photos of love locks hung on bridges across Finland and Estonia.

**Live:** [love.rufus.pro](https://love.rufus.pro)

## Features

- Interactive Leaflet map with location markers and popups
- Photo gallery with masonry layout, lightbox, and keyboard navigation
- Admin panel: photo upload (drag-and-drop), EXIF extraction, media conversion
- Auto-grouping photos into locations by GPS coordinates (Haversine, 200m threshold)
- Reverse geocoding via OSM Nominatim (RU, EN, FI)
- Three languages (Russian, English, Finnish), dark/light theme
- HEIC/MOV support with auto-conversion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript 5.6, MikroORM 6, PostgreSQL 16 |
| Frontend | Vue 3.5, Quasar 2.17, Vite 6, Leaflet 1.9 |
| Auth | JWT + bcrypt |
| Media | sharp, exifr, fluent-ffmpeg, heic-convert |
| i18n | vue-i18n 10 (RU, EN, FI) |
| Deploy | Docker (multi-stage), Nginx |

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- ffmpeg

### Run

```bash
# Database
cd docker && docker-compose up -d

# Backend
cd backend
cp .env.example .env.development
npm install
npm run migration:up
npm run start:dev         # http://localhost:3000

# Frontend
cd frontend
cp .env.example .env
npm install
npx quasar dev            # http://localhost:9002
```

### Docker (all-in-one)

```bash
docker-compose up --build -d
```

## API

Swagger UI: http://localhost:3000/api-docs

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/client/locations` | All locations with photos |
| GET | `/api/v1/client/locations/:id` | Location detail + photos |
| GET | `/api/v1/client/photos/:id/file` | Full photo |
| GET | `/api/v1/client/photos/:id/thumbnail` | Thumbnail 600x600 |

### Admin (JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/admin/photos/upload` | Upload (up to 50 files) |
| PUT | `/api/v1/admin/photos/:id/rotate` | Rotate photo |
| PUT | `/api/v1/admin/photos/:id/move` | Move to location |
| POST | `/api/v1/admin/photos/delete-batch` | Bulk delete |
| POST | `/api/v1/admin/locations/auto-group` | Auto-cluster by GPS |
| POST | `/api/v1/admin/locations/fill-titles` | Geocode titles |

Full API reference in [DOCS.md](DOCS.md).

## Architecture

```
Controller → ProcessService (@Transactional) → BasicActionsService → RepositoryService → BaseCrudService → DB
```

## Testing

```bash
cd backend
npm run test
```

## License

Private project.
