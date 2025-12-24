---
sidebar_position: 2
---

# Database Schema

MyCellar utilizza SQLite per lo sviluppo e PostgreSQL per la produzione. Lo schema è progettato per massimizzare prestazioni e integrità dei dati.

## ERD (Entity Relationship Diagram)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  bottles    │◄────────│  cellar_bottles  │────────►│  favorites  │
│             │         │                  │         │             │
│ id (PK)     │         │ id (PK)          │         │ id (PK)     │
│ name        │         │ bottle_id (FK)   │         │ bottle_id   │
│ producer    │         │ purchase_price   │         │ added_at    │
│ category    │         │ current_price    │         └─────────────┘
│ vintage     │         │ quantity         │
│ country     │         │ location         │
│ region      │         │ purchase_date    │
│ rating      │         │ notes            │
│ ...         │         └──────────────────┘
└─────────────┘                  │
       │                         │
       │                         ▼
       │              ┌──────────────────────┐
       │              │ consumption_history  │
       │              │                      │
       │              │ id (PK)              │
       │              │ cellar_bottle_id (FK)│
       │              │ consumed_date        │
       │              │ quantity             │
       │              │ occasion             │
       │              │ rating               │
       │              │ notes                │
       │              └──────────────────────┘
       │
       ▼
┌─────────────┐
│  pairings   │
│             │
│ id (PK)     │
│ bottle_id   │
│ type        │
│ value       │
│ meal_type   │
│ season      │
└─────────────┘
```

## Tabelle

### bottles

Catalogo completo delle bottiglie nel database personale.

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (category IN ('wine', 'whisky', 'rum', 'gin', 'scotch', 'vodka', 'tequila', 'cognac')),
    CHECK (rating >= 0 AND rating <= 5),
    CHECK (vintage >= 1900 AND vintage <= 2100),
    CHECK (age >= 0 AND age <= 100),
    CHECK (abv >= 0 AND abv <= 100)
);

CREATE INDEX idx_bottles_category ON bottles(category);
CREATE INDEX idx_bottles_country ON bottles(country);
CREATE INDEX idx_bottles_rating ON bottles(rating DESC);
CREATE INDEX idx_bottles_external ON bottles(external_source, external_id);
```

**Campi:**
- `id`: Chiave primaria auto-incrementale
- `name`: Nome della bottiglia (es. "Barolo DOCG")
- `producer`: Produttore/Cantina (es. "Gaja")
- `category`: Categoria (wine, whisky, rum, gin, etc.)
- `vintage`: Anno di produzione (solo per vini)
- `age`: Età di invecchiamento (solo per spirits)
- `country`: Paese di origine
- `region`: Regione/Denominazione
- `rating`: Valutazione 0-5
- `description`: Descrizione testuale
- `image_url`: URL immagine
- `abv`: Gradazione alcolica
- `external_id`: ID da API esterna
- `external_source`: Fonte API (vivino, winevybe, etc.)

---

### cellar_bottles

Bottiglie presenti nella cantina con dettagli finanziari.

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
    CHECK (purchase_price >= 0),
    CHECK (current_price >= 0),
    CHECK (quantity > 0)
);

CREATE INDEX idx_cellar_bottle_id ON cellar_bottles(bottle_id);
CREATE INDEX idx_cellar_purchase_date ON cellar_bottles(purchase_date DESC);
```

**Campi:**
- `id`: Chiave primaria
- `bottle_id`: Riferimento a bottles
- `purchase_price`: Prezzo di acquisto
- `current_price`: Valore attuale di mercato
- `quantity`: Numero di bottiglie
- `location`: Posizione fisica (es. "Scaffale A1")
- `purchase_date`: Data di acquisto
- `notes`: Note personali

---

### favorites

Lista delle bottiglie preferite (wishlist).

```sql
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
    UNIQUE(bottle_id)
);

CREATE INDEX idx_favorites_bottle ON favorites(bottle_id);
CREATE INDEX idx_favorites_added ON favorites(added_at DESC);
```

**Campi:**
- `id`: Chiave primaria
- `bottle_id`: Riferimento a bottles (UNIQUE - no duplicati)
- `added_at`: Data aggiunta ai preferiti
- `notes`: Note personali

---

### pairings

Abbinamenti gastronomici per ciascuna bottiglia.

```sql
CREATE TABLE pairings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    pairing_type VARCHAR(50),
    pairing_value VARCHAR(255),
    meal_type VARCHAR(50),
    season VARCHAR(20),
    temperature_min DECIMAL(4,2),
    temperature_max DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
    CHECK (pairing_type IN ('food', 'occasion', 'temperature', 'dish')),
    CHECK (meal_type IN ('appetizer', 'first_course', 'main_course', 'dessert', 'aperitif')),
    CHECK (season IN ('spring', 'summer', 'autumn', 'winter', 'all'))
);

CREATE INDEX idx_pairings_bottle ON pairings(bottle_id);
CREATE INDEX idx_pairings_meal_type ON pairings(meal_type);
```

**Campi:**
- `pairing_type`: Tipo di abbinamento (food, occasion, etc.)
- `pairing_value`: Valore specifico (es. "Carne rossa")
- `meal_type`: Tipo di pasto
- `season`: Stagione consigliata
- `temperature_min/max`: Range temperatura servizio

**Esempi:**
```sql
-- Abbinamento cibo
INSERT INTO pairings (bottle_id, pairing_type, pairing_value, meal_type, season)
VALUES (1, 'food', 'Brasato al Barolo', 'main_course', 'autumn');

-- Temperatura servizio
INSERT INTO pairings (bottle_id, pairing_type, temperature_min, temperature_max)
VALUES (1, 'temperature', 16.0, 18.0);
```

---

### consumption_history

Storico dei consumi per tracking.

```sql
CREATE TABLE consumption_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cellar_bottle_id INTEGER NOT NULL,
    consumed_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    occasion VARCHAR(255),
    rating INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (cellar_bottle_id) REFERENCES cellar_bottles(id) ON DELETE CASCADE,
    CHECK (quantity > 0),
    CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_consumption_cellar ON consumption_history(cellar_bottle_id);
CREATE INDEX idx_consumption_date ON consumption_history(consumed_date DESC);
```

**Campi:**
- `cellar_bottle_id`: Riferimento a cellar_bottles
- `consumed_date`: Data di consumo
- `quantity`: Quantità consumata
- `occasion`: Occasione (es. "Cena con amici")
- `rating`: Valutazione 1-5
- `notes`: Note di degustazione

---

## Views Pre-calcolate

Per migliorare le performance, sono create delle view pre-calcolate.

### cellar_stats

Statistiche aggregate della cantina.

```sql
CREATE VIEW cellar_stats AS
SELECT
    COUNT(DISTINCT cb.bottle_id) as unique_bottles,
    SUM(cb.quantity) as total_bottles,
    SUM(cb.purchase_price * cb.quantity) as total_investment,
    SUM(cb.current_price * cb.quantity) as total_value,
    SUM((cb.current_price - cb.purchase_price) * cb.quantity) as total_return,
    ROUND(
        (SUM((cb.current_price - cb.purchase_price) * cb.quantity) /
         NULLIF(SUM(cb.purchase_price * cb.quantity), 0)) * 100,
        2
    ) as roi_percentage
FROM cellar_bottles cb
WHERE cb.quantity > 0;
```

**Utilizzo:**
```sql
SELECT * FROM cellar_stats;
```

**Output:**
```json
{
  "unique_bottles": 45,
  "total_bottles": 127,
  "total_investment": 3450.00,
  "total_value": 4120.00,
  "total_return": 670.00,
  "roi_percentage": 19.42
}
```

---

### cellar_details

Join completo tra cellar_bottles e bottles.

```sql
CREATE VIEW cellar_details AS
SELECT
    cb.id as cellar_id,
    cb.bottle_id,
    b.name,
    b.producer,
    b.category,
    b.vintage,
    b.age,
    b.country,
    b.region,
    b.rating,
    b.image_url,
    cb.purchase_price,
    cb.current_price,
    cb.quantity,
    cb.location,
    cb.purchase_date,
    (cb.current_price - cb.purchase_price) as unit_return,
    ROUND(
        ((cb.current_price - cb.purchase_price) /
         NULLIF(cb.purchase_price, 0)) * 100,
        2
    ) as unit_roi_percentage,
    (cb.current_price - cb.purchase_price) * cb.quantity as total_return,
    cb.purchase_price * cb.quantity as total_investment,
    cb.current_price * cb.quantity as total_value
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id
WHERE cb.quantity > 0
ORDER BY cb.created_at DESC;
```

---

### category_distribution

Distribuzione bottiglie per categoria.

```sql
CREATE VIEW category_distribution AS
SELECT
    b.category,
    COUNT(DISTINCT cb.bottle_id) as unique_bottles,
    SUM(cb.quantity) as total_bottles,
    SUM(cb.purchase_price * cb.quantity) as total_investment,
    SUM(cb.current_price * cb.quantity) as total_value,
    SUM((cb.current_price - cb.purchase_price) * cb.quantity) as total_return,
    ROUND(
        AVG(((cb.current_price - cb.purchase_price) /
             NULLIF(cb.purchase_price, 0)) * 100),
        2
    ) as avg_roi_percentage
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id
WHERE cb.quantity > 0
GROUP BY b.category
ORDER BY total_value DESC;
```

**Output Esempio:**
```json
[
  {
    "category": "wine",
    "unique_bottles": 30,
    "total_bottles": 85,
    "total_investment": 2100.00,
    "total_value": 2650.00,
    "total_return": 550.00,
    "avg_roi_percentage": 26.19
  },
  {
    "category": "whisky",
    "unique_bottles": 12,
    "total_bottles": 28,
    "total_investment": 980.00,
    "total_value": 1150.00,
    "total_return": 170.00,
    "avg_roi_percentage": 17.35
  }
]
```

---

### top_performers

Bottiglie con migliori rendimenti.

```sql
CREATE VIEW top_performers AS
SELECT
    b.name,
    b.producer,
    b.category,
    cb.purchase_price,
    cb.current_price,
    cb.quantity,
    (cb.current_price - cb.purchase_price) as unit_return,
    ROUND(
        ((cb.current_price - cb.purchase_price) /
         NULLIF(cb.purchase_price, 0)) * 100,
        2
    ) as roi_percentage,
    (cb.current_price - cb.purchase_price) * cb.quantity as total_return
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id
WHERE cb.quantity > 0
  AND cb.current_price > cb.purchase_price
ORDER BY roi_percentage DESC
LIMIT 10;
```

---

## Triggers

### Update Timestamp Automatico

```sql
-- Trigger per bottles
CREATE TRIGGER update_bottles_timestamp
AFTER UPDATE ON bottles
FOR EACH ROW
BEGIN
    UPDATE bottles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger per cellar_bottles
CREATE TRIGGER update_cellar_timestamp
AFTER UPDATE ON cellar_bottles
FOR EACH ROW
BEGIN
    UPDATE cellar_bottles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

### Aggiorna Quantità dopo Consumo

```sql
CREATE TRIGGER after_consumption_update_quantity
AFTER INSERT ON consumption_history
FOR EACH ROW
BEGIN
    UPDATE cellar_bottles
    SET quantity = quantity - NEW.quantity
    WHERE id = NEW.cellar_bottle_id;
END;
```

---

## Migrations

### Creazione Iniziale

```sql
-- migrations/001_initial_schema.sql
BEGIN TRANSACTION;

-- Crea tutte le tabelle
CREATE TABLE bottles (...);
CREATE TABLE cellar_bottles (...);
CREATE TABLE favorites (...);
CREATE TABLE pairings (...);
CREATE TABLE consumption_history (...);

-- Crea indici
CREATE INDEX idx_bottles_category ON bottles(category);
-- ... altri indici

-- Crea views
CREATE VIEW cellar_stats AS ...;
-- ... altre views

-- Crea triggers
CREATE TRIGGER update_bottles_timestamp ...;
-- ... altri triggers

COMMIT;
```

### Migration Esempio

```sql
-- migrations/002_add_abv_to_bottles.sql
BEGIN TRANSACTION;

ALTER TABLE bottles ADD COLUMN abv DECIMAL(4,2);
ALTER TABLE bottles ADD CHECK (abv >= 0 AND abv <= 100);

COMMIT;
```

---

## Seeding Data

### Dati di Esempio

```sql
-- seeds/001_sample_bottles.sql
BEGIN TRANSACTION;

-- Vini
INSERT INTO bottles (name, producer, category, vintage, country, region, rating, abv)
VALUES
    ('Barolo DOCG', 'Gaja', 'wine', 2015, 'Italy', 'Piedmont', 4.5, 14.5),
    ('Brunello di Montalcino', 'Biondi-Santi', 'wine', 2012, 'Italy', 'Tuscany', 4.7, 14.0),
    ('Amarone della Valpolicella', 'Allegrini', 'wine', 2013, 'Italy', 'Veneto', 4.6, 15.5);

-- Whisky
INSERT INTO bottles (name, producer, category, age, country, region, rating, abv)
VALUES
    ('Lagavulin 16', 'Lagavulin', 'whisky', 16, 'Scotland', 'Islay', 4.7, 43.0),
    ('Macallan 18', 'Macallan', 'whisky', 18, 'Scotland', 'Speyside', 4.9, 43.0);

COMMIT;
```

---

## Backup e Restore

### Backup SQLite

```bash
# Backup completo
sqlite3 mycellar.db ".backup mycellar_backup.db"

# Export SQL
sqlite3 mycellar.db .dump > mycellar_backup.sql
```

### Restore

```bash
# Da backup
sqlite3 mycellar.db ".restore mycellar_backup.db"

# Da SQL
sqlite3 mycellar.db < mycellar_backup.sql
```

---

## Performance Tips

1. **Usa Indici**: Crea indici su colonne frequentemente interrogate
2. **Limita JOIN**: Usa views pre-calcolate per query complesse
3. **Pagination**: Implementa LIMIT/OFFSET per grandi dataset
4. **Cleanup**: Elimina periodicamente dati obsoleti
5. **VACUUM**: Esegui periodicamente per ottimizzare lo spazio

```sql
-- Ottimizza database
VACUUM;
ANALYZE;
```

## Prossimi Passi

- [API Overview](../api/overview)
- [Cellar API](../api/cellar)
- [Analytics](../features/analytics)
