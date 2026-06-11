const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true },
    chain: { type: String, enum: ['ethereum', 'solana', 'bsc', 'polygon', 'tron'], required: true },
    label: String,
    addedBy: Number,  // Telegram user ID
    addedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Wallet', walletSchema);