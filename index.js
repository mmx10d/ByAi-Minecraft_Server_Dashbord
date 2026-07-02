// ========================================================
// 🚀 [ملف index.js الرئيسي المحدث - الجزء 1 من 2]
// النواة المركزية وخادم السوكيت المستقل ومستمع السجلات الحية
// ========================================================

const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');

console.log('========================================================');
console.log(' ⚡ [نظام النواة السحابي المطور - الذاكرة والقرص] يعمل... ');
console.log('========================================================');

// 1. تشغيل وإقلاع سيرفر ماين كرافت تلقائياً مع الموافقة على الـ EULA
minecraft.server.startServer();

// 2. إنشاء وتأمين خادم السوكيت المركزي المستقل (WebSocket Server) على المنفذ 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يستمع الآن بشكل مستقل على الرابط: ws://localhost:8080');

// 3. ربط مخرجات السيرفر الحية وإرسالها حياً لكل من يتصل بالسوكيت ولمحلل البيانات
minecraft.server.setLogListener((logLine) => {
  // تحديث قائمة اللاعبين والحالة حياً داخل ملف information.js
  minecraft.info.parseServerLog(logLine);

  // تحويل السجل إلى حزمة JSON موحدة لبثها فوراً
  const logPackage = JSON.stringify({
    type: 'LOG',
    data: logLine
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 تعني خط الاتصال مفتوح ومستقر (OPEN)
      client.send(logPackage);
    }
  });
});
// ========================================================
// 🚀 [ملف index.js الرئيسي المحدث - الجزء 2 من 2]
// معالج أحداث القوائم المتقدمة (JSON API) وجدولة النوم التلقائي
// ========================================================

// 4. الإنصات ومعالجة اتصالات واجهات الويب المستقلة والبوتات الخارجية حياً
wss.on('connection', (ws) => {
  console.log('[Socket Server]: تم اتصال متحكم مستقل جديد بنجاح.');

  // إرسال حزمة ترحيبية فورية للمتصفح لتأكيد نجاح الربط البرمجي
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected Successfully to Core Backend' }));

  // الإنصات للحزم والأوامر البرمجية (Actions) القادمة من الواجهات المستقلة
  ws.on('message', (message) => {
    try {
      // تفكيك حزمة الـ JSON القادمة من المتصفح أو البوتات
      const request = JSON.parse(message.toString());
      const { action, payload } = request;

      console.log(`[Action Request]: ${action}`);

      // تنفيذ الإجراء المناسب بناءً على طلب الواجهة المستقلة
      switch (action) {
        case 'START_SERVER':
          minecraft.server.startServer();
          break;
        case 'STOP_SERVER':
          minecraft.server.stopServer();
          break;
        case 'RESTART_SERVER':
          minecraft.server.restartServer();
          break;
        case 'MINECRAFT_COMMAND':
          // تنفيذ أي أمر مباشر داخل كونسل اللعبة
          minecraft.server.executeCommand(payload.command);
          break;
        case 'GET_HOST_STATS':
          // تجميع بيانات الجهاز الحية بالإضافة إلى القوائم الأربعة الجديدة من القرص
          ws.send(JSON.stringify({
            type: 'HOST_STATS',
            data: {
              status: minecraft.info.getServerStatus(),
              ram: minecraft.host.getRamUsage(),
              cpu: minecraft.host.getCpuUsage(),
              playersCount: minecraft.info.getOnlinePlayersList().length,
              playersOnline: minecraft.info.getOnlinePlayersList(),
              // ميزة القوائم الأربعة الحية الجديدة المقروءة من ملفات الـ JSON مباشرة
              opsList: minecraft.info.getOpsList(),
              whitelistList: minecraft.info.getWhitelistList(),
              bannedPlayersList: minecraft.info.getBannedPlayersList(),
              bannedIpsList: minecraft.info.getBannedIpsList()
            }
          }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action Request' }));
      }
    } catch (error) {
      // خيار احتياطي مرن: إذا أرسلت الواجهة نصاً عادياً، نفذه كأمر كونسل مباشر
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// 5. تشغيل نظام النوم الذكي (Scheduler) كل دقيقة لفحص خمول السيرفر وإطفائه لحفظ الموارد
setInterval(() => {
  minecraft.scheduler.checkServerIdle();
}, 60000);

// 6. تفعيل إدخال الأوامر يدوياً من Terminal الخاص بـ Node.js مباشرة للتحكم المحلي
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => {
  minecraft.server.executeCommand(line);
});
