const { Telegraf } = require('telegraf');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ws = new WebSocket(process.env.SOCKET_URL);

function isAdmin(ctx) {
  return ctx.from.id.toString() === process.env.TELEGRAM_ADMIN_ID;
}

bot.start((ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ الوصول مرفوض.');
  ctx.reply('🎮 لوحة تحكم ماين كرافت المحمولة عبر تلجرام جاهزة.\n\n/status - فحص شامل للموارد\n/stop - إيقاف آمن\n/start - تشغيل');
});

bot.command('status', (ctx) => {
  if (!isAdmin(ctx)) return;

  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  // مستمع مؤقت لتلقي حزمة البيانات المحددة وعرضها
  const handleStats = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        const { ram, cpu, status, playersOnline } = response.data;
        ctx.reply(`📊 **تقرير الخادم الحالي:**\n\n🟢 حالة السيرفر: ${status}\n📟 استهلاك المعالج: ${cpu}\n💾 استهلاك الرام: ${ram}\n👥 عدد اللاعبين المتواجدين: ${playersOnline.length}`);
        ws.off('message', handleStats); // فك الاستماع لتجنب التكرار
      }
    } catch (e) { }
  };

  ws.on('message', handleStats);
});

bot.command('stop', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
  ctx.reply('🛑 تم إرسال أمر الإيقاف الآمن لحفظ ملفات الخريطة.');
});

bot.command('start', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({ action: 'START_SERVER' }));
  ctx.reply('⚡ جاري بدء تشغيل عملية الجافا للسيرفر...');
});

bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: ctx.message.text }
  }));
  ctx.reply(`📥 نُفذ: ${ctx.message.text}`);
});

bot.launch();
console.log('[Telegram Bot]: يعمل بنجاح ومؤمن للأدمن فقط.');
