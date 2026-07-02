// ========================================================
// 🎮 [ملف index.js الرئيسي - الجزء 1 من 2]
// النواة المركزية، الموافقة على الـ EULA، وإعداد خادم السوكيت المستقل
// ========================================================

const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');

console.log('========================================================');
console.log(' ⚡ [نظام النواة السحابي المستقل - Node.js Core] يعمل حالياً... ');
console.log('========================================================');

// 1. تشغيل وإقلاع سيرفر ماين كرافت (الموافقة على الـ EULA مدمجة بالداخل)
minecraft.server.startServer();

// 2. إنشاء وتكوين خادم السوكيت المركزي المستقل (WebSocket Server) على المنفذ 8080
// هذا الخادم سيعمل كـ API مستقل لاستقبال اتصالات الويب والبوتات عن بعد
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يستمع الآن بشكل مستقل على الرابط: ws://localhost:8080');

// 3. طباعة تقارير ومواصفات بيئة الاستضافة المحلية عند الإقلاع للترحيب بك
setTimeout(() => {
  console.log(`\n[Host System]: اسم جهاز الاستضافة: ${minecraft.host.getHostName()}`);
  console.log(`[Host System]: بيئة نظام التشغيل: ${minecraft.host.getFullHostName()}`);
  console.log(`[Host System]: منفذ اللعبة الافتراضي: ${minecraft.host.getPortNumber()}\n`);
}, 3000);
// ========================================================
// 🎮 [ملف index.js الرئيسي - الجزء 2 من 2]
// محرك بث السجلات، معالج أوامر الـ JSON، وجدولة النوم التلقائي
// ========================================================

// 4. ربط مخرجات السيرفر الحية وإرسالها حياً لكل من يتصل بالسوكيت ولمحلل البيانات
minecraft.server.setLogListener((logLine) => {
  // تحديث قائمة اللاعبين والحالة حياً داخل ملف information.js
  minecraft.info.parseServerLog(logLine);

  // تحويل السجل إلى حزمة JSON موحدة لتسهيل قراءتها وفلترتها في واجهة الويب المستقلة
  const logPackage = JSON.stringify({
    type: 'LOG',
    data: logLine
  });

  // بث السجلات حياً لجميع واجهات الويب والبوتات المتصلة حالياً بالسوكيت
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 تعني خط الاتصال مفتوح ومستقر (OPEN)
      client.send(logPackage);
    }
  });
});

// 5. التعامل مع اتصالات واجهات الويب المستقلة والبوتات الخارجية ومعالجة حزمها
wss.on('connection', (ws) => {
  console.log('[Socket Server]: تم اتصال لوحة تحكم مستقلة جديدة بنجاح.');

  // إرسال حزمة ترحيبية فورية للمتصفح لتأكيد نجاح الربط
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected Successfully to Core Backend' }));

  // الإنصات للحزم والأوامر البرمجية (Actions) القادمة من الواجهات المستقلة
  ws.on('message', (message) => {
    try {
      // تفكيك حزمة الـ JSON القادمة من المتصفح (script.js)
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
          // تنفيذ أي أمر مباشر داخل كونسل اللعبة (مثل op, kick)
          minecraft.server.executeCommand(payload.command);
          break;
        case 'GET_HOST_STATS':
          // تجميع بيانات الجهاز الحية وإعادتها فوراً للواجهة المستقلة لتحديث الشاشة
          ws.send(JSON.stringify({
            type: 'HOST_STATS',
            data: {
              status: minecraft.info.getServerStatus(),
              ram: minecraft.host.getRamUsage(),
              cpu: minecraft.host.getCpuUsage(),
              playersCount: minecraft.info.getOnlinePlayersList().length
            }
          }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action Request' }));
      }
    } catch (error) {
      // خيار احتياطي مرن: إذا أرسلت الواجهة نصاً عادياً، نفذه كأمر كونسل مباشر لماين كرافت
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// 6. تشغيل نظام النوم الذكي (Scheduler) كل دقيقة لفحص خمول السيرفر وإطفائه لحفظ الموارد
setInterval(() => {
  minecraft.scheduler.checkServerIdle();
}, 60000);

// 7. تفعيل إدخال الأوامر يدوياً من Terminal الخاص بـ Node.js مباشرة للتحكم المحلي
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => {
  minecraft.server.executeCommand(line);
});
