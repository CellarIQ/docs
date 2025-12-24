// ===================================================
// MyCellar Backend - Node.js + Express
// ===================================================

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================================
// Middleware
// ===================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ===================================================
// Database Connection
// ===================================================
const db = new sqlite3.Database('./mycellar.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Promisify database methods
const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

// ===================================================
// External API Services
// ===================================================

class VivinoService {
    static async search(query, page = 1) {
        try {
            const response = await axios.get('https://www.vivino.com/api/explore/explore', {
                params: {
                    country_code: 'IT',
                    currency_code: 'EUR',
                    grape_filter: 'varietal',
                    min_rating: '1',
                    order_by: 'price',
                    order: 'asc',
                    page: page,
                    wine_type_ids: ['1'] // 1=Red, 2=White, 3=Sparkling, 4=Rose
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            return response.data.explore_vintage.matches.map(item => ({
                name: item.vintage.wine.name,
                producer: item.vintage.wine.winery.name,
                category: 'wine',
                vintage: item.vintage.year,
                rating: item.vintage.statistics.ratings_average,
                ratings_count: item.vintage.statistics.ratings_count,
                image_url: item.vintage.image?.location,
                region: item.vintage.wine.region?.name,
                country: item.vintage.wine.region?.country?.name,
                price: item.price?.amount,
                external_id: item.vintage.wine.id.toString(),
                external_source: 'vivino',
                description: item.vintage.wine.description || 'No description available'
            }));
        } catch (error) {
            console.error('Vivino API Error:', error.message);
            return [];
        }
    }
}

class GlobalWineScoreService {
    static async search(query) {
        try {
            const API_KEY = process.env.GLOBAL_WINE_SCORE_API_KEY;
            if (!API_KEY) {
                console.warn('Global Wine Score API key not configured');
                return [];
            }

            const response = await axios.get('https://api.globalwinescore.com/globalwinescores/latest/', {
                params: { wine: query },
                headers: { 'Authorization': `Token ${API_KEY}` }
            });

            return response.data.results.map(wine => ({
                name: wine.wine,
                producer: wine.winery,
                category: 'wine',
                vintage: wine.vintage,
                rating: wine.score / 20, // Convert from 100 to 5
                country: wine.country,
                region: wine.region,
                wine_type: wine.color,
                external_id: wine.id.toString(),
                external_source: 'globalwinescore'
            }));
        } catch (error) {
            console.error('Global Wine Score API Error:', error.message);
            return [];
        }
    }
}

class WineVybeService {
    static async search(query, category = 'wine') {
        try {
            const API_KEY = process.env.WINEVYBE_API_KEY;
            if (!API_KEY) {
                console.warn('WineVybe API key not configured');
                return [];
            }

            const endpoint = category === 'wine' 
                ? 'https://api.winevybe.com/wines'
                : 'https://api.winevybe.com/liquor';

            const response = await axios.get(endpoint, {
                params: { search: query },
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });

            return response.data.products.map(product => ({
                name: product.name,
                producer: product.producer?.name,
                category: product.category || category,
                country: product.country,
                region: product.region,
                description: product.description,
                image_url: product.image_url,
                abv: product.alcohol_by_volume,
                external_id: product.id.toString(),
                external_source: 'winevybe'
            }));
        } catch (error) {
            console.error('WineVybe API Error:', error.message);
            return [];
        }
    }
}

// ===================================================
// API Routes - Bottles
// ===================================================

// Get all bottles
app.get('/api/bottles', async (req, res) => {
    try {
        const bottles = await dbAll('SELECT * FROM bottles ORDER BY created_at DESC');
        res.json(bottles);
    } catch (error) {
        console.error('Error fetching bottles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get bottle by ID
app.get('/api/bottles/:id', async (req, res) => {
    try {
        const bottle = await dbGet('SELECT * FROM bottles WHERE id = ?', [req.params.id]);
        if (!bottle) {
            return res.status(404).json({ error: 'Bottle not found' });
        }
        res.json(bottle);
    } catch (error) {
        console.error('Error fetching bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create bottle
app.post('/api/bottles', async (req, res) => {
    try {
        const {
            name, producer, category, wine_type, vintage, age,
            country, region, rating, description, image_url, abv,
            grape_variety, bottle_size, external_id, external_source
        } = req.body;

        const result = await dbRun(`
            INSERT INTO bottles (
                name, producer, category, wine_type, vintage, age,
                country, region, rating, description, image_url, abv,
                grape_variety, bottle_size, external_id, external_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, producer, category, wine_type, vintage, age,
            country, region, rating, description, image_url, abv,
            grape_variety, bottle_size || '750ml', external_id, external_source || 'manual'
        ]);

        const newBottle = await dbGet('SELECT * FROM bottles WHERE id = ?', [result.id]);
        res.status(201).json(newBottle);
    } catch (error) {
        console.error('Error creating bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update bottle
app.put('/api/bottles/:id', async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id];

        await dbRun(`UPDATE bottles SET ${fields} WHERE id = ?`, values);
        const updatedBottle = await dbGet('SELECT * FROM bottles WHERE id = ?', [req.params.id]);
        res.json(updatedBottle);
    } catch (error) {
        console.error('Error updating bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete bottle
app.delete('/api/bottles/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM bottles WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// API Routes - Cellar
// ===================================================

// Get all cellar bottles with details
app.get('/api/cellar', async (req, res) => {
    try {
        const cellar = await dbAll('SELECT * FROM cellar_details ORDER BY added_at DESC');
        res.json(cellar);
    } catch (error) {
        console.error('Error fetching cellar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get cellar statistics
app.get('/api/cellar/stats', async (req, res) => {
    try {
        const stats = await dbGet('SELECT * FROM cellar_stats');
        const categoryDist = await dbAll('SELECT * FROM category_distribution');
        const topPerformers = await dbAll('SELECT * FROM top_performers LIMIT 10');

        res.json({
            overall: stats,
            by_category: categoryDist,
            top_performers: topPerformers
        });
    } catch (error) {
        console.error('Error fetching cellar stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add bottle to cellar
app.post('/api/cellar', async (req, res) => {
    try {
        const {
            bottle_id, purchase_price, current_price, quantity,
            location, storage_conditions, purchase_date, drink_by_date, notes
        } = req.body;

        const result = await dbRun(`
            INSERT INTO cellar_bottles (
                bottle_id, purchase_price, current_price, quantity,
                location, storage_conditions, purchase_date, drink_by_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            bottle_id, purchase_price, current_price || purchase_price, quantity || 1,
            location, storage_conditions, purchase_date, drink_by_date, notes
        ]);

        const newEntry = await dbGet('SELECT * FROM cellar_details WHERE cellar_id = ?', [result.id]);
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error adding to cellar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update cellar bottle
app.put('/api/cellar/:id', async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id];

        await dbRun(`UPDATE cellar_bottles SET ${fields} WHERE id = ?`, values);
        const updated = await dbGet('SELECT * FROM cellar_details WHERE cellar_id = ?', [req.params.id]);
        res.json(updated);
    } catch (error) {
        console.error('Error updating cellar bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove from cellar
app.delete('/api/cellar/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM cellar_bottles WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error removing from cellar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// API Routes - Favorites
// ===================================================

// Get all favorites
app.get('/api/favorites', async (req, res) => {
    try {
        const favorites = await dbAll(`
            SELECT f.*, b.*
            FROM favorites f
            JOIN bottles b ON f.bottle_id = b.id
            ORDER BY f.added_at DESC
        `);
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add to favorites
app.post('/api/favorites', async (req, res) => {
    try {
        const { bottle_id, notes } = req.body;

        const result = await dbRun(
            'INSERT INTO favorites (bottle_id, notes) VALUES (?, ?)',
            [bottle_id, notes]
        );

        const favorite = await dbGet(`
            SELECT f.*, b.*
            FROM favorites f
            JOIN bottles b ON f.bottle_id = b.id
            WHERE f.id = ?
        `, [result.id]);

        res.status(201).json(favorite);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            res.status(400).json({ error: 'Bottle already in favorites' });
        } else {
            console.error('Error adding to favorites:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Remove from favorites
app.delete('/api/favorites/:bottleId', async (req, res) => {
    try {
        await dbRun('DELETE FROM favorites WHERE bottle_id = ?', [req.params.bottleId]);
        res.status(204).send();
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// API Routes - Search (External APIs)
// ===================================================

// Search across multiple APIs
app.get('/api/search', async (req, res) => {
    try {
        const { q: query, category = 'wine', source } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        let results = [];

        // Search based on source parameter or all sources
        if (!source || source === 'vivino') {
            const vivinoResults = await VivinoService.search(query);
            results = [...results, ...vivinoResults];
        }

        if (!source || source === 'globalwinescore') {
            const gwsResults = await GlobalWineScoreService.search(query);
            results = [...results, ...gwsResults];
        }

        if (!source || source === 'winevybe') {
            const wvResults = await WineVybeService.search(query, category);
            results = [...results, ...wvResults];
        }

        // Remove duplicates based on name and producer
        const unique = results.reduce((acc, curr) => {
            const key = `${curr.name}-${curr.producer}`.toLowerCase();
            if (!acc.has(key)) {
                acc.set(key, curr);
            }
            return acc;
        }, new Map());

        res.json(Array.from(unique.values()));
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Import bottle from external API
app.post('/api/search/import', async (req, res) => {
    try {
        const bottleData = req.body;

        // Check if bottle already exists
        const existing = await dbGet(
            'SELECT * FROM bottles WHERE external_source = ? AND external_id = ?',
            [bottleData.external_source, bottleData.external_id]
        );

        if (existing) {
            return res.status(200).json({ ...existing, imported: false });
        }

        // Create new bottle
        const result = await dbRun(`
            INSERT INTO bottles (
                name, producer, category, wine_type, vintage, age,
                country, region, rating, ratings_count, description,
                image_url, abv, external_id, external_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            bottleData.name, bottleData.producer, bottleData.category,
            bottleData.wine_type, bottleData.vintage, bottleData.age,
            bottleData.country, bottleData.region, bottleData.rating,
            bottleData.ratings_count, bottleData.description,
            bottleData.image_url, bottleData.abv,
            bottleData.external_id, bottleData.external_source
        ]);

        const newBottle = await dbGet('SELECT * FROM bottles WHERE id = ?', [result.id]);
        res.status(201).json({ ...newBottle, imported: true });
    } catch (error) {
        console.error('Error importing bottle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// API Routes - Pairings
// ===================================================

// Get pairings for a bottle
app.get('/api/pairings/:bottleId', async (req, res) => {
    try {
        const pairings = await dbAll(
            'SELECT * FROM pairings WHERE bottle_id = ? ORDER BY pairing_type',
            [req.params.bottleId]
        );
        res.json(pairings);
    } catch (error) {
        console.error('Error fetching pairings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add pairing
app.post('/api/pairings', async (req, res) => {
    try {
        const { bottle_id, pairing_type, pairing_value, description, season, meal_type } = req.body;

        const result = await dbRun(`
            INSERT INTO pairings (bottle_id, pairing_type, pairing_value, description, season, meal_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [bottle_id, pairing_type, pairing_value, description, season, meal_type]);

        const newPairing = await dbGet('SELECT * FROM pairings WHERE id = ?', [result.id]);
        res.status(201).json(newPairing);
    } catch (error) {
        console.error('Error adding pairing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// API Routes - Consumption History
// ===================================================

// Get consumption history
app.get('/api/consumption', async (req, res) => {
    try {
        const history = await dbAll(`
            SELECT ch.*, cb.*, b.name as bottle_name, b.producer
            FROM consumption_history ch
            JOIN cellar_bottles cb ON ch.cellar_bottle_id = cb.id
            JOIN bottles b ON cb.bottle_id = b.id
            ORDER BY ch.consumed_date DESC
        `);
        res.json(history);
    } catch (error) {
        console.error('Error fetching consumption history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add consumption record
app.post('/api/consumption', async (req, res) => {
    try {
        const {
            cellar_bottle_id, consumed_date, quantity,
            occasion, rating, tasting_notes, food_pairing, companions
        } = req.body;

        // Update cellar quantity
        await dbRun(
            'UPDATE cellar_bottles SET quantity = quantity - ? WHERE id = ?',
            [quantity, cellar_bottle_id]
        );

        // Add consumption record
        const result = await dbRun(`
            INSERT INTO consumption_history (
                cellar_bottle_id, consumed_date, quantity,
                occasion, rating, tasting_notes, food_pairing, companions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            cellar_bottle_id, consumed_date || new Date().toISOString().split('T')[0],
            quantity, occasion, rating, tasting_notes, food_pairing, companions
        ]);

        res.status(201).json({ id: result.id, message: 'Consumption recorded' });
    } catch (error) {
        console.error('Error recording consumption:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================
// Health Check
// ===================================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ===================================================
// Error Handler
// ===================================================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ===================================================
// Start Server
// ===================================================
app.listen(PORT, () => {
    console.log(`🍷 MyCellar API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 API Docs: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});
