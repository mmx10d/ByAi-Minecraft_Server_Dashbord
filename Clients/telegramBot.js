const { Telegraf } = require('telegraf');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ws = new WebSocket(process.env.SOCKET_URL);

// دالة حماية للتأكد من أن المرسل هو الأدمن فقط
function isAdmin(ctx) {
  return ctx.from.id.toString() === process.env.TELEGRAM_ADMIN_ID;
}

bot.start((ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ غير مسموح لك باستخدام هذا البوت.');
  ctx.reply('🎮 مرحباً بك في بوت إدارة ماين كرافت!\n\nالأوامر المتاحة:\n/status - فحص حالة السيرفر والموارد\n/stop - إيقاف السيرفر آمن\n/start - تشغيل السيرفر');
});

bot.command('status', (ctx) => {
  if (!isAdmin(ctx)) return;

  // طلب الإحصائيات من السوكيت
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  // استقبال الرد لمرة واحدة وعرضه للمستخدم
  ws.once('message', (message) => {
    const response = JSON.parse(message.toString());
    if (response.type === 'HOST_STATS') {
      const { ram, cpu, status, playersOnline } = response.data;
      ctx.reply(`📊 **حالة الخادم الحية:**\n\n🟢 الحالة: ${status}\n📟 استهلاك المعالج: ${cpu}\n💾 استهلاك الرام: ${ram}\n👥 اللاعبين أونلاين: ${playersOnline.length}`);
    }
  });
});

bot.command('stop', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
  ctx.reply('🛑 جاري إرسال أمر الإيقاف الآمن لحفظ البيانات...');
});

bot.command('start', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({ action: 'START_SERVER' }));
  ctx.reply('⚡ جاري تشغيل السيرفر...');
});

// استقبال الرسائل النصية العادية كأوامر مباشرة لكونسل ماين كرافت
bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: ctx.message.text }
  }));
  ctx.reply(`📥 تم إرسال الأمر: ${ctx.message.text}`);
});

bot.launch();
console.log('[Telegram Bot]: البوت يعمل الآن بنجاح ومستعد لاستقبال الأوامر.');
