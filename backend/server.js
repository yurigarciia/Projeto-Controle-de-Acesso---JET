require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const mongoose  = require('mongoose');

const accessRoutes = require('./routes/access');
const logsRoutes   = require('./routes/logs');
const tagsRoutes   = require('./routes/tags');

const app          = express();
const PORT         = process.env.PORT         || 3001;
const MONGODB_URI  = process.env.MONGODB_URI  || 'mongodb://localhost:27017/controle_acesso';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// ── Rotas ───────────────────────────────────────────────────
app.use('/api/access', accessRoutes);
app.use('/api/logs',   logsRoutes);
app.use('/api/tags',   tagsRoutes);

// Health check — frontend usa para saber se o backend está online
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Inicia servidor ─────────────────────────────────────────
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado:', MONGODB_URI);
    // 0.0.0.0 permite que o ESP32 alcance o servidor pela rede local
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando em http://0.0.0.0:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);
  });
