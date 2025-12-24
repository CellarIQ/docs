---
sidebar_position: 1
---

# Architettura del Sistema

MyCellar è progettato con un'architettura moderna e modulare che separa frontend, backend e database.

## Overview Architetturale

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         React Frontend (SPA)                       │ │
│  │  - UI Components (Tailwind CSS)                    │ │
│  │  - State Management (React Hooks)                  │ │
│  │  - LocalStorage (Prototipo)                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Express.js REST API                        │ │
│  │  - Routes                                          │ │
│  │  - Controllers                                     │ │
│  │  - Middleware (CORS, Helmet, Rate Limiting)        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 BUSINESS LOGIC LAYER                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Services                                    │ │
│  │  - Bottle Service                                  │ │
│  │  - Cellar Service                                  │ │
│  │  - Search Service (API Integrations)               │ │
│  │  - Analytics Service                               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │         SQLite Database                            │ │
│  │  - bottles                                         │ │
│  │  - cellar_bottles                                  │ │
│  │  - favorites                                       │ │
│  │  - pairings                                        │ │
│  │  - consumption_history                             │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Vivino     │  │ Global Wine  │  │  WineVybe    │  │
│  │     API      │  │   Score API  │  │     API      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Componenti Principali

### 1. Frontend (Client Layer)

**Tecnologie:**
- React 18 con Hooks
- Tailwind CSS per styling
- Font Awesome per icone
- Fetch API per comunicazione HTTP

**Responsabilità:**
- Rendering UI/UX
- Gestione stato applicazione
- Validazione input client-side
- Comunicazione con API backend
- Caching locale (LocalStorage per prototipo)

**Componenti Principali:**
```
src/
├── components/
│   ├── Dashboard/
│   │   ├── StatsCard.jsx
│   │   └── CellarOverview.jsx
│   ├── Cellar/
│   │   ├── BottleCard.jsx
│   │   ├── BottleList.jsx
│   │   └── AddBottleForm.jsx
│   ├── Search/
│   │   ├── SearchBar.jsx
│   │   └── SearchResults.jsx
│   └── Favorites/
│       └── FavoritesList.jsx
├── services/
│   └── api.js
└── utils/
    ├── formatters.js
    └── validators.js
```

### 2. Backend (API + Business Logic Layer)

**Tecnologie:**
- Node.js 16+
- Express.js 4.x
- SQLite3 / PostgreSQL
- Axios per chiamate API esterne

**Responsabilità:**
- Gestione richieste HTTP
- Business logic
- Validazione dati server-side
- Autenticazione/Autorizzazione
- Integrazione API esterne
- Calcoli ROI e statistiche

**Struttura:**
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Configurazione DB
│   │   └── api-keys.js      # Gestione API keys
│   ├── controllers/
│   │   ├── bottlesController.js
│   │   ├── cellarController.js
│   │   ├── favoritesController.js
│   │   ├── searchController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   ├── Bottle.js
│   │   ├── CellarBottle.js
│   │   ├── Favorite.js
│   │   └── Pairing.js
│   ├── routes/
│   │   ├── bottles.js
│   │   ├── cellar.js
│   │   ├── favorites.js
│   │   └── search.js
│   ├── services/
│   │   ├── vivinoService.js
│   │   ├── wineVybeService.js
│   │   ├── globalWineScoreService.js
│   │   └── analyticsService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── validators.js
│       └── helpers.js
└── server.js
```

### 3. Database Layer

**Tecnologia:** SQLite (dev) / PostgreSQL (prod)

**Schema Principale:**

#### Tabella: bottles
```sql
CREATE TABLE bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    producer VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    vintage INTEGER,
    age INTEGER,
    country VARCHAR(100),
    region VARCHAR(100),
    rating DECIMAL(2,1),
    description TEXT,
    image_url VARCHAR(500),
    abv DECIMAL(4,2),
    external_id VARCHAR(255),
    external_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabella: cellar_bottles
```sql
CREATE TABLE cellar_bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    location VARCHAR(100),
    purchase_date DATE,
    notes TEXT,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

Per lo schema completo, vedi [Database Schema](./database-schema).

### 4. External Services Layer

**Integrazioni API:**
- **Vivino** - Database vini mondiale
- **Global Wine Score** - Punteggi e rating
- **WineVybe** - Vini + Spirits

**Pattern di Integrazione:**
```javascript
// Service Pattern
class VivinoService {
  async search(query) {
    // Implementazione ricerca
  }

  async getBottleDetails(id) {
    // Implementazione dettagli
  }
}

// Fallback Strategy
async function searchAllAPIs(query) {
  try {
    return await vivinoService.search(query);
  } catch (error) {
    try {
      return await globalWineScoreService.search(query);
    } catch (error2) {
      return await wineVybeService.search(query);
    }
  }
}
```

## Flussi di Dati

### 1. Ricerca Bottiglia

```
[User Input]
    → Frontend: SearchBar
    → API: GET /api/search?q=barolo
    → Service: searchAllAPIs()
    → External API: Vivino/WineVybe
    → Service: Transform Data
    → API: JSON Response
    → Frontend: Display Results
```

### 2. Aggiungi a Cantina

```
[User Action]
    → Frontend: AddBottleForm
    → API: POST /api/cellar
    → Validation Middleware
    → Controller: cellarController.add()
    → Model: CellarBottle.create()
    → Database: INSERT
    → Response: Created Bottle
    → Frontend: Update UI + Toast
```

### 3. Calcolo Statistiche

```
[Dashboard Load]
    → API: GET /api/cellar/stats
    → Service: analyticsService.calculate()
    → Database: Multiple Queries (JOIN, SUM, GROUP BY)
    → Service: Aggregate Data
    → Service: Calculate ROI
    → Response: Stats Object
    → Frontend: Render Charts/Cards
```

## Sicurezza

### 1. Autenticazione (Futura)
- JWT (JSON Web Tokens)
- bcrypt per hashing password
- Refresh token strategy

### 2. Validazione
- Input validation (express-validator)
- SQL injection protection (prepared statements)
- XSS protection (helmet middleware)

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100 // max 100 richieste
});

app.use('/api/', limiter);
```

### 4. CORS
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

## Scalabilità

### Considerazioni

1. **Database Migration**: SQLite → PostgreSQL per produzione
2. **Caching**: Redis per cache API responses
3. **CDN**: CloudFlare per static assets
4. **Load Balancing**: Nginx per multiple instances
5. **Monitoring**: PM2 + Sentry per error tracking

### Architettura Scalata

```
                    [Load Balancer]
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   [Server 1]        [Server 2]        [Server 3]
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                   [Redis Cache]
                          │
                          ▼
                 [PostgreSQL DB]
                    (Primary)
                          │
                          ▼
                 [PostgreSQL DB]
                   (Replica)
```

## Performance

### Ottimizzazioni

1. **Database Indexes**
```sql
CREATE INDEX idx_bottles_category ON bottles(category);
CREATE INDEX idx_cellar_bottle_id ON cellar_bottles(bottle_id);
```

2. **API Response Caching**
```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h
const cache = new Map();
```

3. **Pagination**
```javascript
// GET /api/bottles?page=1&limit=20
const limit = parseInt(req.query.limit) || 20;
const offset = (parseInt(req.query.page) - 1) * limit || 0;
```

4. **Lazy Loading Images**
```jsx
<img loading="lazy" src={bottle.image_url} />
```

## Deployment Architecture

### Development
```
Local Machine
├── Frontend: localhost:3001
├── Backend: localhost:3000
└── Database: ./mycellar.db
```

### Production
```
Cloud Provider (AWS/Heroku/Vercel)
├── Frontend: CDN (Vercel/Netlify)
├── Backend: EC2/Heroku
├── Database: RDS PostgreSQL
└── Cache: ElastiCache Redis
```

## Prossimi Passi

- [Database Schema Dettagliato](./database-schema)
- [API Design Patterns](./api-patterns)
- [Security Best Practices](./security)
