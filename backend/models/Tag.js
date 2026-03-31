const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  rfid: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['aluno', 'professor', 'funcionario', 'visitante'],
    default: 'aluno'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tag', tagSchema);
