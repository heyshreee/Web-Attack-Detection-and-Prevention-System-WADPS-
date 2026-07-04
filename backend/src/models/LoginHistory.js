import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  ip: {
    type: String,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
export default LoginHistory;
