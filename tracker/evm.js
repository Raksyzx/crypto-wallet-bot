const axios = require('axios');
const Moralis = require('moralis').default;

async function startEVMTracker(bot) {
    // Inisialisasi Moralis
    await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY
    });

    // Fungsi untuk cek transaksi wallet
    async function checkWalletTransactions(walletAddress, chain) {
        try {
            const response = await Moralis.EvmApi.transaction.getWalletTransactions({
                address: walletAddress,
                chain: chain,
                limit: 10
            });
            
            return response.raw.result;
        } catch (error) {
            console.error(`Error fetching transactions for ${walletAddress}:`, error);
            return [];
        }
    }

    // Monitor wallet dengan WebSocket (jika pakai Alchemy)
    const { WebSocket } = require('ws');
    // Implementasi WebSocket connection untuk real-time monitoring [citation:4]
    
    return { checkWalletTransactions };
}

module.exports = { startEVMTracker };