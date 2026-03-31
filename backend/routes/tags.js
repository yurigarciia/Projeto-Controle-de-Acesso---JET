const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

// GET /api/tags — lista todas as tags cadastradas
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tags' });
  }
});

// POST /api/tags — cadastra nova tag autorizada
router.post('/', async (req, res) => {
  try {
    const { rfid, name, role } = req.body;

    if (!rfid || !name) {
      return res.status(400).json({ error: 'Campos rfid e name são obrigatórios' });
    }

    const tag = new Tag({ rfid, name, role });
    await tag.save();
    res.status(201).json(tag);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Essa tag RFID já está cadastrada' });
    }
    res.status(500).json({ error: 'Erro ao cadastrar tag' });
  }
});

// PATCH /api/tags/:id/toggle — ativa ou desativa uma tag
router.patch('/:id/toggle', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag não encontrada' });

    tag.active = !tag.active;
    await tag.save();
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar status da tag' });
  }
});

// DELETE /api/tags/:id — remove uma tag
router.delete('/:id', async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tag removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
});

module.exports = router;
