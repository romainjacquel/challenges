const request = require('supertest');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const itemsRouter = require('../routes/items');

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/items', itemsRouter);

// Error handler for tests
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

const TEST_DATA_PATH = path.join(__dirname, '../../../data/items.json');
const BACKUP_PATH = path.join(__dirname, '../../../data/items.backup.json');

describe('Items API', () => {
  let originalData;

  beforeAll(async () => {
    try {
      // Backup original data
      const data = await fs.readFile(TEST_DATA_PATH, 'utf-8');
      originalData = data;
      await fs.writeFile(BACKUP_PATH, data);
      console.log('✓ Test data backed up');
    } catch (error) {
      console.error('Failed to backup test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Restore original data
      await fs.writeFile(TEST_DATA_PATH, originalData);
      await fs.unlink(BACKUP_PATH).catch(() => {});
      console.log('✓ Test data restored');
    } catch (error) {
      console.error('Failed to restore test data:', error);
    }
  });

  beforeEach(async () => {
    // Reset to original state before each test
    await fs.writeFile(TEST_DATA_PATH, originalData);
  });

  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const res = await request(app).get('/api/items');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('category');
      expect(res.body[0]).toHaveProperty('price');
    });

    it('should filter items by search query', async () => {
      const res = await request(app).get('/api/items?q=laptop');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name.toLowerCase()).toContain('laptop');
    });

    it('should limit results when limit parameter is provided', async () => {
      const res = await request(app).get('/api/items?limit=2');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should handle case-insensitive search', async () => {
      const res = await request(app).get('/api/items?q=LAPTOP');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', async () => {
      const res = await request(app).get('/api/items?q=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should combine search and limit parameters', async () => {
      const res = await request(app).get('/api/items?q=e&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(1);
      if (res.body.length > 0) {
        expect(res.body[0].name.toLowerCase()).toContain('e');
      }
    });

    it('should ignore invalid limit values', async () => {
      const res = await request(app).get('/api/items?limit=invalid');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should return all items since invalid limit is ignored
    });

    it('should ignore negative limit values', async () => {
      const res = await request(app).get('/api/items?limit=-5');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should return all items since negative limit is ignored
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      const res = await request(app).get('/api/items/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('category');
      expect(res.body).toHaveProperty('price');
    });

    it('should return 404 for non-existent item', async () => {
      const res = await request(app).get('/api/items/99999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/api/items/invalid');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid item ID');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = {
        name: 'Test Product',
        category: 'Testing',
        price: 99.99
      };

      const res = await request(app)
        .post('/api/items')
        .send(newItem);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Product');
      expect(res.body.category).toBe('Testing');
      expect(res.body.price).toBe(99.99);

      // Verify item was actually added
      const getRes = await request(app).get('/api/items');
      const found = getRes.body.find(item => item.name === 'Test Product');
      expect(found).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ category: 'Testing', price: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name is required');
    });

    it('should return 400 when name is empty string', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: '', category: 'Testing', price: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name is required');
    });

    it('should return 400 when name is only whitespace', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: '   ', category: 'Testing', price: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name is required');
    });

    it('should return 400 when category is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Test', price: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category is required');
    });

    it('should return 400 when category is empty string', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Test', category: '', price: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category is required');
    });

    it('should return 400 when price is missing', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Test', category: 'Testing' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Price is required');
    });

    it('should return 400 when price is negative', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Test', category: 'Testing', price: -10 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('non-negative number');
    });

    it('should return 400 when price is not a number', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Test', category: 'Testing', price: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Price is required');
    });

    it('should accept price as zero', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Free Item', category: 'Testing', price: 0 });

      expect(res.status).toBe(201);
      expect(res.body.price).toBe(0);
    });

    it('should trim whitespace from name and category', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: '  Test  ', category: '  Testing  ', price: 50 });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test');
      expect(res.body.category).toBe('Testing');
    });

    it('should generate unique IDs for multiple items', async () => {
      const item1 = await request(app)
        .post('/api/items')
        .send({ name: 'Item 1', category: 'Test', price: 10 });

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const item2 = await request(app)
        .post('/api/items')
        .send({ name: 'Item 2', category: 'Test', price: 20 });

      expect(item1.body.id).not.toBe(item2.body.id);
    });

    it('should handle large price values', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Expensive', category: 'Luxury', price: 999999.99 });

      expect(res.status).toBe(201);
      expect(res.body.price).toBe(999999.99);
    });

    it('should handle decimal prices correctly', async () => {
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'Item', category: 'Test', price: 19.99 });

      expect(res.status).toBe(201);
      expect(res.body.price).toBe(19.99);
    });
  });

  describe('Error cases', () => {
    it('should handle malformed JSON in data file', async () => {
      // Save malformed JSON
      await fs.writeFile(TEST_DATA_PATH, 'not valid json');

      const res = await request(app).get('/api/items');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
