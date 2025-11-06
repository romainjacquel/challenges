const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Cache for stats
let statsCache = null;
let cacheTimestamp = null;

// Calculate stats from items array
function calculateStats(items) {
  if (!items || items.length === 0) {
    return { total: 0, averagePrice: 0 };
  }

  const total = items.length;
  const averagePrice = items.reduce((acc, cur) => acc + cur.price, 0) / total;

  return {
    total,
    averagePrice: Math.round(averagePrice * 100) / 100 // Round to 2 decimals
  };
}

// Watch file for changes and invalidate cache
fs.watch(DATA_PATH, (eventType) => {
  if (eventType === 'change') {
    console.log('Data file changed, invalidating stats cache');
    statsCache = null;
    cacheTimestamp = null;
  }
});

// GET /api/stats
router.get('/', (req, res, next) => {
  // Return cached stats if available
  if (statsCache !== null) {
    return res.json({ ...statsCache, cached: true, cachedAt: cacheTimestamp });
  }

  // Otherwise, read file and calculate
  fs.readFile(DATA_PATH, 'utf-8', (err, raw) => {
    if (err) return next(err);

    try {
      const items = JSON.parse(raw);
      const stats = calculateStats(items);

      // Update cache
      statsCache = stats;
      cacheTimestamp = new Date().toISOString();

      res.json({ ...stats, cached: false });
    } catch (parseErr) {
      next(parseErr);
    }
  });
});

module.exports = router;
