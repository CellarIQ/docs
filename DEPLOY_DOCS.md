# Deploy Documentazione Docusaurus

Questa guida spiega come rendere la documentazione visibile online senza dover eseguire `npm start`.

## Opzione 1: GitHub Pages (GRATUITA e CONSIGLIATA)

### Setup Iniziale

1. **Modifica `docusaurus.config.ts`** per GitHub Pages:

```typescript
// In docs/website/docusaurus.config.ts

const config: Config = {
  // ... altre config
  url: 'https://TUOUSERNAME.github.io',
  baseUrl: '/CellarIQ/',  // Nome del tuo repository
  organizationName: 'TUOUSERNAME',  // Il tuo username GitHub
  projectName: 'CellarIQ',  // Nome repository

  deploymentBranch: 'gh-pages',
  trailingSlash: false,
};
```

### Deploy con un Comando

```bash
cd /Users/andreiadam/Documents/web\ project/CellarIQ/docs/website

# Build e deploy in un solo comando
GIT_USER=TUOUSERNAME npm run deploy
```

Questo comando:
1. Fa il build della documentazione
2. Crea un branch `gh-pages`
3. Pusha i file compilati su GitHub
4. La documentazione sarà visibile su: `https://TUOUSERNAME.github.io/CellarIQ/`

### Abilitare GitHub Pages

1. Vai su GitHub → Repository → **Settings**
2. Vai su **Pages** nel menu laterale
3. In **Source** seleziona:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Clicca **Save**

La documentazione sarà online in pochi minuti!

## Opzione 2: Vercel (GRATUITO e VELOCISSIMO)

### Deploy con Vercel CLI

```bash
# Installa Vercel CLI (una volta sola)
npm i -g vercel

# Naviga nella cartella website
cd /Users/andreiadam/Documents/web\ project/CellarIQ/docs/website

# Deploy (prima volta)
vercel

# Segui il wizard:
# - Set up and deploy? Yes
# - Scope: Personal Account
# - Link to existing project? No
# - Project name: mycellar-docs
# - Directory: ./
# - Override settings? No

# Deploy in produzione
vercel --prod
```

La tua documentazione sarà su: `https://mycellar-docs.vercel.app`

### Deploy Automatico con GitHub

1. Vai su [vercel.com](https://vercel.com)
2. Clicca **Add New Project**
3. Importa il repository GitHub
4. Configura:
   - **Root Directory**: `docs/website`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Clicca **Deploy**

Da ora in poi, **ogni push su GitHub farà deploy automatico**!

## Opzione 3: Netlify (GRATUITO)

### Deploy con Netlify

1. Vai su [netlify.com](https://netlify.com)
2. Clicca **Add new site** → **Import from Git**
3. Connetti GitHub e seleziona il repository
4. Configura:
   - **Base directory**: `docs/website`
   - **Build command**: `npm run build`
   - **Publish directory**: `docs/website/build`
5. Clicca **Deploy site**

La tua documentazione sarà su: `https://random-name.netlify.app`

Puoi cambiare il nome in **Site settings** → **Domain management**.

## Riepilogo Comandi

### Per GitHub Pages

```bash
cd docs/website

# Prima volta: configura docusaurus.config.ts
# Poi:
GIT_USER=tuousername npm run deploy
```

### Per Vercel

```bash
cd docs/website

# Prima volta
vercel

# Deploy produzione
vercel --prod
```

### Per Build Locale

```bash
cd docs/website

# Build
npm run build

# Test build locale
npm run serve
```

## URL Finali

Dopo il deploy, la tua documentazione sarà disponibile su:

- **GitHub Pages**: `https://tuousername.github.io/CellarIQ/`
- **Vercel**: `https://mycellar-docs.vercel.app`
- **Netlify**: `https://mycellar-docs.netlify.app`

## Dominio Custom (Opzionale)

Se hai un dominio (es. `mycellar.com`), puoi configurarlo:

### GitHub Pages
Aggiungi file `docs/website/static/CNAME`:
```
docs.mycellar.com
```

### Vercel/Netlify
Vai in Settings → Domains e aggiungi il tuo dominio.

## Aggiornamenti Automatici

Con Vercel o Netlify connessi a GitHub:
1. Modifichi la documentazione localmente
2. Fai commit e push su GitHub
3. Deploy automatico! ✨

La documentazione si aggiorna automaticamente senza fare nulla!

## Consiglio Finale

**CONSIGLIO**: Usa **Vercel** perché:
- ✅ Deploy automatico ad ogni push
- ✅ Velocissimo (CDN globale)
- ✅ HTTPS automatico
- ✅ Anteprime per ogni branch
- ✅ Zero configurazione
- ✅ Gratis per sempre

## Script Rapidi

Aggiungi questi script a `docs/website/package.json`:

```json
{
  "scripts": {
    "deploy:gh": "GIT_USER=$npm_config_user npm run deploy",
    "deploy:vercel": "vercel --prod"
  }
}
```

Poi puoi fare:
```bash
npm run deploy:gh --user=tuousername
# oppure
npm run deploy:vercel
```
