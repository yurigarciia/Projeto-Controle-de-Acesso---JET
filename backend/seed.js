/**
 * seed.js — Popula o banco com tags RFID autorizadas para teste
 * Uso: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Tag      = require('./models/Tag');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/controle_acesso';

const tagsIniciais = [
  { rfid: 'A1B2C3D4', name: 'Prof. João Silva',  role: 'professor'   },
  { rfid: 'E5F6A7B8', name: 'Maria Oliveira',     role: 'aluno'       },
  { rfid: 'C9D0E1F2', name: 'Pedro Santos',       role: 'aluno'       },
  { rfid: '12345678', name: 'Ana Costa',           role: 'funcionario' },
  { rfid: 'AABBCCDD', name: 'Visitante Teste',    role: 'visitante',  active: false },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado ao MongoDB\n');

  for (const dados of tagsIniciais) {
    const existe = await Tag.findOne({ rfid: dados.rfid });
    if (!existe) {
      await Tag.create(dados);
      console.log(`✅ Cadastrada: ${dados.name} (${dados.rfid})`);
    } else {
      console.log(`⏭  Já existe: ${dados.name} (${dados.rfid})`);
    }
  }

  console.log('\nSeed finalizado!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro no seed:', err.message);
  process.exit(1);
});
