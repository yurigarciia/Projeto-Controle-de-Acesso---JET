const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  rfid: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  device: {
    type: String,
    default: 'esp32-porta-01'
  },
  user: {
    type: String,
    default: 'Desconhecido'
  },
  authorized: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  distanceDetected: {
    type: Boolean,
    default: true
  },
  eventType: {
    type: String,
    enum: ['rfid', 'button_reset', 'manual'],
    default: 'rfid'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ authorized: 1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
