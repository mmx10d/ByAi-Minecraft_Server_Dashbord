const mc = require('minecraft-protocol');
const infoManager = require('./information.js');
const serverManager = require('./server.js');
const hostManager = require('./host.js');

let idleTimeout = null;
let fakeServer = null;
const IDLE_LIMIT = 5 * 60 * 1000; // مدة الانتظار قبل النوم (5 دقائق كمثال)

/**
 * دالة لبدء مراقبة خمول السيرفر (تستدعى بانتظام من index.js)
 */
function checkServerIdle() {
  const onlinePlayers = infoManager.getOnlinePlayersList();
  const serverStatus = infoManager.getServerStatus();
  const port = hostManager.getPortNumber();

  // إذا كان السيرفر يعمل وحالته ONLINE ولكن لا يوجد أي لاعب
  if (serverStatus === 'ONLINE' && onlinePlayers.length === 0) {
    if (!idleTimeout && !fakeServer) {
      console.log(`[Smart System]: السيرفر فارغ. تم بدء عداد النوم التلقائي (5 دقائق)...`);

      idleTimeout = setTimeout(() => {
        console.log('[Smart System]: السيرفر يدخل في وضع النوم لحفظ الموارد تماماً...');

        // 1. إطفاء السيرفر الحقيقي الثقيل
        serverManager.stopServer();

        // 2. الانتظار حتى ينطفئ تماماً ثم تشغيل السيرفر الوهمي الذكي
        const checkShutdown = setInterval(() => {
          if (infoManager.getServerStatus() === 'OFFLINE') {
            clearInterval(checkShutdown);
            startFakeServer(port);
          }
        }, 1000);

      }, IDLE_LIMIT);
    }
  } else {
    // إذا دخل لاعب قبل انتهاء الـ 5 دقائق، نلغي العداد
    if (idleTimeout) {
      console.log('[Smart System]: دخل لاعب قبل النوم! تم إلغاء عداد النوم.');
      clearTimeout(idleTimeout);
      idleTimeout = null;
    }
  }
}

/**
 * تشغيل السيرفر الوهمي الخفيف لاستقبال اتصالات الإيقاظ
 */
function startFakeServer(port) {
  if (fakeServer) return;

  console.log(`[Smart Proxy]: تم تشغيل السيرفر الوهمي على البورت ${port} بنجاح.`);

  fakeServer = mc.createServer({
    'online-mode': false, // مكرك لكي يلقط اتصال أي لاعب فوراً
    host: '0.0.0.0',
    port: port,
    version: '1.20.4', // ضع إصدار سيرفرك هنا ليظهر للاعبين بشكل متوافق
    motd: '§aالسيرفر في وضع النوم §7- §eحاول الدخول لإيقاظه تلقائياً! ⚡',
    maxPlayers: 1
  });

  // عندما يحاول أي لاعب الدخول (إيقاظ السيرفر)
  fakeServer.on('login', (client) => {
    console.log(`[Smart Proxy]: محاولة دخول من اللاعب (${client.username}). جاري إيقاظ السيرفر الحقيقي...`);

    // إرسال رسالة توضيحية للاعب في اللعبة تخبره بانتظار الإقلاع
    client.end('§⚡ جاري تشغيل وإيقاظ السيرفر الحقيقي الآن...\n§eانتظر دقيقة واحدة ثم أعد الدخول مجدداً! 🎮');

    // إغلاق السيرفر الوهمي فوراً لتحرير البورت لماين كرافت الحقيقي
    fakeServer.close();
    fakeServer = null;
    idleTimeout = null;

    // تشغيل سيرفر ماين كرافت الحقيقي فوراً!
    console.log('[Smart System]: جاري تشغيل سيرفر ماين كرافت الحقيقي تلقائياً...');
    serverManager.startServer();
  });
}

module.exports = {
  checkServerIdle
};
