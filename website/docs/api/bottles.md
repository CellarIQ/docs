---
sidebar_position: 2
---

# Bottles API

API per gestire il catalogo di bottiglie (vini e spirits).

## Modello Dati

```typescript
interface Bottle {
  id: number;
  name: string;
  producer: string;
  category: 'wine' | 'whisky' | 'rum' | 'gin' | 'scotch' | 'vodka' | 'tequila' | 'cognac';
  vintage?: number;              // Anno per vini
  age?: number;                  // Età per spirits
  country: string;
  region?: string;
  rating?: number;               // 0-5
  description?: string;
  image_url?: string;
  abv?: number;                  // Alcohol by volume
  external_id?: string;          // ID da API esterna
  external_source?: string;      // 'vivino', 'winevybe', etc.
  created_at: string;
  updated_at: string;
}
```

## Endpoints

### GET /api/bottles

Lista tutte le bottiglie nel database personale.

**Query Parameters:**
- `page` (number): Numero pagina (default: 1)
- `limit` (number): Risultati per pagina (default: 20, max: 100)
- `category` (string): Filtra per categoria
- `country` (string): Filtra per paese
- `sortBy` (string): Campo per ordinamento (name, rating, vintage)
- `order` (string): Direzione (asc, desc)

**Esempio Request:**
```http
GET /api/bottles?category=wine&country=Italy&sortBy=rating&order=desc&page=1&limit=20
```

**Esempio Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Barolo DOCG",
      "producer": "Gaja",
      "category": "wine",
      "vintage": 2015,
      "country": "Italy",
      "region": "Piedmont",
      "rating": 4.5,
      "description": "Un vino rosso elegante e strutturato...",
      "image_url": "https://example.com/barolo.jpg",
      "abv": 14.5,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### GET /api/bottles/:id

Ottieni dettagli di una bottiglia specifica.

**URL Parameters:**
- `id` (number): ID della bottiglia

**Esempio Request:**
```http
GET /api/bottles/1
```

**Esempio Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Barolo DOCG",
    "producer": "Gaja",
    "category": "wine",
    "vintage": 2015,
    "country": "Italy",
    "region": "Piedmont",
    "rating": 4.5,
    "description": "Un vino rosso elegante e strutturato del Piemonte",
    "image_url": "https://example.com/barolo.jpg",
    "abv": 14.5,
    "external_id": "123456",
    "external_source": "vivino",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "BOTTLE_NOT_FOUND",
    "message": "Bottle with ID 999 not found"
  }
}
```

---

### POST /api/bottles

Crea una nuova bottiglia nel catalogo personale.

**Request Body:**
```json
{
  "name": "Whisky Lagavulin 16",
  "producer": "Lagavulin",
  "category": "whisky",
  "age": 16,
  "country": "Scotland",
  "region": "Islay",
  "rating": 4.7,
  "description": "Whisky torbato con note di fumo e mare",
  "image_url": "https://example.com/lagavulin.jpg",
  "abv": 43.0
}
```

**Validazione:**
- `name` (required): string, min 2 caratteri
- `producer` (optional): string
- `category` (required): enum ['wine', 'whisky', 'rum', 'gin', 'scotch', 'vodka', 'tequila', 'cognac']
- `vintage` (optional): number, 1900-2100
- `age` (optional): number, 1-100
- `rating` (optional): number, 0-5

**Esempio Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Whisky Lagavulin 16",
    "producer": "Lagavulin",
    "category": "whisky",
    "age": 16,
    "country": "Scotland",
    "region": "Islay",
    "rating": 4.7,
    "description": "Whisky torbato con note di fumo e mare",
    "image_url": "https://example.com/lagavulin.jpg",
    "abv": 43.0,
    "created_at": "2024-12-24T14:30:00Z",
    "updated_at": "2024-12-24T14:30:00Z"
  },
  "message": "Bottle created successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "category",
        "message": "Category must be one of: wine, whisky, rum, gin, scotch, vodka, tequila, cognac"
      }
    ]
  }
}
```

---

### PUT /api/bottles/:id

Aggiorna una bottiglia esistente.

**URL Parameters:**
- `id` (number): ID della bottiglia

**Request Body:**
```json
{
  "rating": 4.8,
  "description": "Descrizione aggiornata dopo nuova degustazione"
}
```

:::info
Puoi inviare solo i campi che vuoi modificare. I campi omessi rimangono invariati.
:::

**Esempio Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Barolo DOCG",
    "rating": 4.8,
    "description": "Descrizione aggiornata dopo nuova degustazione",
    "updated_at": "2024-12-24T15:00:00Z"
  },
  "message": "Bottle updated successfully"
}
```

---

### DELETE /api/bottles/:id

Elimina una bottiglia dal catalogo.

**URL Parameters:**
- `id` (number): ID della bottiglia

**Esempio Request:**
```http
DELETE /api/bottles/1
```

**Esempio Response (200):**
```json
{
  "success": true,
  "message": "Bottle deleted successfully"
}
```

:::warning Attenzione
L'eliminazione di una bottiglia **eliminerà anche** tutti i riferimenti nella cantina, preferiti e abbinamenti (CASCADE DELETE).
:::

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "BOTTLE_NOT_FOUND",
    "message": "Bottle with ID 999 not found"
  }
}
```

---

## Esempi di Codice

### JavaScript (Fetch)

```javascript
// GET - Lista bottiglie
const getBottles = async () => {
  const response = await fetch('/api/bottles?category=wine&limit=10');
  const data = await response.json();
  return data.data;
};

// POST - Crea bottiglia
const createBottle = async (bottleData) => {
  const response = await fetch('/api/bottles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bottleData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.data;
};

// PUT - Aggiorna bottiglia
const updateBottle = async (id, updates) => {
  const response = await fetch(`/api/bottles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  return data.data;
};

// DELETE - Elimina bottiglia
const deleteBottle = async (id) => {
  const response = await fetch(`/api/bottles/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  return data;
};
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useBottles(filters = {}) {
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBottles = async () => {
      try {
        setLoading(true);
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/bottles?${queryString}`);

        if (!response.ok) throw new Error('Failed to fetch bottles');

        const data = await response.json();
        setBottles(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBottles();
  }, [filters]);

  return { bottles, loading, error };
}

// Utilizzo
function BottlesList() {
  const { bottles, loading, error } = useBottles({ category: 'wine' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {bottles.map(bottle => (
        <div key={bottle.id}>{bottle.name}</div>
      ))}
    </div>
  );
}
```

### cURL Examples

```bash
# GET - Lista bottiglie
curl -X GET "http://localhost:3000/api/bottles?category=wine&limit=10"

# GET - Dettaglio bottiglia
curl -X GET "http://localhost:3000/api/bottles/1"

# POST - Crea bottiglia
curl -X POST "http://localhost:3000/api/bottles" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Barolo DOCG",
    "producer": "Gaja",
    "category": "wine",
    "vintage": 2015,
    "country": "Italy",
    "region": "Piedmont",
    "rating": 4.5,
    "abv": 14.5
  }'

# PUT - Aggiorna bottiglia
curl -X PUT "http://localhost:3000/api/bottles/1" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4.8,
    "description": "Updated description"
  }'

# DELETE - Elimina bottiglia
curl -X DELETE "http://localhost:3000/api/bottles/1"
```

## Best Practices

### 1. Validazione Client-Side

Prima di inviare la richiesta, valida i dati:

```javascript
function validateBottle(bottle) {
  const errors = [];

  if (!bottle.name || bottle.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!bottle.category) {
    errors.push('Category is required');
  }

  if (bottle.rating && (bottle.rating < 0 || bottle.rating > 5)) {
    errors.push('Rating must be between 0 and 5');
  }

  return errors;
}
```

### 2. Error Handling

```javascript
async function createBottleWithErrorHandling(bottleData) {
  try {
    const response = await fetch('/api/bottles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bottleData)
    });

    if (response.status === 400) {
      const error = await response.json();
      console.error('Validation errors:', error.error.details);
      return { success: false, errors: error.error.details };
    }

    if (!response.ok) {
      throw new Error('Server error');
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. Caching

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

async function getCachedBottle(id) {
  const cacheKey = `bottle_${id}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await fetch(`/api/bottles/${id}`);
  const data = await response.json();

  cache.set(cacheKey, {
    data: data.data,
    timestamp: Date.now()
  });

  return data.data;
}
```

## Prossimi Passi

- [Cellar API](./cellar)
- [Search API](./search)
- [Favorites API](./favorites)
