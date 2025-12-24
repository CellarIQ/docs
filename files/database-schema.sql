-- ===================================================
-- MyCellar Database Schema
-- ===================================================

-- Elimina le tabelle esistenti se presenti
DROP TABLE IF EXISTS consumption_history;
DROP TABLE IF EXISTS pairings;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS cellar_bottles;
DROP TABLE IF EXISTS bottles;

-- ===================================================
-- Tabella: bottles
-- Contiene tutte le bottiglie nel database
-- ===================================================
CREATE TABLE bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    producer VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK(category IN ('wine', 'whisky', 'scotch', 'rum', 'gin', 'vodka', 'tequila', 'cognac', 'brandy')),
    wine_type VARCHAR(50), -- red, white, rose, sparkling (solo per vini)
    vintage INTEGER,
    age INTEGER, -- per spirits (es. 12 years old)
    country VARCHAR(100),
    region VARCHAR(100),
    rating DECIMAL(3,1) CHECK(rating >= 0 AND rating <= 5),
    ratings_count INTEGER DEFAULT 0,
    description TEXT,
    image_url VARCHAR(500),
    abv DECIMAL(4,2) CHECK(abv >= 0 AND abv <= 100), -- alcohol by volume
    grape_variety VARCHAR(255), -- per vini
    bottle_size VARCHAR(50) DEFAULT '750ml',
    external_id VARCHAR(255), -- ID da API esterna
    external_source VARCHAR(50), -- 'vivino', 'winevybe', 'globalwinescore', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_bottles_name ON bottles(name);
CREATE INDEX idx_bottles_category ON bottles(category);
CREATE INDEX idx_bottles_producer ON bottles(producer);
CREATE INDEX idx_bottles_external ON bottles(external_source, external_id);

-- ===================================================
-- Tabella: cellar_bottles
-- Contiene le bottiglie nella cantina con quantità e prezzi
-- ===================================================
CREATE TABLE cellar_bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL CHECK(purchase_price >= 0),
    current_price DECIMAL(10,2) CHECK(current_price >= 0),
    quantity INTEGER DEFAULT 1 CHECK(quantity > 0),
    location VARCHAR(100), -- es. "Scaffale A1", "Cantina Piano -1", "Credenza Cucina"
    storage_conditions VARCHAR(50), -- es. "temperatura controllata", "ambiente"
    purchase_date DATE,
    drink_by_date DATE, -- data consigliata per consumo
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX idx_cellar_bottles_bottle ON cellar_bottles(bottle_id);
CREATE INDEX idx_cellar_bottles_location ON cellar_bottles(location);

-- ===================================================
-- Tabella: favorites
-- Contiene i preferiti dell'utente
-- ===================================================
CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
    UNIQUE(bottle_id) -- Ogni bottiglia può essere nei preferiti una sola volta
);

-- Indice per performance
CREATE INDEX idx_favorites_bottle ON favorites(bottle_id);

-- ===================================================
-- Tabella: pairings
-- Suggerimenti di abbinamento per ciascuna bottiglia
-- ===================================================
CREATE TABLE pairings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bottle_id INTEGER NOT NULL,
    pairing_type VARCHAR(50) NOT NULL, -- 'food', 'occasion', 'temperature', 'glassware'
    pairing_value VARCHAR(255) NOT NULL,
    description TEXT,
    season VARCHAR(50), -- spring, summer, autumn, winter
    meal_type VARCHAR(50), -- appetizer, main_course, dessert
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX idx_pairings_bottle ON pairings(bottle_id);
CREATE INDEX idx_pairings_type ON pairings(pairing_type);

-- ===================================================
-- Tabella: consumption_history
-- Storico dei consumi per tracking e analytics
-- ===================================================
CREATE TABLE consumption_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cellar_bottle_id INTEGER NOT NULL,
    consumed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity INTEGER DEFAULT 1 CHECK(quantity > 0),
    occasion VARCHAR(255), -- es. "Cena con amici", "Degustazione", "Regalo"
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    tasting_notes TEXT,
    food_pairing VARCHAR(255),
    companions TEXT, -- con chi è stata consumata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cellar_bottle_id) REFERENCES cellar_bottles(id) ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX idx_consumption_cellar_bottle ON consumption_history(cellar_bottle_id);
CREATE INDEX idx_consumption_date ON consumption_history(consumed_date);

-- ===================================================
-- Trigger per aggiornare updated_at automaticamente
-- ===================================================
CREATE TRIGGER update_bottles_timestamp 
AFTER UPDATE ON bottles
BEGIN
    UPDATE bottles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_cellar_bottles_timestamp 
AFTER UPDATE ON cellar_bottles
BEGIN
    UPDATE cellar_bottles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ===================================================
-- View: cellar_stats
-- Statistiche della cantina
-- ===================================================
CREATE VIEW cellar_stats AS
SELECT 
    COUNT(DISTINCT cb.id) as total_entries,
    SUM(cb.quantity) as total_bottles,
    SUM(cb.purchase_price * cb.quantity) as total_investment,
    SUM(cb.current_price * cb.quantity) as total_value,
    SUM((cb.current_price - cb.purchase_price) * cb.quantity) as total_return,
    CASE 
        WHEN SUM(cb.purchase_price * cb.quantity) > 0 
        THEN ROUND(((SUM(cb.current_price * cb.quantity) - SUM(cb.purchase_price * cb.quantity)) / SUM(cb.purchase_price * cb.quantity)) * 100, 2)
        ELSE 0 
    END as return_percentage,
    ROUND(AVG(cb.current_price), 2) as avg_bottle_value
FROM cellar_bottles cb;

-- ===================================================
-- View: cellar_details
-- Dettagli completi della cantina con join alle bottiglie
-- ===================================================
CREATE VIEW cellar_details AS
SELECT 
    cb.id as cellar_id,
    cb.quantity,
    cb.purchase_price,
    cb.current_price,
    cb.location,
    cb.purchase_date,
    cb.drink_by_date,
    cb.notes as cellar_notes,
    (cb.current_price - cb.purchase_price) as unit_return,
    (cb.current_price - cb.purchase_price) * cb.quantity as total_return,
    CASE 
        WHEN cb.purchase_price > 0 
        THEN ROUND(((cb.current_price - cb.purchase_price) / cb.purchase_price) * 100, 2)
        ELSE 0 
    END as return_percentage,
    b.*
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id;

-- ===================================================
-- View: category_distribution
-- Distribuzione delle bottiglie per categoria
-- ===================================================
CREATE VIEW category_distribution AS
SELECT 
    b.category,
    COUNT(cb.id) as entries_count,
    SUM(cb.quantity) as bottles_count,
    SUM(cb.purchase_price * cb.quantity) as total_investment,
    SUM(cb.current_price * cb.quantity) as total_value,
    ROUND(AVG(b.rating), 2) as avg_rating
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id
GROUP BY b.category;

-- ===================================================
-- View: top_performers
-- Bottiglie con miglior rendimento
-- ===================================================
CREATE VIEW top_performers AS
SELECT 
    b.name,
    b.producer,
    b.category,
    cb.purchase_price,
    cb.current_price,
    (cb.current_price - cb.purchase_price) as profit,
    CASE 
        WHEN cb.purchase_price > 0 
        THEN ROUND(((cb.current_price - cb.purchase_price) / cb.purchase_price) * 100, 2)
        ELSE 0 
    END as roi_percentage,
    cb.quantity
FROM cellar_bottles cb
JOIN bottles b ON cb.bottle_id = b.id
WHERE (cb.current_price - cb.purchase_price) > 0
ORDER BY (cb.current_price - cb.purchase_price) DESC;

-- ===================================================
-- Dati di esempio per testing
-- ===================================================

-- Inserisci alcuni vini di esempio
INSERT INTO bottles (name, producer, category, wine_type, vintage, country, region, rating, description, abv, external_source) VALUES
('Barolo DOCG', 'Cantina Mascarello', 'wine', 'red', 2018, 'Italia', 'Piemonte', 4.5, 'Elegante Barolo con note di ciliegia, spezie e tabacco', 14.5, 'manual'),
('Brunello di Montalcino', 'Biondi Santi', 'wine', 'red', 2016, 'Italia', 'Toscana', 4.7, 'Potente e strutturato con grande potenziale di invecchiamento', 14.0, 'manual'),
('Champagne Brut', 'Dom Pérignon', 'wine', 'sparkling', 2012, 'Francia', 'Champagne', 4.8, 'Elegante champagne con bollicine fini e persistenti', 12.5, 'manual');

-- Inserisci alcuni spirits di esempio
INSERT INTO bottles (name, producer, category, age, country, region, rating, description, abv, external_source) VALUES
('Lagavulin', 'Diageo', 'scotch', 16, 'Scotland', 'Islay', 4.7, 'Intensamente torbato con note di iodio e pepe', 43.0, 'manual'),
('Glenfiddich', 'William Grant & Sons', 'whisky', 12, 'Scotland', 'Speyside', 4.3, 'Morbido e fruttato con note di pera e mela', 40.0, 'manual'),
('Diplomatico Reserva', 'Destilerias Unidas', 'rum', 12, 'Venezuela', 'Lara', 4.6, 'Rum ricco e complesso con note di caramello e vaniglia', 40.0, 'manual'),
('Hendricks', 'William Grant & Sons', 'gin', NULL, 'Scotland', NULL, 4.4, 'Gin aromatico con cetriolo e rosa', 41.4, 'manual');

-- Aggiungi alcune bottiglie alla cantina
INSERT INTO cellar_bottles (bottle_id, purchase_price, current_price, quantity, location, purchase_date) VALUES
(1, 45.00, 52.00, 3, 'Scaffale A1', '2023-06-15'),
(2, 75.00, 85.00, 2, 'Scaffale A2', '2023-08-20'),
(3, 180.00, 195.00, 1, 'Scaffale B1', '2024-01-10'),
(4, 65.00, 72.00, 2, 'Scaffale C1', '2023-11-05'),
(5, 42.00, 45.00, 1, 'Scaffale C2', '2024-02-14'),
(6, 55.00, 58.00, 1, 'Scaffale C3', '2024-03-01'),
(7, 38.00, 40.00, 1, 'Scaffale D1', '2024-01-20');

-- Aggiungi alcuni preferiti
INSERT INTO favorites (bottle_id) VALUES (1), (3), (4);

-- Aggiungi abbinamenti
INSERT INTO pairings (bottle_id, pairing_type, pairing_value, meal_type) VALUES
(1, 'food', 'Brasato al Barolo', 'main_course'),
(1, 'food', 'Formaggi stagionati', 'main_course'),
(1, 'temperature', '16-18°C', NULL),
(2, 'food', 'Bistecca alla fiorentina', 'main_course'),
(2, 'food', 'Pappardelle al cinghiale', 'main_course'),
(3, 'food', 'Ostriche', 'appetizer'),
(3, 'food', 'Dessert leggeri', 'dessert'),
(3, 'occasion', 'Aperitivo elegante', NULL),
(4, 'food', 'Salmone affumicato', 'appetizer'),
(4, 'food', 'Cioccolato fondente', 'dessert'),
(5, 'food', 'Formaggi morbidi', 'main_course'),
(6, 'food', 'Frutta tropicale', 'dessert'),
(7, 'occasion', 'Gin Tonic', NULL);

-- ===================================================
-- Query di esempio per statistiche
-- ===================================================

-- Statistiche generali della cantina
-- SELECT * FROM cellar_stats;

-- Dettagli completi della cantina
-- SELECT * FROM cellar_details ORDER BY return_percentage DESC;

-- Distribuzione per categoria
-- SELECT * FROM category_distribution;

-- Top performers
-- SELECT * FROM top_performers LIMIT 10;

-- Valore totale per location
-- SELECT location, SUM(current_price * quantity) as location_value 
-- FROM cellar_bottles 
-- GROUP BY location 
-- ORDER BY location_value DESC;

-- Bottiglie che scadono presto (da bere entro 6 mesi)
-- SELECT b.name, b.producer, cb.drink_by_date, cb.location
-- FROM cellar_bottles cb
-- JOIN bottles b ON cb.bottle_id = b.id
-- WHERE cb.drink_by_date IS NOT NULL 
-- AND cb.drink_by_date <= date('now', '+6 months')
-- ORDER BY cb.drink_by_date;

COMMIT;
