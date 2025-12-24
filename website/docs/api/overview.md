---
sidebar_position: 1
---

# API Overview

MyCellar fornisce una REST API completa per gestire bottiglie, cantina, preferiti e analytics.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Autenticazione

:::info
L'autenticazione JWT sarà implementata nella Fase 2. Attualmente l'API è aperta.
:::

Quando implementata, usa il token JWT nell'header:

```http
Authorization: Bearer your_jwt_token_here
```

## Formato Risposte

Tutte le risposte sono in formato JSON:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Codici di Stato HTTP

| Codice | Descrizione |
|--------|-------------|
| 200 | OK - Richiesta completata con successo |
| 201 | Created - Risorsa creata con successo |
| 400 | Bad Request - Richiesta malformata |
| 401 | Unauthorized - Autenticazione richiesta |
| 403 | Forbidden - Accesso negato |
| 404 | Not Found - Risorsa non trovata |
| 429 | Too Many Requests - Rate limit superato |
| 500 | Internal Server Error - Errore del server |

## Rate Limiting

Per proteggere l'API, è implementato un rate limiting:

- **100 richieste** per 15 minuti per IP
- **1000 richieste** per giorno per utente autenticato

Headers di risposta:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

Gli endpoint che restituiscono liste supportano la paginazione:

```http
GET /api/bottles?page=1&limit=20
```

Risposta:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

## Filtering & Sorting

### Filtering
```http
GET /api/bottles?category=wine&country=Italy
```

### Sorting
```http
GET /api/bottles?sortBy=rating&order=desc
```

Parametri disponibili:
- `sortBy`: Campo per ordinamento (name, rating, price, vintage)
- `order`: Direzione (asc, desc)

## API Endpoints

### Bottles
```
GET    /api/bottles              # Lista bottiglie
GET    /api/bottles/:id          # Dettaglio bottiglia
POST   /api/bottles              # Crea bottiglia
PUT    /api/bottles/:id          # Aggiorna bottiglia
DELETE /api/bottles/:id          # Elimina bottiglia
```

### Cellar
```
GET    /api/cellar               # Lista cantina
GET    /api/cellar/stats         # Statistiche
POST   /api/cellar               # Aggiungi a cantina
PUT    /api/cellar/:id           # Aggiorna in cantina
DELETE /api/cellar/:id           # Rimuovi da cantina
```

### Favorites
```
GET    /api/favorites            # Lista preferiti
POST   /api/favorites            # Aggiungi preferito
DELETE /api/favorites/:bottleId  # Rimuovi preferito
```

### Search
```
GET    /api/search               # Cerca nelle API esterne
POST   /api/search/import        # Importa da API
```

### Pairings
```
GET    /api/pairings/:bottleId   # Abbinamenti per bottiglia
POST   /api/pairings             # Crea abbinamento
```

### Consumption
```
GET    /api/consumption          # Storico consumi
POST   /api/consumption          # Registra consumo
```

## Esempi di Utilizzo

### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/bottles', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### cURL
```bash
curl -X GET http://localhost:3000/api/bottles \
  -H "Content-Type: application/json"
```

### Axios
```javascript
import axios from 'axios';

const response = await axios.get('http://localhost:3000/api/bottles');
console.log(response.data);
```

## Error Handling

Esempio di gestione errori:

```javascript
try {
  const response = await fetch('/api/bottles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bottleData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // Gestisci l'errore
}
```

## CORS

L'API supporta CORS per permettere richieste da domini diversi:

```javascript
// Configurazione CORS
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Versioning

Attualmente: **v1**

Future versioni saranno accessibili tramite:
```
/api/v2/bottles
```

## Webhook (Futuro)

Nella Fase 3 saranno disponibili webhook per eventi:
- Nuova bottiglia aggiunta
- Consumo registrato
- Valore cantina cambiato significativamente

## GraphQL (Futuro)

Nella Fase 4 sarà disponibile un endpoint GraphQL:
```
POST /graphql
```

## Prossimi Passi

- [Bottles API](./bottles)
- [Cellar API](./cellar)
- [Search API](./search)
