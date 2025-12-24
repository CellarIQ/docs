# 🍷 MyCellar - Documentazione Tecnica

## Panoramica del Progetto

MyCellar è un'applicazione web per la gestione personale di una cantina di vini e spirits (whisky, rum, gin, scotch). L'applicazione permette di:

- ✅ Aggiungere vini e spirits alla lista dei preferiti
- ✅ Gestire una cantina personalizzabile
- ✅ Calcolare il valore della cantina e il rendimento dell'investimento
- ✅ Gestire multiple bottiglie dello stesso tipo
- ✅ Visualizzare suggerimenti di abbinamento per degustazioni, aperitivi, pranzi e cene
- ✅ Importare bottiglie da API esterne (Vivino, WineVybe, etc.)

---

## 📊 Schema Database

### Tabella: **bottles**
Contiene tutte le bottiglie nel database personale.

```sql
CREATE TABLE bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    producer VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- 'wine', 'whisky', 'rum', 'gin', 'scotch'
    vintage INTEGER,
    age INTEGER, -- per spirits
    country VARCHAR(100),
    region VARCHAR(100),
    rating DECIMAL(2,1),
    description TEXT,
    image_url VARCHAR(500),
    abv DECIMAL(4,2), -- alcohol by volume
    external_id VARCHAR(255), -- ID da API esterna
    external_source VARCHAR(50), -- 'vivino', 'winevybe', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabella: **cellar_bottles**
Contiene le bottiglie nella cantina con quantità e prezzi.

```sql
CREATE TABLE cellar_bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    location VARCHAR(100), -- es. "Scaffale A1", "Cantina Piano -1"
    purchase_date DATE,
    notes TEXT,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

### Tabella: **favorites**
Contiene i preferiti dell'utente.

```sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

### Tabella: **pairings**
Suggerimenti di abbinamento per ciascuna bottiglia.

```sql
CREATE TABLE pairings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    pairing_type VARCHAR(50), -- 'food', 'occasion', 'temperature'
    pairing_value VARCHAR(255),
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);
```

### Tabella: **consumption_history**
Storico dei consumi (opzionale per tracking).

```sql
CREATE TABLE consumption_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cellar_bottle_id INTEGER NOT NULL,
    consumed_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    occasion VARCHAR(255),
    rating INTEGER, -- 1-5
    notes TEXT,
    FOREIGN KEY (cellar_bottle_id) REFERENCES cellar_bottles(id) ON DELETE CASCADE
);
```

---

## 🔌 Integrazione API

### 1. Vivino API (Wine)

**Endpoint**: Non ufficiale, accessibile tramite web scraping

```javascript
// Esempio di chiamata API Vivino
async function searchVivino(query) {
    const response = await fetch('https://www.vivino.com/api/explore/explore', {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        params: {
            country_code: 'IT',
            currency_code: 'EUR',
            grape_filter: 'varietal',
            min_rating: '1',
            order_by: 'price',
            order: 'asc',
            page: 1,
            wine_type_ids: ['1'] // 1=Red, 2=White, 3=Sparkling, 4=Rose
        }
    });
    
    const data = await response.json();
    
    return data.explore_vintage.matches.map(item => ({
        name: item.vintage.wine.name,
        producer: item.vintage.wine.winery.name,
        vintage: item.vintage.year,
        rating: item.vintage.statistics.ratings_average,
        ratings_count: item.vintage.statistics.ratings_count,
        image: item.vintage.image.location,
        region: item.vintage.wine.region.name,
        country: item.vintage.wine.region.country.name,
        price: item.price?.amount,
        external_id: item.vintage.wine.id,
        external_source: 'vivino'
    }));
}
```

**Note**:
- Vivino non ha un'API pubblica ufficiale
- L'API non documentata potrebbe cambiare senza preavviso
- Rispettare i rate limits per evitare blocchi
- Considera l'uso di proxy per evitare blocchi IP

---

### 2. Global Wine Score API (Wine)

**Endpoint**: https://www.globalwinescore.com/api/

```javascript
async function searchGlobalWineScore(query) {
    const API_KEY = 'YOUR_API_KEY'; // Registrarsi su globalwinescore.com
    
    const response = await fetch(`https://api.globalwinescore.com/globalwinescores/latest/?wine=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Token ${API_KEY}`
        }
    });
    
    const data = await response.json();
    
    return data.results.map(wine => ({
        name: wine.wine,
        producer: wine.winery,
        vintage: wine.vintage,
        rating: wine.score / 20, // Converti da 100 a 5
        country: wine.country,
        region: wine.region,
        color: wine.color,
        external_id: wine.id,
        external_source: 'globalwinescore'
    }));
}
```

**Vantaggi**:
- API ufficiale e documentata
- Database di 26,000+ vini
- Gratuita per uso personale
- Include punteggi aggregati da critici

---

### 3. WineVybe API (Wine & Spirits)

**Endpoint**: https://winevybe.com/api/

```javascript
async function searchWineVybe(query, category = 'wine') {
    const API_KEY = 'YOUR_API_KEY';
    
    const endpoints = {
        wine: 'https://api.winevybe.com/wines',
        spirits: 'https://api.winevybe.com/liquor'
    };
    
    const response = await fetch(`${endpoints[category === 'wine' ? 'wine' : 'spirits']}?search=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    });
    
    const data = await response.json();
    
    return data.products.map(product => ({
        name: product.name,
        producer: product.producer?.name,
        category: product.category,
        country: product.country,
        region: product.region,
        description: product.description,
        image: product.image_url,
        abv: product.alcohol_by_volume,
        external_id: product.id,
        external_source: 'winevybe'
    }));
}
```

**Caratteristiche**:
- 200,000+ bottiglie di vini e spirits
- Include whisky, rum, gin, vodka, tequila
- Dati su produttore, distilleria, regione
- Profili di degustazione e abbinamenti

---

### 4. Wine-Searcher API (Wine & Spirits) - A PAGAMENTO

**Costo**: $350/mese  
**Endpoint**: https://www.wine-searcher.com/trade/ws-api

```javascript
async function searchWineSearcher(query) {
    const API_KEY = 'YOUR_API_KEY';
    
    const response = await fetch(`https://api.wine-searcher.com/lwin/search`, {
        params: {
            api_key: API_KEY,
            winename: query,
            currencycode: 'EUR'
        }
    });
    
    const data = await response.json();
    
    return {
        name: data.wine_name,
        vintage: data.vintage,
        producer: data.producer,
        region: data.region,
        grape: data.grape_variety,
        score: data.score,
        price_min: data['price-min'],
        price_max: data['price-max'],
        price_avg: data['price-average'],
        abv: data.abv
    };
}
```

**Vantaggi**:
- Database più completo
- Include prezzi di mercato aggiornati
- Supporta vini E spirits
- API ufficiale e stabile

---

### 5. TheCocktailDB (Spirits Information)

**Endpoint**: https://www.thecocktaildb.com/api.php

```javascript
async function searchSpirit(name) {
    const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?i=${encodeURIComponent(name)}`);
    const data = await response.json();
    
    if (data.ingredients) {
        return data.ingredients.map(spirit => ({
            name: spirit.strIngredient,
            description: spirit.strDescription,
            type: spirit.strType,
            abv: spirit.strABV
        }));
    }
}
```

**Caratteristiche**:
- API gratuita
- Focus su spirits per cocktail
- Informazioni base su distillati

---

## 🎨 Stack Tecnologico

### Frontend
- **React 18** - UI Library
- **Tailwind CSS** - Styling
- **Font Awesome** - Icons
- **LocalStorage** - Persistenza dati client-side (temporanea)

### Backend (Suggerito)
- **Node.js + Express** - API Server
- **SQLite / PostgreSQL** - Database
- **Axios** - HTTP Client per API esterne
- **JWT** - Autenticazione (se multi-utente)

### Alternative Backend
- **Python + Flask/FastAPI** + SQLAlchemy
- **PHP + Laravel**
- **Ruby on Rails**

---

## 📁 Struttura Progetto Backend

```
wine-cellar-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── api-keys.js
│   ├── controllers/
│   │   ├── bottlesController.js
│   │   ├── cellarController.js
│   │   ├── favoritesController.js
│   │   └── searchController.js
│   ├── models/
│   │   ├── Bottle.js
│   │   ├── CellarBottle.js
│   │   └── Favorite.js
│   ├── routes/
│   │   ├── bottles.js
│   │   ├── cellar.js
│   │   ├── favorites.js
│   │   └── search.js
│   ├── services/
│   │   ├── vivinoService.js
│   │   ├── wineVybeService.js
│   │   └── globalWineScoreService.js
│   └── utils/
│       ├── validators.js
│       └── helpers.js
├── migrations/
│   └── create-tables.sql
├── package.json
└── server.js
```

---

## 🚀 API Endpoints Backend

### Bottles

```
GET    /api/bottles              - Lista tutte le bottiglie
GET    /api/bottles/:id          - Dettaglio bottiglia
POST   /api/bottles              - Crea nuova bottiglia
PUT    /api/bottles/:id          - Aggiorna bottiglia
DELETE /api/bottles/:id          - Elimina bottiglia
```

### Cellar

```
GET    /api/cellar               - Lista bottiglie in cantina
POST   /api/cellar               - Aggiungi bottiglia alla cantina
PUT    /api/cellar/:id           - Aggiorna bottiglia in cantina
DELETE /api/cellar/:id           - Rimuovi da cantina
GET    /api/cellar/stats         - Statistiche cantina (valore, ROI, etc.)
```

### Favorites

```
GET    /api/favorites            - Lista preferiti
POST   /api/favorites            - Aggiungi ai preferiti
DELETE /api/favorites/:id        - Rimuovi dai preferiti
```

### Search

```
GET    /api/search?q=query&category=wine    - Cerca vini/spirits da API esterne
GET    /api/search/import/:externalId       - Importa bottiglia da API
```

### Pairings

```
GET    /api/pairings/:bottleId   - Suggerimenti abbinamento
POST   /api/pairings             - Aggiungi abbinamento personalizzato
```

---

## 💡 Funzionalità da Implementare

### Fase 1 - MVP ✅
- [x] Interfaccia base
- [x] Gestione cantina
- [x] Lista preferiti
- [x] Calcolo valore e rendimento
- [x] Gestione quantità multiple
- [x] Abbinamenti gastronomici

### Fase 2 - Integrazioni API
- [ ] Integrazione Vivino API
- [ ] Integrazione WineVybe API
- [ ] Integrazione Global Wine Score
- [ ] Sistema di cache per ridurre chiamate API
- [ ] Rate limiting per API

### Fase 3 - Features Avanzate
- [ ] Sistema di autenticazione utenti
- [ ] Backup e sincronizzazione cloud
- [ ] Scansione etichette con fotocamera (OCR)
- [ ] Grafici e analytics avanzate
- [ ] Export/Import dati (CSV, Excel)
- [ ] Condivisione collezione con altri utenti
- [ ] Sistema di notifiche (es. vino pronto da bere)
- [ ] Integrazione sensori temperatura/umidità

### Fase 4 - AI & ML
- [ ] Suggerimenti personalizzati basati su gusti
- [ ] Predizione aumento valore bottiglie
- [ ] Riconoscimento automatico etichette con AI
- [ ] Chatbot per consigli abbinamento
- [ ] Sistema di raccomandazione basato su ML

---

## 🔐 Gestione API Keys

Crea un file `.env` per le API keys:

```env
# Vivino (non ufficiale, nessuna key necessaria)

# Global Wine Score
GLOBAL_WINE_SCORE_API_KEY=your_key_here

# WineVybe
WINEVYBE_API_KEY=your_key_here

# Wine-Searcher (a pagamento)
WINE_SEARCHER_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mycellar

# JWT Secret
JWT_SECRET=your_secret_here
```

**IMPORTANTE**: Non committare mai il file `.env` nel repository Git!

---

## 📊 Esempio di Calcolo Rendimento

```javascript
function calculatePortfolioStats(cellarBottles) {
    const stats = cellarBottles.reduce((acc, bottle) => {
        const totalPurchase = bottle.purchase_price * bottle.quantity;
        const totalCurrent = bottle.current_price * bottle.quantity;
        const totalReturn = totalCurrent - totalPurchase;
        
        return {
            totalBottles: acc.totalBottles + bottle.quantity,
            totalInvestment: acc.totalInvestment + totalPurchase,
            totalValue: acc.totalValue + totalCurrent,
            totalReturn: acc.totalReturn + totalReturn
        };
    }, {
        totalBottles: 0,
        totalInvestment: 0,
        totalValue: 0,
        totalReturn: 0
    });
    
    stats.returnPercentage = stats.totalInvestment > 0 
        ? (stats.totalReturn / stats.totalInvestment) * 100 
        : 0;
    
    return stats;
}
```

---

## 🍽️ Sistema di Abbinamenti

### Database Abbinamenti per Categoria

```javascript
const PAIRINGS_DATABASE = {
    wine: {
        red: {
            bold: ['Carne rossa alla griglia', 'Brasato', 'Formaggi stagionati', 'Selvaggina'],
            medium: ['Pasta al ragù', 'Lasagne', 'Pizza', 'Salumi'],
            light: ['Pollo arrosto', 'Pasta al pomodoro', 'Formaggi morbidi']
        },
        white: {
            dry: ['Pesce', 'Frutti di mare', 'Risotto', 'Verdure'],
            aromatic: ['Cucina asiatica', 'Pesce speziato', 'Formaggi erborinati'],
            sweet: ['Foie gras', 'Dessert', 'Formaggi blu']
        },
        sparkling: ['Aperitivo', 'Ostriche', 'Sushi', 'Fritti', 'Dessert leggeri'],
        rose: ['Antipasti', 'Insalate', 'Pesce grigliato', 'Cucina mediterranea']
    },
    whisky: ['Cioccolato fondente', 'Salmone affumicato', 'Formaggi blu', 'Carne affumicata', 'Sigari'],
    scotch: ['Salmone', 'Formaggi affumicati', 'Carne di selvaggina', 'Cioccolato fondente'],
    rum: ['Dessert al cioccolato', 'Sigari', 'Frutta tropicale', 'Caffè', 'Gelato'],
    gin: ['Antipasti', 'Frutti di mare', 'Insalate', 'Formaggi freschi', 'Cocktail']
};
```

### Temperatura di Servizio

```javascript
const SERVING_TEMPERATURES = {
    wine: {
        red_bold: '16-18°C',
        red_medium: '14-16°C',
        red_light: '12-14°C',
        white_dry: '8-10°C',
        white_sweet: '6-8°C',
        sparkling: '6-8°C',
        rose: '8-10°C'
    },
    whisky: '18-22°C',
    scotch: '18-20°C',
    rum: '18-20°C',
    gin: '4-6°C (in cocktail)'
};
```

---

## 🎯 Best Practices

### Performance
1. **Caching**: Cache le risposte delle API esterne per 24h
2. **Lazy Loading**: Carica le immagini in modo lazy
3. **Pagination**: Implementa paginazione per liste grandi
4. **Debouncing**: Usa debouncing per le ricerche

### Security
1. **Sanitizzazione Input**: Valida e sanitizza tutti gli input utente
2. **Rate Limiting**: Limita le richieste API per IP/utente
3. **HTTPS**: Usa sempre HTTPS in produzione
4. **Environment Variables**: Non esporre mai le API keys

### UX
1. **Loading States**: Mostra loader durante chiamate API
2. **Error Handling**: Gestisci gracefully gli errori API
3. **Offline Support**: Implementa funzionalità offline base
4. **Mobile First**: Design responsive da mobile

---

## 📈 Metriche da Tracciare

```javascript
const METRICS = {
    portfolio: {
        totalBottles: 'Numero totale bottiglie',
        totalValue: 'Valore totale cantina',
        totalInvestment: 'Investimento totale',
        totalReturn: 'Guadagno/Perdita',
        returnPercentage: 'ROI %',
        averageBottleValue: 'Valore medio bottiglia'
    },
    consumption: {
        bottlesConsumed: 'Bottiglie consumate',
        consumptionRate: 'Tasso di consumo (bot/mese)',
        favoriteCategory: 'Categoria preferita'
    },
    collection: {
        uniqueBottles: 'Bottiglie uniche',
        vintageRange: 'Range annate',
        countryDiversity: 'Paesi rappresentati',
        categoryDistribution: 'Distribuzione categorie'
    }
};
```

---

## 🐛 Debugging API Calls

Esempio di logger per debugging chiamate API:

```javascript
async function apiCall(url, options = {}) {
    console.log(`[API] Calling: ${url}`);
    console.log(`[API] Options:`, options);
    
    const startTime = Date.now();
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        console.log(`[API] Success in ${Date.now() - startTime}ms`);
        console.log(`[API] Response:`, data);
        
        return data;
    } catch (error) {
        console.error(`[API] Error after ${Date.now() - startTime}ms:`, error);
        throw error;
    }
}
```

---

## 📞 Supporto e Risorse

### Documentazione API
- [Vivino API (Unofficial)](https://github.com/aptash/vivino-api)
- [Global Wine Score API](https://www.globalwinescore.com/api/)
- [WineVybe API](https://winevybe.com/)
- [Wine-Searcher API](https://www.wine-searcher.com/trade/api)

### Community
- [Reddit r/wine](https://reddit.com/r/wine)
- [Reddit r/webdev](https://reddit.com/r/webdev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/api)

---

## 📝 Note Finali

### Limitazioni Attuali
- Vivino API non ufficiale può cambiare senza preavviso
- Alcuni dati potrebbero non essere disponibili per tutti i prodotti
- I prezzi di mercato potrebbero non essere sempre accurati

### Prossimi Passi
1. Implementare backend con Node.js/Express
2. Integrare le API esterne
3. Aggiungere autenticazione utenti
4. Deploy su Heroku/Vercel/AWS

### Contributi
Questo progetto è open source. Pull requests sono benvenute!

---

**Versione**: 1.0.0  
**Ultimo Aggiornamento**: Dicembre 2024  
**Autore**: Wine Cellar Management System

---

## 🎉 Conclusione

Hai ora una base solida per costruire la tua applicazione di gestione cantina! Il prototipo HTML funzionante può essere testato immediatamente aprendo il file nel browser, mentre questa documentazione ti guiderà nell'implementazione del backend e delle integrazioni API.

Buona fortuna con lo sviluppo! 🍷🥃
