# 🍷 MyCellar - Wine & Spirits Cellar Management

Un'applicazione web completa per la gestione personale di una cantina di vini e spirits (whisky, scotch, rum, gin, etc.) con tracking del valore, rendimento dell'investimento e suggerimenti di abbinamento gastronomico.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

---

## ✨ Caratteristiche Principali

### 🏆 Gestione Completa
- ✅ Lista preferiti per bottiglie da acquistare
- ✅ Cantina personalizzabile con posizioni fisiche
- ✅ Gestione quantità multiple dello stesso prodotto
- ✅ Tracking del valore e ROI dell'investimento
- ✅ Statistiche e analytics avanzate

### 🍇 Multi-Categoria
- **Vini**: Rossi, Bianchi, Rosé, Spumanti
- **Whisky**: Scotch, Irish, Bourbon, Japanese
- **Spirits**: Rum, Gin, Vodka, Tequila, Cognac

### 🔌 Integrazioni API
- **Vivino** (non ufficiale) - Database vini mondiale
- **Global Wine Score** (gratuita) - 26,000+ vini con punteggi
- **WineVybe** (commerciale) - 200,000+ vini e spirits

### 🍽️ Abbinamenti Gastronomici
- Suggerimenti per aperitivi, pranzi e cene
- Temperature di servizio consigliate
- Occasioni d'uso

### 📊 Analytics
- Valore totale della cantina
- ROI per singola bottiglia e totale
- Distribuzione per categoria e regione
- Top performers
- Storico consumi

---

## 📁 Struttura del Progetto

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
└── README.md                     # Questo file
```

---

## 🚀 Quick Start

### 1. Setup Frontend (Prototipo)

Il frontend è un file HTML standalone che può essere aperto direttamente nel browser:

```bash
# Apri il file nel browser
open wine-cellar-app.html
# oppure
firefox wine-cellar-app.html
```

**Nota**: Il prototipo usa LocalStorage per la persistenza dei dati. Per una soluzione completa, segui il setup del backend.

---

### 2. Setup Backend

#### Prerequisiti

- Node.js >= 16.0.0
- npm >= 8.0.0
- SQLite3 (già incluso in Node.js)

#### Installazione

```bash
# 1. Naviga nella cartella backend
cd backend

# 2. Installa le dipendenze
npm install

# 3. Copia e configura le variabili d'ambiente
cp .env.example .env
nano .env  # Modifica con i tuoi valori

# 4. Inizializza il database
npm run init-db
# oppure manualmente:
sqlite3 mycellar.db < database-schema.sql

# 5. Avvia il server
npm start
# oppure in modalità development con auto-reload:
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

---

## 🔧 Configurazione API Keys

### Global Wine Score (Gratuita)

1. Vai su [GlobalWineScore.com](https://www.globalwinescore.com/api/)
2. Registra un account
3. Richiedi una API key
4. Aggiungi al file `.env`:
   ```
   GLOBAL_WINE_SCORE_API_KEY=your_key_here
   ```

### WineVybe (Commerciale)

1. Contatta [WineVybe](https://winevybe.com/)
2. Richiedi accesso all'API
3. Aggiungi al file `.env`:
   ```
   WINEVYBE_API_KEY=your_key_here
   ```

### Vivino (Non Ufficiale)

Non richiede API key, ma potrebbe essere soggetto a rate limiting. L'implementazione usa web scraping dell'API non documentata.

---

## 📖 Utilizzo

### Frontend Standalone

1. Apri `wine-cellar-app.html` nel browser
2. Usa la tab "Cerca Bottiglie" per simulare ricerche
3. Aggiungi bottiglie alla cantina con prezzo e quantità
4. Visualizza statistiche e rendimenti nella dashboard
5. Gestisci i preferiti
6. Consulta gli abbinamenti gastronomici

**Limitazioni**: I dati sono salvati solo nel browser (LocalStorage)

---

### Backend + Frontend Integrato

#### Avvia il backend

```bash
cd backend
npm run dev
```

#### Modifica il frontend per usare il backend

Nel file `wine-cellar-app.html`, sostituisci le funzioni mock con chiamate reali:

```javascript
// Invece di:
const searchVivinoAPI = async (query) => {
    // mock data
};

// Usa:
const searchVivinoAPI = async (query) => {
    const response = await fetch(`http://localhost:3000/api/search?q=${query}&category=wine`);
    return await response.json();
};
```

---

## 🔌 API Endpoints

### Bottles

```http
GET    /api/bottles              # Lista tutte le bottiglie
GET    /api/bottles/:id          # Dettaglio bottiglia
POST   /api/bottles              # Crea nuova bottiglia
PUT    /api/bottles/:id          # Aggiorna bottiglia
DELETE /api/bottles/:id          # Elimina bottiglia
```

### Cellar

```http
GET    /api/cellar               # Lista bottiglie in cantina
GET    /api/cellar/stats         # Statistiche (valore, ROI, etc.)
POST   /api/cellar               # Aggiungi alla cantina
PUT    /api/cellar/:id           # Aggiorna in cantina
DELETE /api/cellar/:id           # Rimuovi da cantina
```

### Favorites

```http
GET    /api/favorites            # Lista preferiti
POST   /api/favorites            # Aggiungi ai preferiti
DELETE /api/favorites/:bottleId  # Rimuovi dai preferiti
```

### Search

```http
GET    /api/search               # Cerca da API esterne
       ?q=query                  # Query di ricerca
       &category=wine            # wine|whisky|rum|gin|scotch
       &source=vivino            # vivino|globalwinescore|winevybe

POST   /api/search/import        # Importa bottiglia da API
```

### Pairings

```http
GET    /api/pairings/:bottleId  # Abbinamenti per bottiglia
POST   /api/pairings            # Aggiungi abbinamento
```

### Consumption

```http
GET    /api/consumption         # Storico consumi
POST   /api/consumption         # Registra consumo
```

---

## 💡 Esempi di Utilizzo

### Cercare un vino

```bash
curl "http://localhost:3000/api/search?q=barolo&category=wine"
```

### Aggiungere alla cantina

```bash
curl -X POST http://localhost:3000/api/cellar \
  -H "Content-Type: application/json" \
  -d '{
    "bottle_id": 1,
    "purchase_price": 45.00,
    "quantity": 3,
    "location": "Scaffale A1",
    "purchase_date": "2024-01-15"
  }'
```

### Ottenere statistiche

```bash
curl http://localhost:3000/api/cellar/stats
```

---

## 🗄️ Database Schema

### Tabelle Principali

- **bottles** - Catalogo completo delle bottiglie
- **cellar_bottles** - Bottiglie in cantina con prezzi e quantità
- **favorites** - Lista preferiti
- **pairings** - Abbinamenti gastronomici
- **consumption_history** - Storico consumi

### Views Pre-calcolate

- **cellar_stats** - Statistiche aggregate
- **cellar_details** - Join completo cantina + bottiglie
- **category_distribution** - Distribuzione per categoria
- **top_performers** - Migliori rendimenti

Consulta `database-schema.sql` per i dettagli completi.

---

## 📊 Calcolo del Rendimento

Il sistema calcola automaticamente:

1. **Valore Totale**: Somma del valore attuale di tutte le bottiglie
2. **Investimento Totale**: Somma dei prezzi di acquisto
3. **Rendimento Assoluto**: Valore Attuale - Investimento
4. **ROI %**: (Rendimento / Investimento) × 100

```javascript
// Esempio di calcolo per una bottiglia
const purchasePrice = 45.00;
const currentPrice = 52.00;
const quantity = 3;

const totalInvestment = purchasePrice * quantity;  // 135.00
const totalValue = currentPrice * quantity;        // 156.00
const return = totalValue - totalInvestment;       // +21.00
const roi = (return / totalInvestment) * 100;      // +15.56%
```

---

## 🍽️ Sistema Abbinamenti

Gli abbinamenti sono categorizzati per:

- **Tipo di piatto**: Aperitivo, Primo, Secondo, Dessert
- **Occasione**: Cena formale, Aperitivo, Degustazione
- **Stagione**: Primavera, Estate, Autunno, Inverno
- **Temperatura**: Range consigliato per il servizio

Esempio:

```json
{
  "bottle_id": 1,
  "pairing_type": "food",
  "pairing_value": "Brasato al Barolo",
  "meal_type": "main_course",
  "season": "autumn"
}
```

---

## 🔐 Sicurezza

### Raccomandazioni

1. **Non committare `.env`**: Aggiungi al `.gitignore`
2. **Usa HTTPS in produzione**: Configura SSL/TLS
3. **Rate Limiting**: Implementato per API esterne
4. **Validazione Input**: Tutti gli input sono validati
5. **SQL Injection Protection**: Prepared statements
6. **CORS**: Configurato per origini autorizzate

### Esempio .gitignore

```
.env
node_modules/
*.log
mycellar.db
.DS_Store
```

---

## 🚀 Deploy in Produzione

### Opzione 1: Heroku

```bash
# 1. Installa Heroku CLI
# 2. Login
heroku login

# 3. Crea app
heroku create mycellar-app

# 4. Aggiungi buildpack per Node.js
heroku buildpacks:set heroku/nodejs

# 5. Configura variabili ambiente
heroku config:set NODE_ENV=production
heroku config:set GLOBAL_WINE_SCORE_API_KEY=your_key

# 6. Deploy
git push heroku main
```

### Opzione 2: Vercel (Solo Frontend)

```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Deploy
vercel
```

### Opzione 3: VPS (DigitalOcean, AWS, etc.)

```bash
# 1. SSH nel server
ssh user@your-server-ip

# 2. Installa Node.js e PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 3. Clona repository
git clone your-repo-url
cd mycellar

# 4. Setup
npm install
cp .env.example .env
nano .env  # Configura

# 5. Inizializza database
npm run init-db

# 6. Avvia con PM2
pm2 start server.js --name mycellar
pm2 save
pm2 startup
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📝 TODO / Roadmap

### Fase 2
- [ ] Autenticazione multi-utente (JWT)
- [ ] Upload immagini custom
- [ ] Export/Import CSV/Excel
- [ ] Grafici avanzati con Chart.js

### Fase 3
- [ ] App mobile (React Native)
- [ ] Scansione etichette con fotocamera
- [ ] Integrazione sensori IoT (temperatura/umidità)
- [ ] Notifiche email/push

### Fase 4
- [ ] AI per suggerimenti personalizzati
- [ ] Machine Learning per predizione valore
- [ ] OCR per riconoscimento etichette
- [ ] Social features (condivisione collezione)

---

## 🐛 Troubleshooting

### Errore: Cannot find module 'sqlite3'

```bash
npm install sqlite3 --build-from-source
```

### Errore: Port 3000 already in use

Cambia la porta nel file `.env`:
```
PORT=3001
```

### API non restituisce risultati

Verifica che le API keys siano configurate correttamente nel file `.env`

### Database locked

```bash
# Chiudi tutte le connessioni e ricrea il database
rm mycellar.db
npm run init-db
```

---

## 🤝 Contributi

I contributi sono benvenuti! Per favore:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

---

## 📧 Contatti

**Autore**: Your Name  
**Email**: your.email@example.com  
**GitHub**: [@yourusername](https://github.com/yourusername)

---

## 🙏 Ringraziamenti

- [Vivino](https://www.vivino.com/) per il database vini
- [Global Wine Score](https://www.globalwinescore.com/) per l'API gratuita
- [WineVybe](https://winevybe.com/) per i dati spirits
- Community open source

---

## ⭐ Star History

Se ti è piaciuto questo progetto, lascia una stella su GitHub! ⭐

---

**Versione**: 1.0.0  
**Ultimo Aggiornamento**: Dicembre 2024

Made with ❤️ and 🍷
