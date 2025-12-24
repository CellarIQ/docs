---
sidebar_position: 1
---

# Analytics e Statistiche

MyCellar fornisce un sistema completo di analytics per monitorare il valore della tua cantina e il rendimento del tuo investimento.

## Dashboard Overview

La dashboard principale mostra:

- **Valore Totale Cantina**: Valore attuale di mercato
- **Investimento Totale**: Quanto hai speso
- **Rendimento**: Guadagno/perdita assoluto
- **ROI %**: Percentuale di ritorno sull'investimento
- **Numero Bottiglie**: Totale bottiglie in cantina
- **Bottiglie Uniche**: Varietà differenti

## Metriche Calcolate

### 1. Valore Totale

```javascript
const totalValue = cellarBottles.reduce((sum, bottle) => {
  return sum + (bottle.current_price * bottle.quantity);
}, 0);
```

**Esempio:**
- Barolo: €50 × 3 = €150
- Lagavulin: €70 × 2 = €140
- **Totale**: €290

### 2. ROI (Return on Investment)

```javascript
const totalInvestment = cellarBottles.reduce((sum, bottle) => {
  return sum + (bottle.purchase_price * bottle.quantity);
}, 0);

const totalReturn = totalValue - totalInvestment;
const roiPercentage = (totalReturn / totalInvestment) * 100;
```

**Esempio:**
- Investimento: €200
- Valore Attuale: €290
- Rendimento: €90
- **ROI**: 45%

### 3. ROI per Bottiglia

```javascript
const bottleROI = ((currentPrice - purchasePrice) / purchasePrice) * 100;
```

**Esempio:**
- Acquisto: €40
- Valore Attuale: €52
- **ROI**: 30%

## Distribuzione per Categoria

### Query SQL

```sql
SELECT
    category,
    COUNT(*) as count,
    SUM(quantity) as total_bottles,
    SUM(purchase_price * quantity) as investment,
    SUM(current_price * quantity) as value,
    ROUND(AVG(((current_price - purchase_price) / purchase_price) * 100), 2) as avg_roi
FROM cellar_details
GROUP BY category
ORDER BY value DESC;
```

### Visualizzazione

Grafico a torta che mostra:
- Percentuale di valore per categoria
- Numero di bottiglie per tipo
- ROI medio per categoria

**Esempio Output:**
```json
{
  "wine": {
    "count": 30,
    "value": €2100,
    "percentage": 65%,
    "avgROI": 28%
  },
  "whisky": {
    "count": 12,
    "value": €980,
    "percentage": 30%,
    "avgROI": 15%
  },
  "rum": {
    "count": 5,
    "value": €170,
    "percentage": 5%,
    "avgROI": 8%
  }
}
```

## Top Performers

Bottiglie con i migliori rendimenti.

### Query

```sql
SELECT
    name,
    producer,
    purchase_price,
    current_price,
    ((current_price - purchase_price) / purchase_price * 100) as roi_percentage,
    (current_price - purchase_price) * quantity as total_gain
FROM cellar_details
WHERE current_price > purchase_price
ORDER BY roi_percentage DESC
LIMIT 10;
```

### Output Esempio

| Nome | Produttore | Acquisto | Attuale | ROI | Guadagno |
|------|-----------|----------|---------|-----|----------|
| Barolo Riserva | Gaja | €45 | €85 | 88.9% | €120 |
| Brunello DOCG | Biondi-Santi | €60 | €105 | 75% | €90 |
| Lagavulin 16 | Lagavulin | €55 | €72 | 30.9% | €34 |

## Distribuzione Geografica

### Per Paese

```sql
SELECT
    country,
    COUNT(*) as bottles,
    SUM(current_price * quantity) as total_value
FROM cellar_details
GROUP BY country
ORDER BY total_value DESC;
```

**Visualizzazione:** Mappa o bar chart

### Per Regione

Mostra le regioni più rappresentate:
- Toscana (Italia)
- Bordeaux (Francia)
- Islay (Scozia)
- Speyside (Scozia)

## Trend nel Tempo

### Valore Cantina nel Tempo

Traccia l'evoluzione del valore:

```javascript
const monthlyValue = consumptionHistory
  .groupBy('month')
  .map(month => ({
    date: month.date,
    totalValue: calculateValue(month),
    investment: calculateInvestment(month)
  }));
```

**Grafico:** Linea temporale con 2 linee:
- Investimento cumulativo
- Valore corrente

## Tasso di Consumo

### Calcolo

```sql
SELECT
    DATE_TRUNC('month', consumed_date) as month,
    SUM(quantity) as bottles_consumed,
    AVG(rating) as avg_rating
FROM consumption_history
GROUP BY month
ORDER BY month DESC;
```

### Metriche

- **Bottiglie/Mese**: Media consumi mensili
- **Tempo Rimanente**: Stima mesi rimanenti al tasso attuale
- **Preferenze**: Categorie più consumate

**Esempio:**
```json
{
  "avgBottlesPerMonth": 3.5,
  "totalBottles": 127,
  "estimatedMonths": 36,
  "mostConsumed": "wine"
}
```

## Valutazione per Annata

Per vini: performance per annata.

```sql
SELECT
    vintage,
    COUNT(*) as bottles,
    AVG(rating) as avg_rating,
    AVG(((current_price - purchase_price) / purchase_price) * 100) as avg_roi
FROM cellar_details
WHERE category = 'wine' AND vintage IS NOT NULL
GROUP BY vintage
ORDER BY vintage DESC;
```

**Insight:**
- Quali annate stanno performando meglio
- Annate da acquistare
- Tendenze storiche

## Export Dati

### CSV Export

```javascript
function exportToCSV() {
  const headers = ['Nome', 'Produttore', 'Categoria', 'Acquisto', 'Attuale', 'ROI', 'Quantità'];
  const rows = cellarBottles.map(b => [
    b.name,
    b.producer,
    b.category,
    b.purchase_price,
    b.current_price,
    b.roi_percentage,
    b.quantity
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  downloadFile(csv, 'mycellar-export.csv');
}
```

### Excel Export

Usa libreria `xlsx`:

```javascript
import * as XLSX from 'xlsx';

function exportToExcel() {
  const ws = XLSX.utils.json_to_sheet(cellarBottles);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cantina');
  XLSX.writeFile(wb, 'mycellar-export.xlsx');
}
```

### PDF Report

Genera report PDF con grafici:

```javascript
import jsPDF from 'jspdf';

function generatePDFReport() {
  const doc = new jsPDF();

  doc.text('MyCellar - Report', 20, 20);
  doc.text(`Valore Totale: €${totalValue}`, 20, 40);
  doc.text(`ROI: ${roiPercentage}%`, 20, 50);

  // Aggiungi grafici (usando chart.js)
  // Aggiungi tabelle

  doc.save('mycellar-report.pdf');
}
```

## Grafici e Visualizzazioni

### Librerie Consigliate

1. **Chart.js** - Grafici semplici e reattivi
2. **Recharts** - Grafici React nativi
3. **D3.js** - Visualizzazioni personalizzate avanzate
4. **Victory** - Grafici modulari per React

### Esempio Chart.js

```javascript
import { Line } from 'react-chartjs-2';

function ValueOverTimeChart({ data }) {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Valore Cantina',
        data: data.map(d => d.value),
        borderColor: 'rgb(139, 0, 0)',
        backgroundColor: 'rgba(139, 0, 0, 0.1)',
      },
      {
        label: 'Investimento',
        data: data.map(d => d.investment),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      }
    ]
  };

  return <Line data={chartData} />;
}
```

## Alerts e Notifiche

### Setup Alerts

Configura notifiche per:

1. **ROI Milestone**: Quando una bottiglia raggiunge +X% ROI
2. **Valore Cantina**: Quando supera una soglia
3. **Consumo Alto**: Avviso se consumi troppo velocemente
4. **Vino Pronto**: Quando un vino raggiunge l'annata ottimale

**Esempio:**

```javascript
const alerts = [
  {
    type: 'roi_milestone',
    threshold: 50, // %
    message: 'Barolo 2015 ha raggiunto +50% ROI!'
  },
  {
    type: 'cellar_value',
    threshold: 5000, // €
    message: 'La tua cantina ha superato €5000!'
  }
];
```

## API Endpoint

### GET /api/cellar/stats

Restituisce tutte le statistiche aggregate.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBottles": 127,
    "uniqueBottles": 45,
    "totalValue": 4120.00,
    "totalInvestment": 3450.00,
    "totalReturn": 670.00,
    "roiPercentage": 19.42,
    "categoryDistribution": {
      "wine": { "count": 30, "value": 2650 },
      "whisky": { "count": 12, "value": 1150 }
    },
    "topPerformers": [...]
  }
}
```

## Best Practices

1. **Aggiorna Prezzi Regolarmente**: Mantieni i prezzi aggiornati per ROI accurato
2. **Traccia Consumi**: Registra ogni bottiglia consumata
3. **Review Periodiche**: Controlla mensilmente le performance
4. **Backup Dati**: Export regolare dei dati
5. **Set Goals**: Definisci obiettivi di ROI e valore

## Prossimi Passi

- [Database Schema](../architecture/database-schema)
- [API Reference](../api/cellar)
- [Deploy](../deployment/production)
