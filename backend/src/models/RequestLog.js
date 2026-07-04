import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  url: {
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
  statusCode: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const RequestLog = mongoose.model('RequestLog', requestLogSchema);
export default RequestLog;
