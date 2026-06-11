require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

// Koneksi database (hanya sekali)
let isDbConnected = false;
async function connectDB() {
  if (!isDbConnected) {
    await mongoose.connect(process.env.MONGODB_URL);
    isDbConnected = true;
    console.log('✅ Database connected');
  }
}

// Inisialisasi bot dengan Telegraf
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Command /start
bot.start(async (ctx) => {
  await connectDB();
  ctx.reply(
    `🚀 *Crypto Wallet Monitor Bot*\n\n` +
    `Monitor wallet crypto real-time!\n\n` +
    `📊 *Commands:*\n` +
    `/add <address> <chain> - Tambah wallet\n` +
    `/list - Lihat semua wallet\n` +
    `/remove <address> - Hapus wallet\n` +
    `/check <address> - Cek wallet\n` +
    `/help - Bantuan\n\n` +
    `⛓️ *Supported Chains:*\n` +
    `ethereum, solana, bsc, polygon, tron`,
    { parse_mode: 'Markdown' }
  );
});

// Command /help
bot.help(async (ctx) => {
  await connectDB();
  ctx.reply(
    `📚 *Bantuan Lengkap*\n\n` +
    `• /add 0x742d... ethereum - Tambah wallet ETH\n` +
    `• /add 5hAgc... solana - Tambah wallet SOL\n` +
    `• /list - Lihat semua wallet terdaftar\n` +
    `• /remove 0x742d... - Hapus wallet\n` +
    `• /check 0x742d... - Cek detail wallet\n` +
    `• /help - Tampilkan bantuan ini\n\n` +
    `🔗 *Blockchain Explorer:*\n` +
    `Ethereum: etherscan.io\n` +
    `Solana: solscan.io\n` +
    `BSC: bscscan.com`,
    { parse_mode: 'Markdown' }
  );
});

// Command /add
bot.command('add', async (ctx) => {
  await connectDB();
  const text = ctx.message.text;
  const parts = text.split(' ');
  
  if (parts.length < 3) {
    return ctx.reply('❌ Format salah!\n\nGunakan: `/add <address> <chain>`\n\nContoh:\n`/add 0x742d35Cc6634C0532925a3b44cC454e530e ethereum`', { parse_mode: 'Markdown' });
  }
  
  const address = parts[1];
  const chain = parts[2].toLowerCase();
  
  const validChains = ['ethereum', 'solana', 'bsc', 'polygon', 'tron'];
  if (!validChains.includes(chain)) {
    return ctx.reply(`❌ Chain tidak valid!\n\nPilih salah satu: ${validChains.join(', ')}`);
  }
  
  try {
    const existing = await Wallet.findOne({ address, chain, isActive: true });
    if (existing) {
      return ctx.reply(`⚠️ Wallet ${address.slice(0,10)}... sudah terdaftar di chain ${chain}`);
    }
    
    const wallet = new Wallet({
      address,
      chain,
      label: `${chain}_${address.slice(-6)}`,
      addedBy: ctx.from.id,
      addedAt: new Date()
    });
    
    await wallet.save();
    ctx.reply(`✅ *Wallet Berhasil Ditambahkan!*\n\n📌 Address: \`${address.slice(0,10)}...${address.slice(-6)}\`\n⛓️ Chain: ${chain}\n👤 Ditambahkan oleh: ${ctx.from.first_name}\n\n🔍 Bot akan memantau aktivitas wallet ini.`, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error adding wallet:', error);
    ctx.reply(`❌ Error: ${error.message}`);
  }
});

// Command /list
bot.command('list', async (ctx) => {
  await connectDB();
  const wallets = await Wallet.find({ isActive: true });
  
  if (wallets.length === 0) {
    return ctx.reply('📭 *Belum ada wallet yang dipantau.*\n\nGunakan `/add` untuk menambahkan wallet!', { parse_mode: 'Markdown' });
  }
  
  let message = '*📋 Daftar Wallet yang Dipantau:*\n\n';
  
  // Group by chain
  const grouped = {};
  wallets.forEach(w => {
    if (!grouped[w.chain]) grouped[w.chain] = [];
    grouped[w.chain].push(w);
  });
  
  for (const [chain, list] of Object.entries(grouped)) {
    message += `⛓️ *${chain.toUpperCase()}* (${list.length} wallet)\n`;
    list.forEach((w, i) => {
      const shortAddr = w.address.slice(0,8) + '...' + w.address.slice(-6);
      message += `   ${i+1}. \`${shortAddr}\`\n`;
    });
    message += '\n';
  }
  
  message += `📊 *Total:* ${wallets.length} wallet dipantau\n`;
  message += `💡 Gunakan \`/check <address>\` untuk melihat detail`;
  
  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Command /remove
bot.command('remove', async (ctx) => {
  await connectDB();
  const parts = ctx.message.text.split(' ');
  
  if (parts.length < 2) {
    return ctx.reply('❌ Format salah!\n\nGunakan: `/remove <address>`', { parse_mode: 'Markdown' });
  }
  
  const address = parts[1];
  
  const result = await Wallet.findOneAndUpdate(
    { address, isActive: true },
    { isActive: false, removedAt: new Date() }
  );
  
  if (result) {
    ctx.reply(`✅ *Wallet Dihapus!*\n\n📌 Address: \`${address.slice(0,10)}...\`\n⛓️ Chain: ${result.chain}\n\nWallet tidak akan dipantau lagi.`, { parse_mode: 'Markdown' });
  } else {
    ctx.reply(`❌ Wallet \`${address.slice(0,10)}...\` tidak ditemukan dalam daftar pemantauan.`, { parse_mode: 'Markdown' });
  }
});

// Command /check
bot.command('check', async (ctx) => {
  await connectDB();
  const parts = ctx.message.text.split(' ');
  
  if (parts.length < 2) {
    return ctx.reply('❌ Format salah!\n\nGunakan: `/check <address>`', { parse_mode: 'Markdown' });
  }
  
  const address = parts[1];
  
  const wallet = await Wallet.findOne({ address, isActive: true });
  if (!wallet) {
    return ctx.reply(`❌ Wallet \`${address.slice(0,10)}...\` tidak ditemukan.\n\nGunakan \`/add\` terlebih dahulu.`, { parse_mode: 'Markdown' });
  }
  
  // Placeholder untuk balance checking
  ctx.reply(
    `🔍 *Memeriksa Wallet...*\n\n` +
    `📌 Address: \`${address.slice(0,12)}...${address.slice(-8)}\`\n` +
    `⛓️ Chain: ${wallet.chain}\n` +
    `📅 Ditambahkan: ${wallet.addedAt.toLocaleDateString()}\n\n` +
    `💰 *Balance:* (Fitur dalam pengembangan)\n` +
    `⚡ *Recent Transactions:* (Fitur dalam pengembangan)\n\n` +
    `🔗 [Lihat di Explorer](${getExplorerUrl(wallet.chain, address)})`,
    { parse_mode: 'Markdown', disable_web_page_preview: true }
  );
});

// Helper function
function getExplorerUrl(chain, address) {
  const explorers = {
    ethereum: `https://etherscan.io/address/${address}`,
    solana: `https://solscan.io/account/${address}`,
    bsc: `https://bscscan.com/address/${address}`,
    polygon: `https://polygonscan.com/address/${address}`,
    tron: `https://tronscan.org/#/address/${address}`
  };
  return explorers[chain] || '#';
}

// Handler webhook untuk Vercel
export default async function handler(req, res) {
  try {
    await connectDB();
    await bot.handleUpdate(req.body, res);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ status: 'error', message: error.message });
  }
}

// Untuk development lokal (optional)
if (process.env.NODE_ENV !== 'production') {
  bot.launch();
}