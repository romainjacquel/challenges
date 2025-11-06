const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (now async and non-blocking)
async function readData() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const err = new Error('Invalid JSON in data file');
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

// Utility to write data (async)
async function writeData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/items with pagination and search
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const { limit, q, page = '1', pageSize = '20' } = req.query;
    let results = data;

    // Apply search filter
    if (q) {
      const searchTerm = q.toLowerCase();
      results = results.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    }

    // Legacy limit support (backward compatibility - returns array format)
    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        return res.json(results.slice(0, parsedLimit));
      }
    }

    // Calculate pagination
    const parsedPage = parseInt(page, 10);
    const parsedPageSize = parseInt(pageSize, 10);
    const validPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const validPageSize = !isNaN(parsedPageSize) && parsedPageSize > 0 && parsedPageSize <= 100 ? parsedPageSize : 20;

    const totalItems = results.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize));

    // Clamp page to valid range
    const clampedPage = Math.min(validPage, totalPages);

    const startIndex = (clampedPage - 1) * validPageSize;
    const endIndex = startIndex + validPageSize;

    // Apply pagination
    const paginatedResults = results.slice(startIndex, endIndex);

    // Return paginated response with metadata
    res.json({
      data: paginatedResults,
      pagination: {
        page: clampedPage,
        pageSize: validPageSize,
        totalItems,
        totalPages,
        hasNextPage: clampedPage < totalPages,
        hasPrevPage: clampedPage > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      const err = new Error('Invalid item ID');
      err.status = 400;
      throw err;
    }

    const item = data.find(i => i.id === id);
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    const { name, category, price } = req.body;

    // Validate payload
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Name is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      const err = new Error('Category is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      const err = new Error('Price is required and must be a non-negative number');
      err.status = 400;
      throw err;
    }

    const data = await readData();
    const item = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      price
    };

    data.push(item);
    await writeData(data);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
