import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
  }
});

const SystemLog = mongoose.model('SystemLog', systemLogSchema);
export default SystemLog;
