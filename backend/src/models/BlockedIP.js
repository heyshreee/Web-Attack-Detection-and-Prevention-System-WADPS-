import mongoose from 'mongoose';

const blockedIPSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
  },
  reason: {
    type: String,
    default: 'Manual operator block',
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date, // null means permanent block
  },
});

const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema);
export default BlockedIP;
