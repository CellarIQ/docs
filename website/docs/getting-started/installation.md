---
sidebar_position: 1
---

# Installazione

Questa guida ti aiuterà a configurare MyCellar sul tuo sistema locale.

## Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **SQLite3** (già incluso in Node.js)
- Un browser moderno (Chrome, Firefox, Safari, Edge)

### Verifica Prerequisiti

```bash
# Verifica versione Node.js
node --version
# Output atteso: v16.0.0 o superiore

# Verifica versione npm
npm --version
# Output atteso: 8.0.0 o superiore
```

## Struttura del Progetto

```
mycellar/
├── frontend/
│   └── wine-cellar-app.html      # Applicazione React frontend
├── backend/
│   ├── server.js                 # Server Express.js
│   ├── package.json              # Dipendenze Node.js
│   ├── .env.example              # Template variabili ambiente
│   └── database-schema.sql       # Schema database SQLite
├── docs/
│   └── DOCUMENTAZIONE.md         # Documentazione tecnica completa
└── README.md
```

## Setup Frontend (Prototipo)

Il frontend è un file HTML standalone che può essere aperto direttamente nel browser:

```bash
# Apri il file nel browser
open wine-cellar-app.html
# oppure
firefox wine-cellar-app.html
```

:::info
Il prototipo usa LocalStorage per la persistenza dei dati. Per una soluzione completa, segui il setup del backend.
:::

## Setup Backend

### 1. Clona il Repository

```bash
git clone https://github.com/yourusername/mycellar.git
cd mycellar
```

### 2. Naviga nella Cartella Backend

```bash
cd backend
```

### 3. Installa le Dipendenze

```bash
npm install
```

Questo installerà tutte le dipendenze necessarie:
- Express.js (server web)
- SQLite3 (database)
- Axios (HTTP client)
- CORS (Cross-Origin Resource Sharing)
- Helmet (security)
- E altre...

### 4. Configura le Variabili d'Ambiente

```bash
# Copia il file di esempio
cp .env.example .env

# Modifica con i tuoi valori
nano .env  # o usa il tuo editor preferito
```

Esempio di file `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./mycellar.db

# API Keys
GLOBAL_WINE_SCORE_API_KEY=your_key_here
WINEVYBE_API_KEY=your_key_here

# JWT Secret (se usi autenticazione)
JWT_SECRET=your_secret_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Inizializza il Database

```bash
npm run init-db
```

Oppure manualmente:

```bash
sqlite3 mycellar.db < database-schema.sql
```

### 6. Avvia il Server

```bash
# Modalità produzione
npm start

# Modalità development con auto-reload
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

## Verifica Installazione

### Test Backend

Apri il browser e vai a:
```
http://localhost:3000/api/bottles
```

Dovresti vedere una risposta JSON (array vuoto se non hai ancora bottiglie).

### Test Frontend

Se stai usando il frontend integrato con il backend, modifica il file HTML per puntare al server locale:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Prossimi Passi

- [Configurazione API Keys](./api-configuration)
- [Prima Configurazione](./first-setup)
- [Architettura del Sistema](../architecture/overview)

## Troubleshooting

### Errore: Cannot find module 'sqlite3'

```bash
npm install sqlite3 --build-from-source
```

### Errore: Port 3000 already in use

Cambia la porta nel file `.env`:
```env
PORT=3001
```

### Database locked

```bash
# Chiudi tutte le connessioni e ricrea il database
rm mycellar.db
npm run init-db
```

### Permessi negati su macOS/Linux

```bash
chmod +x *.sh  # Se usi script shell
sudo npm install  # Solo se assolutamente necessario
```
