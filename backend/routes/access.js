const express = require('express');
const router = express.Router();
const AccessLog = require('../models/AccessLog');
const Tag = require('../models/Tag');

/**
 * POST /api/access
 * Recebe tentativa de acesso vinda do ESP32
 * Body esperado: { rfid, device, distanceDetected, timestamp }
 * Resposta: { authorized, user, message }
 */
router.post('/', async (req, res) => {
  const { rfid, device, distanceDetected, eventType } = req.body;

  if (!rfid) {
    return res.status(400).json({ error: 'Campo rfid é obrigatório' });
  }

  // Abertura manual pelo botão físico — sempre autorizado
  if (eventType === 'manual') {
    const log = new AccessLog({
      rfid:      'MANUAL',
      device:    device || 'esp32-porta-01',
      user:      'Abertura Manual',
      authorized: true,
      message:   'Acesso liberado - Botão físico',
      eventType: 'manual',
      timestamp: new Date()
    });
    await log.save().catch(err => console.error('Erro ao salvar log:', err.message));
    return res.json({ authorized: true, user: 'Abertura Manual', message: 'Acesso liberado' });
  }

  // REGRA DE NEGÓCIO: busca a tag no banco e verifica se está ativa
  const tag = await Tag.findOne({
    rfid: rfid.toUpperCase().trim(),
    active: true
  }).catch(() => null);

  const authorized = !!tag;

  // Persiste o evento no MongoDB
  const log = new AccessLog({
    rfid:             rfid.toUpperCase().trim(),
    device:           device || 'esp32-porta-01',
    user:             tag ? tag.name : 'Desconhecido',
    authorized,
    message:          authorized
                        ? `Acesso liberado - ${tag.name}`
                        : 'Acesso negado - Tag não autorizada',
    distanceDetected: distanceDetected !== undefined ? distanceDetected : true,
    eventType:        'rfid',
    timestamp:        new Date()
  });

  await log.save().catch(err => console.error('Erro ao salvar log:', err.message));

  return res.json({
    authorized,
    user:    tag ? tag.name : 'Desconhecido',
    message: authorized ? 'Acesso liberado' : 'Acesso negado'
  });
});

module.exports = router;
