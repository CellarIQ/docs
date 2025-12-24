---
sidebar_position: 1
---

# Deploy in Produzione

Guida completa per il deploy di MyCellar in produzione su diverse piattaforme.

## Prerequisiti

Prima di procedere, assicurati di avere:

- [ ] Codice versionato su Git/GitHub
- [ ] File `.env` configurato (NON committarlo!)
- [ ] Database schema testato
- [ ] API keys pronte
- [ ] Domain name (opzionale ma consigliato)

## Opzione 1: Heroku (Consigliato per Iniziare)

Heroku è perfetto per iniziare: gratuito, semplice, scaling automatico.

### 1. Setup Heroku

```bash
# Installa Heroku CLI
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Scarica da https://devcenter.heroku.com/articles/heroku-cli

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

### 2. Crea App

```bash
cd mycellar

# Crea app Heroku
heroku create mycellar-app

# Aggiungi PostgreSQL
heroku addons:create heroku-postgresql:mini
```

### 3. Configura Variabili Ambiente

```bash
# Imposta variabili da .env
heroku config:set NODE_ENV=production
heroku config:set GLOBAL_WINE_SCORE_API_KEY=your_key
heroku config:set WINEVYBE_API_KEY=your_key
heroku config:set JWT_SECRET=your_secret_key

# Verifica
heroku config
```

### 4. Prepara per Deploy

Crea `Procfile` nella root:

```
web: node backend/server.js
```

Modifica `package.json` per lo start script:

```json
{
  "scripts": {
    "start": "node backend/server.js",
    "heroku-postbuild": "cd backend && npm install"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### 5. Deploy

```bash
# Commit modifiche
git add .
git commit -m "Prepare for Heroku deployment"

# Push su Heroku
git push heroku main

# Inizializza database
heroku run npm run init-db

# Apri app
heroku open
```

### 6. Monitor

```bash
# Logs
heroku logs --tail

# Status
heroku ps

# Database info
heroku pg:info
```

### Costi Heroku

- **Hobby (Gratuito)**: 550 ore/mese, dorme dopo 30 min inattività
- **Basic ($7/mese)**: Sempre attivo
- **Standard ($25/mese)**: Performance migliori
- **PostgreSQL**: Mini gratis (10k righe), Basic $9/mese (10M righe)

---

## Opzione 2: Vercel (Frontend) + Railway (Backend)

Separazione frontend/backend per migliori performance.

### Frontend su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Segui wizard:
# - Set up and deploy? Yes
# - Scope: Personal Account
# - Link to existing project? No
# - Project name: mycellar-frontend
# - Directory: ./
# - Override settings? No

# Deploy in produzione
vercel --prod
```

**Configurazione Vercel:**

Crea `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "*.html",
      "use": "@vercel/static"
    }
  ],
  "env": {
    "API_BASE_URL": "https://your-backend-url.railway.app/api"
  }
}
```

### Backend su Railway

1. Vai su [Railway.app](https://railway.app/)
2. Login con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Seleziona il tuo repository
5. Configura:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
6. **Variables** → Aggiungi variabili da `.env`
7. **Deploy**

Railway fornisce automaticamente:
- PostgreSQL database
- HTTPS
- Domain custom
- Auto-deploy da Git

**Costi Railway:**
- **Developer Plan**: $5/mese
- **Team Plan**: $20/mese

---

## Opzione 3: VPS (DigitalOcean, AWS, Linode)

Massimo controllo ma più complesso.

### Setup Ubuntu 22.04 VPS

```bash
# SSH nel server
ssh root@your-server-ip

# Update sistema
apt update && apt upgrade -y

# Installa Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Installa PM2 (process manager)
npm install -g pm2

# Installa Nginx
apt install -y nginx

# Installa PostgreSQL
apt install -y postgresql postgresql-contrib

# Installa Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

### Deploy Applicazione

```bash
# Crea utente deploy
adduser deploy
usermod -aG sudo deploy
su - deploy

# Clona repository
git clone https://github.com/yourusername/mycellar.git
cd mycellar/backend

# Installa dipendenze
npm install --production

# Copia .env
nano .env  # Incolla le tue variabili

# Inizializza database
npm run init-db

# Avvia con PM2
pm2 start server.js --name mycellar

# Salva processo PM2
pm2 save

# Auto-start PM2 al boot
pm2 startup systemd
# Esegui il comando che PM2 ti suggerisce
```

### Configura Nginx

```bash
sudo nano /etc/nginx/sites-available/mycellar
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Abilita sito
sudo ln -s /etc/nginx/sites-available/mycellar /etc/nginx/sites-enabled/

# Test configurazione
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Abilita HTTPS con Let's Encrypt
sudo certbot --nginx -d your-domain.com

# Auto-rinnovo certificato
sudo systemctl enable certbot.timer
```

### Setup PostgreSQL

```bash
sudo -u postgres psql

# Crea database e utente
CREATE DATABASE mycellar;
CREATE USER mycellar_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mycellar TO mycellar_user;
\q

# Aggiorna .env con connessione PostgreSQL
DATABASE_URL=postgresql://mycellar_user:your_password@localhost:5432/mycellar
```

### Monitoring

```bash
# PM2 logs
pm2 logs mycellar

# PM2 monit
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## Opzione 4: Docker

Containerizza l'applicazione per deploy ovunque.

### Dockerfile

Crea `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice
COPY . .

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mycellar
      - GLOBAL_WINE_SCORE_API_KEY=${GLOBAL_WINE_SCORE_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mycellar
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy con Docker

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Checklist Pre-Deploy

### Sicurezza

- [ ] `.env` in `.gitignore`
- [ ] Secrets in variabili ambiente
- [ ] HTTPS/SSL abilitato
- [ ] Rate limiting configurato
- [ ] Helmet middleware attivo
- [ ] CORS configurato correttamente
- [ ] Input validation attiva
- [ ] SQL injection protection (prepared statements)

### Performance

- [ ] Gzip/Compression abilitata
- [ ] Database indexed
- [ ] Caching implementato
- [ ] CDN per static assets (opzionale)
- [ ] Lazy loading immagini
- [ ] Pagination implementata

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Logging configurato
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring (New Relic)
- [ ] Backup automatici database

### Database

- [ ] Migration eseguita
- [ ] Backup schedulato
- [ ] Connection pooling
- [ ] Indexes ottimizzati

---

## Ambiente di Staging

Prima del deploy in produzione, testa in staging:

```bash
# Heroku staging
heroku create mycellar-staging
heroku config:set NODE_ENV=staging

# Deploy
git push heroku staging:main
```

---

## CI/CD con GitHub Actions

Automatizza deploy ad ogni push.

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test

      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "mycellar-app"
          heroku_email: "your-email@example.com"
```

---

## Monitoring e Alerting

### Sentry (Error Tracking)

```bash
npm install @sentry/node
```

```javascript
// server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

### UptimeRobot (Uptime Monitoring)

1. Vai su [UptimeRobot.com](https://uptimerobot.com/)
2. Aggiungi monitor per `https://your-domain.com/health`
3. Configura alerts via email/SMS

---

## Backup Automatici

### Script Backup PostgreSQL

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
DB_NAME="mycellar"

# Backup
pg_dump $DB_NAME > $BACKUP_DIR/mycellar_$DATE.sql

# Comprimi
gzip $BACKUP_DIR/mycellar_$DATE.sql

# Elimina backup più vecchi di 30 giorni
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload su S3 (opzionale)
# aws s3 cp $BACKUP_DIR/mycellar_$DATE.sql.gz s3://mybucket/backups/
```

### Cron Job

```bash
crontab -e

# Backup giornaliero alle 3 AM
0 3 * * * /home/deploy/backup.sh
```

---

## Costi Stimati

### Setup Base (Hobby)
- **Heroku Hobby**: Gratis
- **PostgreSQL Mini**: Gratis
- **Domain**: $10-15/anno
- **TOTALE**: ~$1/mese

### Setup Professionale
- **Heroku Standard**: $25/mese
- **PostgreSQL Basic**: $9/mese
- **Domain**: $15/anno
- **Sentry**: $26/mese
- **CDN (CloudFlare)**: Gratis
- **TOTALE**: ~$61/mese

### Setup Enterprise (VPS)
- **DigitalOcean Droplet**: $12/mese
- **Managed PostgreSQL**: $15/mese
- **Domain**: $15/anno
- **Monitoring**: $10/mese
- **TOTALE**: ~$38/mese

---

## Prossimi Passi

- [Security Best Practices](./security)
- [Scaling Guide](./scaling)
- [Troubleshooting](./troubleshooting)
