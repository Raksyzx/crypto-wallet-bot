require('dotenv').config();
const mongoose = require('mongoose');
const { bot } = require('./bot');

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Database connected'))
    .catch(err => console.error('Database connection error:', err));

// Start monitoring services
async function startMonitoring() {
    console.log('🚀 Starting Crypto Wallet Monitor Bot...');
    
    // Initialize EVM tracker
    // const evmTracker = await startEVMTracker(bot);
    
    // Initialize Solana tracker
    // const solanaTracker = await startSolanaTracker(bot);
    
    console.log('✅ Bot is running...');
}

startMonitoring();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await mongoose.disconnect();
    process.exit(0);
});