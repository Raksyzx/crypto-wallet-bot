const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  address: { type: String, required: true },
  chain: { type: String, required: true },
  label: String,
  addedBy: Number,
  addedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  removedAt: Date,
  lastChecked: Date,
  balance: String
});

// Composite unique index (address + chain)
walletSchema.index({ address: 1, chain: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);