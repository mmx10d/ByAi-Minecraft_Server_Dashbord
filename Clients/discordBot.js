const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const ws = new WebSocket(process.env.SOCKET_URL);

client.once('ready', () => {
  console.log(`[Discord Bot]: جاهز ومستعد للعمل باسم ${client.user.tag}`);

  ws.on('message', (message) => {
    try {
      const response = JSON.parse(message.toString());
      // نقوم بالبث داخل روم ديسكورد فقط إذا كان نوع الحزمة LOG
      if (response.type === 'LOG') {
        const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        if (channel) {
          channel.send(`\`\`\`\n${response.data}\n\`\`\``).catch(() => { });
        }
      }
    } catch (e) {
      // تجاهل الأخطاء الناتجة عن حزم البيانات الأخرى مثل الإحصائيات
    }
  });
});

client.on('messageCreate', (message) => {
  if (message.author.bot || message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

  if (message.content === '!restart') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    message.reply('🔄 تم إرسال أمر إعادة التشغيل الكامل للسيفر المنظومي...');
  } else if (message.content === '!status') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));
  } else {
    // تمرير كأمر للعبة
    ws.send(JSON.stringify({
      action: 'MINECRAFT_COMMAND',
      payload: { command: message.content }
    }));
  }
});

client.login(process.env.DISCORD_TOKEN);
