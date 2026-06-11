const TelegramBot = require('node-telegram-bot-api');
const Wallet = require('./models/Wallet');
const { startEVMTracker } = require('./tracker/evm');
const { startSolanaTracker } = require('./tracker/solana');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Command: /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🚀 *Crypto Wallet Monitor Bot*

Saya akan memantau aktivitas wallet crypto Anda secara real-time!

📊 *Commands:*
/add <address> <chain> - Add wallet to monitor
/remove <address> - Remove wallet
/list - Show all monitored wallets
/check <address> - Check wallet balance
/help - Show all commands

Supported chains: ethereum, solana, bsc, polygon, tron
    `;
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Command: /add [address] [chain]
bot.onText(/\/add (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    const chain = match[2].toLowerCase();
    
    const validChains = ['ethereum', 'solana', 'bsc', 'polygon', 'tron'];
    if (!validChains.includes(chain)) {
        return bot.sendMessage(chatId, `❌ Chain tidak valid. Pilih: ${validChains.join(', ')}`);
    }
    
    try {
        const existing = await Wallet.findOne({ address, chain });
        if (existing) {
            return bot.sendMessage(chatId, `⚠️ Wallet ${address} sudah terdaftar di chain ${chain}`);
        }
        
        const newWallet = new Wallet({
            address,
            chain,
            addedBy: msg.from.id
        });
        
        await newWallet.save();
        bot.sendMessage(chatId, `✅ Wallet *${address}* berhasil ditambahkan di chain *${chain}*`, { parse_mode: 'Markdown' });
        
        // Langsung cek transaksi terbaru
        await checkInitialTransactions(chatId, address, chain);
    } catch (error) {
        bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
});

// Command: /list
bot.onText(/\/list/, async (msg) => {
    const chatId = msg.chat.id;
    const wallets = await Wallet.find({ isActive: true });
    
    if (wallets.length === 0) {
        return bot.sendMessage(chatId, '📭 Belum ada wallet yang dipantau.');
    }
    
    let message = '*📋 Daftar Wallet yang Dipantau:*\n\n';
    wallets.forEach((wallet, idx) => {
        const shortAddr = wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4);
        message += `${idx + 1}. *${shortAddr}* (${wallet.chain})\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Command: /check <address>
bot.onText(/\/check (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match[1];
    
    // Cari wallet di database
    const wallet = await Wallet.findOne({ address });
    if (!wallet) {
        return bot.sendMessage(chatId, `❌ Wallet ${address} tidak ditemukan. Gunakan /add untuk menambahkan.`);
    }
    
    bot.sendMessage(chatId, `🔍 *Memeriksa wallet ${address}...*`, { parse_mode: 'Markdown' });
    
    // Get balance berdasarkan chain
    const balance = await getBalance(address, wallet.chain);
    
    let message = `💰 *Wallet Information*\n\n`;
    message += `📌 Address: \`${address}\`\n`;
    message += `⛓️ Chain: ${wallet.chain}\n`;
    message += `💵 Balance: ${balance}\n`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Fungsi untuk mengirim notifikasi ke Telegram [citation:7]
async function sendNotification(chatId, activity) {
    const notification = `
🚨 *WALLET ACTIVITY DETECTED*

📌 Wallet: \`${activity.address}\`
⛓️ Chain: ${activity.chain}
📊 Type: ${activity.type}
💰 Amount: ${activity.amount}
🕐 Time: ${new Date(activity.timestamp).toLocaleString()}

🔗 [View on Explorer](${activity.explorerUrl})
    `;
    
    await bot.sendMessage(chatId, notification, { parse_mode: 'Markdown' });
}

module.exports = { bot, sendNotification };