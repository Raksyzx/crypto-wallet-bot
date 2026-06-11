const axios = require('axios');

async function startSolanaTracker(bot) {
    const HELIUS_API_URL = `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`;
    const HELIUS_WSS = `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

    // Fungsi untuk mendapatkan transaksi wallet [citation:6][citation:7]
    async function getSolanaTransactions(walletAddress) {
        try {
            const url = `${HELIUS_API_URL}&address=${walletAddress}`;
            const response = await axios.get(url);
            
            return response.data.map(tx => ({
                signature: tx.signature,
                timestamp: tx.timestamp,
                type: tx.type,
                source: tx.source,
                amount: tx.amount,
                from: tx.feePayer,
                tokenMovements: tx.tokenTransfers || [],
                description: tx.description
            }));
        } catch (error) {
            console.error(`Error fetching Solana transactions for ${walletAddress}:`, error);
            return [];
        }
    }

    // Monitor dengan WebSocket untuk real-time [citation:6]
    // const ws = new WebSocket(HELIUS_WSS);
    
    return { getSolanaTransactions };
}

module.exports = { startSolanaTracker };