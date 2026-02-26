- # Rufus & Anastasii — Love Locks Photo Map

## Описание проекта

Личный веб-проект "Руфус и Анастасия" — интерактивная карта с фотографиями замков любви, которые пара вешала на мостах в разных локациях Финляндии и Эстонии. Содержит ~40 медиафайлов (JPG, HEIC, MOV) с GPS-данными в EXIF, сгруппированных по ~9 локациям.

---

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| **Backend** | NestJS 10, TypeScript 5.6 |
| **ORM** | MikroORM 6 + PostgreSQL 16 |
| **Frontend** | Vue 3.5, Quasar 2.17, Vite 6 |
| **Карта** | Leaflet 1.9 + OpenStreetMap |
| **Авторизация** | JWT (bcrypt + Bearer token) |
| **i18n** | vue-i18n 10 (RU, EN, FI) |
| **Медиа** | sharp, exifr, fluent-ffmpeg, heic-convert |
| **Логирование** | Pino + pino-pretty |

---

## Запуск проекта

### Требования

- Node.js 22+
- PostgreSQL 16 (Docker или локальный)
- ffmpeg (для обработки видео)

### 1. База данных

**Через Docker:**
```bash
cd docker && docker-compose up -d
```
PostgreSQL будет доступен на `localhost:5454`.

**Локальная БД** — настроить параметры в `backend/.env.development`.

### 2. Backend

```bash
cd backend
npm install
npm run migration:up    # Применить миграции
npm run start:dev       # Запуск с hot-reload
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

### 3. Frontend

```bash
cd frontend
npm install
npx quasar dev
```

- UI: http://localhost:9002

---

## Переменные окружения

### Backend (`backend/.env.development`)

| Переменная | Описание | По умолчанию |
|-----------|---------|-------------|
| `SERVICE_HTTP_PORT` | Порт HTTP сервера | `3000` |
| `DB_HOST` | Хост PostgreSQL | — |
| `DB_PORT` | Порт PostgreSQL | — |
| `DB_USER` | Пользователь БД | — |
| `DB_PASSWORD` | Пароль БД | — |
| `DB_NAME` | Имя базы данных | — |
| `JWT_SECRET` | Секрет для подписи JWT | — |
| `JWT_EXPIRES_IN` | Срок действия токена | `24h` |
| `ADMIN_USERNAME` | Логин админа (seed) | — |
| `ADMIN_PASSWORD` | Пароль админа (seed) | — |
| `UPLOAD_DIR` | Директория загрузок | `./uploads` |
| `MAX_FILE_SIZE_MB` | Макс. размер файла (МБ) | `50` |
| `GROUPING_PROXIMITY_METERS` | Порог группировки фото по расстоянию | `200` |
| `MIKROORM_DEBUG` | Вывод SQL-запросов | `false` |

### Frontend (`frontend/.env`)

| Переменная | Описание | По умолчанию |
|-----------|---------|-------------|
| `API_URL` | URL бэкенда | `http://localhost:3000` |

---

## Архитектура

### Общая структура

```
rufus-anastasii/
├── README.md
├── docker/                  # Docker Compose для PostgreSQL
│   └── docker-compose.yml
├── backend/                 # NestJS API
│   └── src/
│       ├── main.ts          # Точка входа
│       ├── app.module.ts    # Корневой модуль
│       ├── mikro-orm.config.ts
│       ├── config/          # Env-валидация (Joi)
│       ├── constants/       # Константы
│       ├── libs/            # Переиспользуемые модули
│       ├── modules/         # Бизнес-модули
│       └── migrations/      # Миграции БД
├── frontend/                # Quasar SPA
│   └── src/
│       ├── boot/            # Инициализация (i18n, axios)
│       ├── components/      # Vue-компоненты
│       ├── composables/     # Vue composables
│       ├── i18n/            # Переводы (ru, en, fi)
│       ├── layouts/         # ClientLayout, AdminLayout
│       ├── pages/           # Страницы (client, admin)
│       ├── router/          # Маршрутизация
│       ├── services/        # API-клиенты
│       └── stores/          # Pinia stores
├── PLAN.md
└── .gitignore
```

### Backend: слоистая архитектура (DDD)

```
Controller → ProcessService → BasicActionsService → RepositoryService → BaseCrudService → DB
```

- **Controller** — обработка HTTP-запросов, маппинг ошибок в HTTP-коды
- **ProcessService** — бизнес-логика, декоратор `@Transactional()` для транзакций
- **BasicActionsService** — типовые CRUD-операции
- **RepositoryService** — прямой доступ к БД через `BaseCrudService<T>`

### Backend: модули

```
AppModule
├── AuthModule            — авторизация (логин, seed админа)
├── PhotosModule          — загрузка, EXIF, конвертация, CRUD фото
├── LocationsModule       — CRUD локаций, автогруппировка, геокодинг
├── ClientApiModule       — публичные API для фронтенда
├── HealthModule          — health-check (/health)
├── JwtTokenModule        — JWT sign/verify
├── PinoLoggerModule      — логирование
├── MikroOrmModule        — подключение к PostgreSQL
└── ConfigModule          — env-конфигурация
```

---

## База данных

### Таблицы

#### `admin_users`
| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID | PK, gen_random_uuid() |
| `username` | varchar(100) | UNIQUE |
| `password_hash` | varchar(255) | bcrypt hash |
| `created_at` | timestamptz | Дата создания |
| `updated_at` | timestamptz | Дата обновления |
| `deleted_at` | timestamptz | Soft delete |
| `version` | int | Оптимистичная блокировка |

#### `locations`
| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID | PK |
| `latitude` | double | Широта (центр локации) |
| `longitude` | double | Долгота (центр локации) |
| `title_ru` | varchar(255) | Название на русском |
| `title_en` | varchar(255) | Название на английском |
| `title_fi` | varchar(255) | Название на финском |
| `description_ru` | text | Описание RU |
| `description_en` | text | Описание EN |
| `description_fi` | text | Описание FI |
| `cover_photo_id` | UUID | FK на фото-обложку |
| `sort_order` | int | Порядок сортировки |
| `visit_date` | date | Дата посещения |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |
| `version` | int | |

#### `photos`
| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID | PK |
| `original_filename` | varchar(512) | Имя исходного файла |
| `file_path` | varchar(1024) | Путь к файлу / конвертированному |
| `thumbnail_path` | varchar(1024) | Путь к миниатюре |
| `media_type` | varchar(10) | jpg, heic, mov, mp4, png |
| `mime_type` | varchar(100) | MIME-тип |
| `file_size` | bigint | Размер файла (байт) |
| `width` | int | Ширина (пикс.) |
| `height` | int | Высота (пикс.) |
| `latitude` | double | GPS широта из EXIF |
| `longitude` | double | GPS долгота из EXIF |
| `taken_at` | timestamptz | Дата съёмки из EXIF |
| `exif_data` | jsonb | Сырые EXIF-метаданные |
| `location_id` | UUID | FK → locations.id (ON DELETE SET NULL) |
| `sort_order` | int | Порядок в локации |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |
| `version` | int | |

### Особенности

- Все таблицы используют **soft delete** (`deleted_at`)
- **Оптимистичная блокировка** через поле `version`
- Индексы на `created_at`, `updated_at`, `deleted_at`
- FK `photos.location_id` → `locations.id` с `ON DELETE SET NULL`, `ON UPDATE CASCADE`

---

## API эндпоинты

### Health Check

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| GET | `/health` | Public | Статус сервиса и БД |

### Авторизация

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| POST | `/api/v1/auth/login` | Public | Логин, возвращает JWT |
| POST | `/api/v1/auth/check` | Bearer | Проверка валидности токена |

**Пример логина:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change-me"}'
```

### Админ: Фото

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| POST | `/api/v1/admin/photos/upload` | Bearer | Загрузка до 50 файлов (multipart) |
| GET | `/api/v1/admin/photos` | Bearer | Список фото (?locationId=) |
| GET | `/api/v1/admin/photos/:id` | Bearer | Одно фото |
| PUT | `/api/v1/admin/photos/:id` | Bearer | Обновить метаданные |
| DELETE | `/api/v1/admin/photos/:id` | Bearer | Удалить (soft delete) |
| POST | `/api/v1/admin/photos/delete-batch` | Bearer | Массовое удаление (body: {ids: string[]}) |
| PUT | `/api/v1/admin/photos/:id/rotate` | Bearer | Повернуть (body: {degrees}) |
| PUT | `/api/v1/admin/photos/:id/move` | Bearer | Переместить в локацию (body: {locationId}) |

**Поддерживаемые форматы:** JPG, JPEG, HEIC, HEIF, MOV, MP4, PNG

**Pipeline загрузки:**
1. Сохранение оригинала → `uploads/originals/`
2. Определение типа → конвертация HEIC→JPG при необходимости → `uploads/converted/`
3. Извлечение EXIF (GPS, дата, размеры)
4. Нормализация ориентации (auto-rotate)
5. Генерация миниатюры 600x600 @ 90% quality → `uploads/thumbnails/`
6. Для видео: извлечение первого кадра через ffmpeg
7. Запись в БД

### Админ: Локации

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| GET | `/api/v1/admin/locations` | Bearer | Все локации с кол-вом фото |
| GET | `/api/v1/admin/locations/:id` | Bearer | Одна локация |
| POST | `/api/v1/admin/locations` | Bearer | Создать локацию |
| PUT | `/api/v1/admin/locations/:id` | Bearer | Обновить локацию |
| DELETE | `/api/v1/admin/locations/:id` | Bearer | Удалить (soft delete) |
| POST | `/api/v1/admin/locations/auto-group` | Bearer | Автогруппировка фото |
| POST | `/api/v1/admin/locations/fill-titles` | Bearer | Заполнить названия через геокодинг |

**Автогруппировка (auto-group):**
- Находит все фото без привязки к локации, у которых есть GPS
- Вычисляет расстояние до существующих локаций (формула Гаверсинуса)
- Если расстояние < `GROUPING_PROXIMITY_METERS` (200м) — привязывает к ближайшей
- Если далеко от всех — создаёт новую локацию
- Пересчитывает центр локации как среднее координат всех фото

**Заполнение названий (fill-titles):**
- Запрашивает Nominatim OSM API по координатам
- Заполняет `titleEn`, `titleRu`, `titleFi` (с фоллбэками)
- Rate-limit: 1 запрос/сек на язык
- Параметр `{force: true}` перезаписывает существующие названия

### Клиентское API (публичное)

| Метод | Путь | Auth | Описание |
|-------|------|------|---------|
| GET | `/api/v1/client/locations` | Public | Все локации с фото (фильтр: photoCount > 0) |
| GET | `/api/v1/client/locations/:id` | Public | Локация + все её фото |
| GET | `/api/v1/client/photos/:id/file` | Public | Скачать полное фото (Cache-Control: 7 дней) |
| GET | `/api/v1/client/photos/:id/thumbnail` | Public | Скачать миниатюру 600x600 (Cache-Control: 7 дней) |

---

## Frontend

### Маршруты

| Путь | Layout | Страница | Auth | Описание |
|------|--------|---------|------|---------|
| `/` | Client | MapPage | Public | Интерактивная карта с маркерами |
| `/location/:id` | Client | LocationDetailPage | Public | Детали локации + фотогалерея |
| `/admin/login` | Admin | LoginPage | Public | Форма входа |
| `/admin` | Admin | DashboardPage | Bearer | Дашборд со статистикой |
| `/admin/photos` | Admin | PhotosManagePage | Bearer | Управление фото |
| `/admin/locations` | Admin | LocationsManagePage | Bearer | Управление локациями |
| `/admin/locations/:id` | Admin | LocationEditPage | Bearer | Редактирование локации |

### Страницы

**MapPage** — главная страница с Leaflet-картой, маркеры для каждой локации с popup (фото, название, описание, количество фото, дата). Клик по маркеру → переход на LocationDetailPage.

**LocationDetailPage** — hero-секция с обложкой, название и описание с учётом текущей локали, masonry-галерея фото с ленивой загрузкой, lightbox для просмотра полноразмерных фото с навигацией клавишами (←/→/Esc).

**DashboardPage** — статистика (кол-во локаций, фото, несгруппированных фото), быстрые действия: загрузка фото, автогруппировка, заполнение названий.

**PhotosManagePage** — drag-and-drop загрузка, фильтрация по локации, действия над фото: поворот на 90°, удаление (одиночное и массовое), перемещение в локацию, сортировка перетаскиванием.

**LocationsManagePage** — карточки локаций с обложкой, координатами, кол-вом фото. Переход на редактирование.

**LocationEditPage** — табы для мультиязычного контента (RU/EN/FI), поля: название, описание, координаты, дата посещения. Интерактивная карта для выбора координат кликом. Управление фото: выбор обложки, добавление/удаление фото из локации, поворот.

### Компоненты

- **LeafletMap** — обёртка над vue-leaflet: OSM + спутниковые тайлы, переключатель слоёв, маркеры с popup, события marker-click и map-click
- **LanguageSwitcher** — выпадающий список языков (RU, EN, FI)
- **ThemeSwitcher** — переключение тёмной/светлой темы

### Stores (Pinia)

**AuthStore:**
- `token` — JWT-токен (хранится в localStorage)
- `isAuthenticated` — computed от наличия токена
- `login(username, password)` — POST `/api/v1/auth/login`
- `logout()` — очистка токена

**SettingsStore** (с persist):
- `locale` — текущий язык ('ru', 'en', 'fi')
- `darkMode` — тема (true/false/'auto')
- `mapProvider` — провайдер карты ('leaflet'/'google')

### API-клиент (Axios)

Базовый URL: `http://localhost:3000` (из env).

**Интерсепторы:**
- Request: автоматическое добавление `Authorization: Bearer {token}`
- Response: при 401 — автоматический logout и редирект на логин

**clientApi** — публичные методы (locations, photos/file, photos/thumbnail).
**adminApi** — защищённые методы (CRUD фото, CRUD локаций, upload, rotate, move, auto-group, fill-titles).

### Composables

- **useLocaleTitle** — получение title/description с учётом текущей локали (ru→en→''), форматирование дат по локали
- **useKeyboardNav** — обработка клавиш (Escape, Arrow Left/Right) для навигации в lightbox, с проверкой фокуса на input-полях

### Стилизация

- CSS-переменные (Design Tokens): тёплая, землистая палитра
- Шрифты: Cormorant Garamond (serif, заголовки) + Inter (sans, основной)
- Полная поддержка тёмной темы через `.body--dark`
- Адаптивный дизайн

### Цветовая палитра (Quasar Brand)

| Цвет | Hex | Назначение |
|------|-----|-----------|
| primary | `#A67C52` | Тёплый коричневый |
| secondary | `#8A7E72` | Серо-коричневый |
| accent | `#C6A882` | Тёплый тауп |
| positive | `#6B8A5E` | Шалфейный зелёный |
| negative | `#A65050` | Приглушённый красный |
| info | `#6E8898` | Приглушённый синий |

---

## Авторизация

### Поток

1. Админ отправляет `POST /api/v1/auth/login` с `{username, password}`
2. Сервер проверяет bcrypt-хеш (10 salt rounds)
3. При успехе — JWT-токен: `{sub: userId, username}`, срок действия 24ч
4. Клиент хранит токен в localStorage
5. Axios interceptor добавляет `Authorization: Bearer <token>` ко всем запросам
6. AuthGuard на бэкенде проверяет токен, `@Public()` пропускает

### Seed админа

При старте приложения создаётся admin-пользователь из env (`ADMIN_USERNAME`, `ADMIN_PASSWORD`), если его ещё нет.

---

## Обработка медиа

### Поддерживаемые форматы

| Формат | Тип | Обработка |
|--------|-----|----------|
| JPG/JPEG | image | Нормализация ориентации, миниатюра |
| PNG | image | Нормализация ориентации, миниатюра |
| HEIC/HEIF | image | Конвертация в JPG (sharp/heic-convert), миниатюра |
| MOV/MP4 | video | Извлечение первого кадра через ffmpeg, миниатюра |

### Структура загрузок

```
uploads/
├── originals/     # Исходные файлы
├── converted/     # HEIC → JPG (конвертированные)
└── thumbnails/    # Миниатюры 600x600, JPEG 90%
```

### EXIF-извлечение

Библиотека `exifr` извлекает:
- GPS-координаты (latitude, longitude)
- Дата съёмки (DateTimeOriginal)
- Размеры изображения (ImageWidth, ImageHeight)
- Сырые EXIF-данные сохраняются в `photos.exif_data` (JSONB)

---

## Геолокационные функции

### Автогруппировка (Haversine)

Формула Гаверсинуса вычисляет расстояние между двумя GPS-точками на сфере (R = 6371 км). Порог группировки: `GROUPING_PROXIMITY_METERS` (по умолчанию 200м).

### Обратный геокодинг (Nominatim)

Запрашивает OSM Nominatim API для получения human-readable названий мест по координатам. Поддержка языков: EN, RU, FI. Rate-limit: 1 запрос/сек.

---

## Обработка ошибок

### Backend

- **HttpExceptionFilter** (глобальный) — форматирует ответ: `{statusCode, message, timestamp}`
- **processHttpError()** — pattern-based маппинг:
  - "not found" → 404
  - "already exists" → 409
  - "forbidden" → 403
  - "unauthorized" → 401
  - По умолчанию → 500

### Frontend

- Axios response interceptor: 401 → автоматический logout
- Quasar Notify для уведомлений об ошибках
- Quasar Dialog для подтверждений (удаление)

---

## Стандарты кода

### Backend

- **DDD**: Controller → ProcessService (`@Transactional`) → BasicActionsService → RepositoryService → `BaseCrudService`
- **Нейминг**: Entity: `{Name}Entity`, DO: `{Name}Do`, Repository: `{Name}RepositoryService`
- **БД**: `UnderscoreNamingStrategy` (camelCase → snake_case)
- Явные type annotations, named return variables
- Try/catch с `PinoLogger` в каждом сервисном методе
- Сервисы бросают domain errors, контроллеры маппят в HTTP через `processHttpError()`

### Frontend

- Composition API (setup script)
- TypeScript strict mode
- Pinia для глобального состояния
- Composables для переиспользуемой логики
- Vue Router history mode с auth guards

---

## Swagger / OpenAPI

Доступен по адресу: http://localhost:3000/api-docs

Все эндпоинты документированы через декораторы `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`.

---

## Деплой

### Сервер

| Параметр | Значение |
|----------|----------|
| **Сайт** | https://love.rufus.pro |

> Подключение к серверу (IP, SSH порт, ключ) — см. локальный `~/.ssh/config`

### Структура на сервере

```
/opt/apps/
├── deploy.sh                      # Единый скрипт деплоя всех проектов
├── rufus-anastasii/               # git repo
│   ├── docker-compose.server.yml  # Серверный compose (без postgres, внешние сети)
│   ├── .env                       # Секреты проекта (gitignored)
│   ├── backend/
│   ├── frontend/
│   └── uploads/                   # Загруженные фото (Docker volume)
└── infra/                         # Общая инфра
```

### Отличия серверного docker-compose от локального

- **Файл:** `docker-compose.server.yml` (закоммичен в репо)
- **Нет postgres** — используется общий из `/opt/apps/infra/docker-compose.yml`
- **Внешние сети** — `proxy` (для nginx-proxy-manager) и `backend` (для postgres)
- **API_URL** — `https://love.rufus.pro` (вместо `http://localhost:3000`)

### Процесс деплоя

```bash
# Одна команда с локальной машины:
ssh <server> "/opt/apps/deploy.sh rufus-anastasii"
```

Скрипт автоматически: `git pull` → `docker compose build & up` → проверка здоровья контейнеров → очистка образов и build cache.

**Важно:**
- `.env` файлы gitignored — безопасно переживают `git pull`
- Docker сам ставит `node_modules` при сборке (multi-stage build в Dockerfile)
- `uploads/` — Docker volume, данные сохраняются между пересборками