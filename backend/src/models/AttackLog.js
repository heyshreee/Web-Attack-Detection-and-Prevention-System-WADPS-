import mongoose from 'mongoose';

const attackLogSchema = new mongoose.Schema({
  attackType: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
  },
  payload: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  country: {
    type: String,
    default: 'Localhost',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AttackLog = mongoose.model('AttackLog', attackLogSchema);
export default AttackLog;
