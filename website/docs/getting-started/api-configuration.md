---
sidebar_position: 2
---

# Configurazione API Keys

MyCellar può integrarsi con diverse API esterne per arricchire il catalogo di vini e spirits. Questa guida ti mostra come configurare ciascuna API.

## Overview delle API Disponibili

| API | Tipo | Costo | Database | Categorie |
|-----|------|-------|----------|-----------|
| **Vivino** | Non ufficiale | Gratuita | Mondiale | Solo Vini |
| **Global Wine Score** | Ufficiale | Gratuita | 26,000+ vini | Solo Vini |
| **WineVybe** | Commerciale | A pagamento | 200,000+ | Vini + Spirits |
| **Wine-Searcher** | Commerciale | $350/mese | Completo | Vini + Spirits |

## Global Wine Score (Gratuita) 🎉

### Registrazione

1. Vai su [GlobalWineScore.com](https://www.globalwinescore.com/api/)
2. Clicca su "Get API Access"
3. Compila il form di registrazione
4. Riceverai la chiave API via email

### Configurazione

Aggiungi la chiave al file `.env`:

```env
GLOBAL_WINE_SCORE_API_KEY=your_key_here
```

### Caratteristiche

- ✅ **Gratuita** per uso personale
- ✅ Database di **26,000+ vini**
- ✅ Punteggi aggregati da critici mondiali
- ✅ Dati su annate, produttori, regioni
- ✅ API RESTful ben documentata

### Limitazioni

- 1000 richieste/giorno (livello gratuito)
- Solo vini (no spirits)
- Potrebbe non avere tutti i vini di nicchia

### Esempio di Utilizzo

```javascript
const response = await fetch(
  `https://api.globalwinescore.com/globalwinescores/latest/?wine=${query}`,
  {
    headers: {
      'Authorization': `Token ${process.env.GLOBAL_WINE_SCORE_API_KEY}`
    }
  }
);
```

## WineVybe (Commerciale)

### Registrazione

1. Contatta [WineVybe](https://winevybe.com/api-access)
2. Richiedi una quota commerciale
3. Completa il processo di onboarding
4. Riceverai le credenziali API

### Configurazione

```env
WINEVYBE_API_KEY=your_key_here
WINEVYBE_API_SECRET=your_secret_here
```

### Caratteristiche

- ✅ **200,000+** bottiglie (vini + spirits)
- ✅ Include whisky, rum, gin, vodka, tequila
- ✅ Dati su produttore, distilleria, regione
- ✅ Profili di degustazione dettagliati
- ✅ Abbinamenti gastronomici suggeriti
- ✅ Prezzi di mercato stimati

### Costi

- Piano Base: $99/mese
- Piano Pro: $299/mese
- Piano Enterprise: Custom

### Esempio di Utilizzo

```javascript
const response = await fetch(
  `https://api.winevybe.com/v1/search?q=${query}&category=whisky`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.WINEVYBE_API_KEY}`
    }
  }
);
```

## Vivino (Non Ufficiale)

### Configurazione

:::warning Attenzione
Vivino non ha un'API pubblica ufficiale. L'integrazione usa endpoint non documentati che potrebbero cambiare senza preavviso.
:::

Non richiede API key, ma è consigliato:
- Usare rate limiting aggressivo (1 req/sec)
- Implementare retry logic
- Usare proxy rotating in produzione

### Configurazione (Opzionale)

```env
VIVINO_RATE_LIMIT=1000  # ms tra richieste
VIVINO_PROXY_URL=http://your-proxy.com  # opzionale
```

### Caratteristiche

- ✅ Database **mondiale** di vini
- ✅ Ratings e recensioni utenti
- ✅ Prezzi di mercato aggiornati
- ✅ Immagini ad alta risoluzione
- ✅ Completamente **gratuito**

### Limitazioni

- ⚠️ Non ufficiale - può smettere di funzionare
- ⚠️ Rate limiting rigoroso (rischio ban IP)
- ⚠️ Solo vini (no spirits)
- ⚠️ Nessun supporto ufficiale

### Esempio di Utilizzo

```javascript
const response = await fetch(
  'https://www.vivino.com/api/explore/explore?' + new URLSearchParams({
    country_code: 'IT',
    currency_code: 'EUR',
    page: 1,
    wine_type_ids: ['1']  // 1=Rosso, 2=Bianco, 3=Spumante
  }),
  {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
);
```

## Wine-Searcher (Premium)

### Registrazione

1. Vai su [Wine-Searcher Trade](https://www.wine-searcher.com/trade/ws-api)
2. Compila il form per richiesta commerciale
3. Attendi approvazione (1-3 giorni)
4. Riceverai le credenziali

### Configurazione

```env
WINE_SEARCHER_API_KEY=your_key_here
```

### Caratteristiche

- ✅ Database **più completo** al mondo
- ✅ Vini + Spirits completi
- ✅ **Prezzi di mercato** in tempo reale
- ✅ Dati da migliaia di merchants
- ✅ API stabile e supportata
- ✅ Documentazione completa

### Costi

- **$350/mese** (minimo)
- Volume pricing disponibile

### Esempio di Utilizzo

```javascript
const response = await fetch(
  `https://api.wine-searcher.com/lwin/search?` + new URLSearchParams({
    api_key: process.env.WINE_SEARCHER_API_KEY,
    winename: query,
    currencycode: 'EUR'
  })
);
```

## TheCocktailDB (Spirits - Gratuita)

### Configurazione

API completamente **gratuita** senza registrazione!

```env
# Nessuna configurazione necessaria
```

### Caratteristiche

- ✅ Completamente **gratuita**
- ✅ Focus su spirits e liquori
- ✅ Ricette cocktail
- ✅ Informazioni base distillati

### Limitazioni

- Database limitato
- Dati base (no prezzi, no rating)
- No vini

### Esempio di Utilizzo

```javascript
const response = await fetch(
  `https://www.thecocktaildb.com/api/json/v1/1/search.php?i=${query}`
);
```

## Configurazione Consigliata

### Per Uso Personale

```env
# Usa Global Wine Score (gratuita)
GLOBAL_WINE_SCORE_API_KEY=your_key

# Usa TheCocktailDB per spirits (gratuita)
# Nessuna configurazione necessaria

# Usa Vivino come fallback (con cautela)
VIVINO_RATE_LIMIT=2000
```

### Per Uso Commerciale

```env
# WineVybe per database completo
WINEVYBE_API_KEY=your_key

# Wine-Searcher per prezzi di mercato
WINE_SEARCHER_API_KEY=your_key
```

## Best Practices

### 1. Caching

Implementa caching per ridurre chiamate API:

```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

const cache = new Map();

async function getCachedData(key, fetchFn) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // max 100 richieste per finestra
  message: 'Troppe richieste, riprova più tardi'
});

app.use('/api/search', apiLimiter);
```

### 3. Error Handling

```javascript
async function searchWithFallback(query) {
  try {
    // Prova prima API primaria
    return await searchWineVybe(query);
  } catch (error) {
    console.warn('WineVybe fallito, provo Global Wine Score');
    try {
      return await searchGlobalWineScore(query);
    } catch (error2) {
      console.warn('Global Wine Score fallito, provo Vivino');
      return await searchVivino(query);
    }
  }
}
```

### 4. Sicurezza

:::danger Importante
**MAI** committare il file `.env` nel repository Git!
:::

Aggiungi al `.gitignore`:

```
.env
.env.local
.env.production
```

## Testing delle API

Crea uno script di test:

```bash
# Crea file test-apis.js
node test-apis.js
```

```javascript
// test-apis.js
require('dotenv').config();

async function testAPIs() {
  const query = 'Barolo';

  console.log('Testing Global Wine Score...');
  // Testa Global Wine Score

  console.log('Testing WineVybe...');
  // Testa WineVybe

  console.log('Testing Vivino...');
  // Testa Vivino
}

testAPIs();
```

## Prossimi Passi

- [Prima Configurazione](./first-setup)
- [Guida all'Uso](./usage-guide)
- [API Reference](../api/overview)
