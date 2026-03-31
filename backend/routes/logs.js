const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');

/**
 * GET /api/logs
 * Query params:
 *   status = "authorized" | "denied"  (omitir = todos)
 *   limit  = número máximo de registros (padrão: 100)
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = {};

    if (status === 'authorized') filter.authorized = true;
    if (status === 'denied')     filter.authorized = false;

    const logs = await AccessLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit) || 100, 500));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico de acessos' });
  }
});

module.exports = router;
