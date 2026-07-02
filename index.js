const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');

console.log('=== [خادم الإدارة المرن الفائق التطور] ===');

// 1. تشغيل سيرفر ماين كرافت
minecraft.server.startServer();

// 2. إنشاء خادم السوكيت المركزي
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يعمل حالياً وجاهز للربط على ws://localhost:8080');

// بث الـ Logs الحية لجميع الواجهات المتصلة (React, Discord, إلخ)
minecraft.server.setLogListener((logLine) => {
  minecraft.info.parseServerLog(logLine); // تحديث معلومات اللاعبين حياً

  // إرسال السجلات بتنسيق JSON موحد لتسهيل قراءتها في الـ Frontend
  const logPackage = JSON.stringify({ type: 'LOG', data: logLine });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(logPackage);
    }
  });
});

// استقبال وتحليل الأوامر القادمة من البوتات أو واجهات الويب
wss.on('connection', (ws) => {
  console.log('[Socket]: متصل جديد انضم للتحكم (واجهة ويب / بوت).');
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected Successfully' }));

  ws.on('message', (message) => {
    try {
      // استقبال البيانات كـ JSON مرن
      const request = JSON.parse(message.toString());
      const { action, payload } = request;

      console.log(`[Action Received]: ${action}`);

      // تنفيذ الأوامر بناءً على رغبة الكلاينت (بوت/ويب)
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
          // تنفيذ أي أمر مباشر داخل اللعبة (مثل op, kick, say)
          minecraft.server.executeCommand(payload.command);
          break;
        case 'GET_HOST_STATS':
          // إرسال مواصفات الجهاز الحية فوراً للواجهة التي طلبتها
          ws.send(JSON.stringify({
            type: 'HOST_STATS',
            data: {
              ram: minecraft.host.getRamUsage(),
              cpu: minecraft.host.getCpuUsage(),
              status: minecraft.info.getServerStatus(),
              playersOnline: minecraft.info.getOnlinePlayersList()
            }
          }));
          break;
        case 'SET_GAMEMODE':
          minecraft.world.changeGamemode(payload.mode);
          break;
        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action' }));
      }
    } catch (error) {
      // في حال أرسل الكلاينت نصاً عادياً بدلاً من JSON، نعتبره أمراً مباشراً لماين كرافت لزيادة المرونة
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// كونسل الـ CMD المحلي للجهاز الأساسي
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => { minecraft.server.executeCommand(line); });
