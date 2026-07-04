import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'INFO',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
