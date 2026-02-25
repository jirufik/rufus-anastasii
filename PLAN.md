# Plan: rufus-anastasii

## Context

Создание личного веб-проекта "Руфус и Анастасия" — сайт с интерактивной картой, показывающий фотографии замков любви, которые пара вешала на мостах в разных локациях Финляндии и Эстонии. Есть 40 медиафайлов (38 JPG, 1 HEIC, 1 MOV) с GPS-данными в EXIF (~9 локаций).

Бэкенд: NestJS + PostgreSQL + MikroORM (паттерны из litegallery)
Фронтенд: Quasar (Vue 3)
Карты: Leaflet + OpenStreetMap (основной), Google Maps (опциональный)
Языки: RU, EN, FI
Медиа: JPG, HEIC, MOV

---

## Phase 1: Структура проекта и инфраструктура

### 1.1 Создать директорию проекта

```
rufus-anastasii/
├── docker/
│   └── docker-compose.yml          # PostgreSQL для разработки
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nest-cli.json
│   ├── .env.dev
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── mikro-orm.config.ts
│       ├── config/
│       │   └── env.schema.ts
│       ├── constants/
│       │   └── constants.ts
│       ├── libs/                    # Скопированные и адаптированные модули
│       │   ├── mikro-orm/           # BaseService, BaseCrudService, entities, DTOs
│       │   ├── dto/                 # BaseDto, BaseDomainDto
│       │   ├── config/              # CfgService, schema-loader, env helpers
│       │   ├── logger/              # PinoLoggerService (упрощённый)
│       │   ├── auth/                # JwtTokenService, AuthGuard, @Public()
│       │   ├── health/              # Health check
│       │   ├── swagger/             # Swagger init
│       │   └── utils/               # HttpExceptionFilter, processHttpError
│       ├── modules/
│       │   ├── auth/                # Логин админа
│       │   ├── photos/              # Загрузка, EXIF, конвертация
│       │   ├── locations/           # Группы локаций
│       │   └── client-api/          # Публичные эндпоинты
│       └── migrations/
├── frontend/                        # Quasar SPA
│   └── src/
│       ├── boot/                    # i18n, axios
│       ├── i18n/                    # ru/, en/, fi/
│       ├── router/
│       ├── stores/                  # Pinia
│       ├── composables/
│       ├── services/                # API-клиенты
│       ├── components/
│       │   ├── map/                 # MapContainer, LeafletMap, GoogleMap
│       │   ├── common/              # LanguageSwitcher, ThemeSwitcher
│       │   └── photos/              # PhotoGrid, PhotoViewer, PhotoUploader
│       ├── layouts/                 # ClientLayout, AdminLayout
│       └── pages/
│           ├── client/              # MapPage, LocationDetailPage
│           └── admin/               # LoginPage, Dashboard, Photos, Locations
└── PLAN.md
```

### 1.2 Docker Compose для PostgreSQL

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5454:5432"]
    environment:
      POSTGRES_USER: rufus
      POSTGRES_PASSWORD: anastasii
      POSTGRES_DB: rufus_anastasii
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

### 1.3 Скопировать и адаптировать из backend-libs

**Копировать (убрать OpenTelemetry, Kafka, Redis, Prometheus):**

| Источник (litegallery) | Что | Адаптация |
|---|---|---|
| `mikro-orm-based-service/` | Транзакции, CRUD, базовые сущности, DTOs | Убрать `@AutoTrace()`, tracing |
| `dto/base.dto.ts`, `base-domain.dto.ts` | Базовые DTO | Как есть |
| `config/` | CfgService, schema-loader, get-env-file, global-schema | Убрать secrets-storage зависимости |
| `logger/pino-logger.*` | Логгер | Убрать OTEL transport, только console |
| `auth/jwt-token/*` | JWT сервис | Убрать `@AutoTrace()` |
| `auth/authentication/decorators/public.decorator.ts` | @Public() | Как есть |
| `health/` | Health check | Только MikroORM indicator |
| `swagger/init-swagger.ts` | Swagger | Убрать server list |
| `utils/http-exception-filter.ts`, `process-http-error.ts` | Ошибки | Убрать Prometheus counter |

**НЕ копировать:** Kafka, RabbitMQ, Redis/cache, OpenTelemetry, Prometheus, CryptoService (AES), сложный RBAC, Socket.IO, file-proxy

---

## Phase 2: База данных и авторизация

### Схема БД

**admin_users:** id, username (UNIQUE), password_hash (bcrypt)

**locations:** id, latitude, longitude, title_ru/en/fi, description_ru/en/fi, cover_photo_id (FK), sort_order, visit_date

**photos:** id, original_filename, file_path, thumbnail_path, media_type, mime_type, file_size, width, height, latitude, longitude, taken_at, exif_data (jsonb), location_id (FK, INDEX), sort_order

### Авторизация

- `AuthGuard` — JWT verify, @Public() skip
- `POST /api/v1/auth/login` — bcrypt compare, JWT sign
- Seed админа из env: `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- Frontend: Pinia auth store, Axios interceptor, Router guard

---

## Phase 3: Загрузка фото и EXIF

- `exifr` — извлечение GPS, даты, размеров (JPG, HEIC, MOV)
- `sharp` — HEIC->JPG, thumbnails 400x400
- `fluent-ffmpeg` — MOV thumbnails
- Upload flow: save original -> detect type -> convert if needed -> extract EXIF -> generate thumbnail -> save to DB

---

## Phase 4: Локации и группировка

- Haversine distance clustering (порог 200м, настраивается)
- Автосоздание групп при группировке
- Пересчёт центра группы как среднее GPS фото
- CRUD эндпоинты для админа
- Публичные эндпоинты для клиента

---

## Phase 5: Клиентский фронтенд

- MapContainer (абстракция) -> LeafletMap / GoogleMap
- MapPage — интерактивная карта с маркерами и popup
- LocationDetailPage — фото-сетка с lightbox
- Admin: Login, Dashboard, Photos manage, Locations manage/edit
- i18n: RU/EN/FI, vue-i18n
- Темы: Quasar dark mode, ThemeSwitcher
- Адаптивный дизайн

---

## Phase 6: Google Maps и полировка

- GoogleMap.vue реализация
- Переключатель провайдера карт
- Responsive testing
- Drag-and-drop сортировка фото
- Финальная полировка

---

## Стандарты кода (из CLAUDE_BACKEND.md)

- DDD: Controller -> ProcessService (@Transactional) -> RepositoryService -> BaseCrudService
- Явные type annotations
- Возвращать named variables
- Try/catch с PinoLogger в каждом методе
- Сервисы бросают domain errors, контроллеры — HTTP exceptions через processHttpError()
- Entity: `{Name}Entity`, DO: `{Name}Do`, Repository: `{Name}RepositoryService`
- UnderscoreNamingStrategy для БД
