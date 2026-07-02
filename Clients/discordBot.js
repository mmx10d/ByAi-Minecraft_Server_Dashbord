const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' }); // قراءة ملف الإعدادات من المجلد الأب

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// الاتصال بسيرفر السوكيت المركزي
const ws = new WebSocket(process.env.SOCKET_URL);

client.once('ready', () => {
  console.log(`[Discord Bot]: تم التشغيل بنجاح باسم ${client.user.tag}`);

  // استقبال الـ Logs من السوكيت وبثها في ديسكورد حياً
  ws.on('message', (message) => {
    const response = JSON.parse(message.toString());
    if (response.type === 'LOG') {
      const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
      if (channel) {
        // إرسال السجل داخل حزمة كود ليكون منسقاً
        channel.send(`\`\`\`ansi\n${response.data}\n\`\`\``).catch(() => { });
      }
    }
  });
});

// استقبال الأوامر من شات ديسكورد وإرسالها لماين كرافت
client.on('messageCreate', (message) => {
  if (message.author.bot || message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

  // إذا كتب المستخدم !restart يقوم بعمل ريستارت كامل للسيرفر برمجياً
  if (message.content === '!restart') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    message.reply('🔄 جاري إعادة تشغيل السيرفر بالكامل...');
  } else {
    // إرسال النص كأمر مباشر للعبة
    ws.send(JSON.stringify({
      action: 'MINECRAFT_COMMAND',
      payload: { command: message.content }
    }));
  }
});

client.login(process.env.DISCORD_TOKEN);
