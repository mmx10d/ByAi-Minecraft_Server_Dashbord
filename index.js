const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');

console.log('=== [نظام إدارة ماين كرافت عبر Node.js & Sockets] ===');

// 1. تشغيل السيرفر تلقائياً والموافقة على الـ EULA مدمجة داخله
minecraft.server.startServer();

// 2. إنشاء خادم الـ Socket على منفذ مخصص (مثلاً 8080) للتحكم من الـ CMD أو أي كونسل خارجي
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يعمل حالياً على المنفذ: ws://localhost:8080');

// ربط مخرجات السيرفر الحية وإرسالها لكل من اتصل بالسوكيت و لمحلل البيانات الحية
minecraft.server.setLogListener((logLine) => {
  // 1. تمرير البيانات لمحلل معلومات اللاعبين والسيرفر الحالي
  minecraft.info.parseServerLog(logLine);

  // 2. بث الـ logs حياً لجميع أجهزة التحكم المتصلة عبر السوكيت
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 تعني OPEN
      client.send(logLine);
    }
  });
});

// التعامل مع اتصالات السوكيت القادمة (أوامر الـ CMD الخارجية)
wss.on('connection', (ws) => {
  console.log('[Socket Server]: تم اتصال متحكم خارجي جديد بالسيرفر.');
  ws.send('[System]: متصل بنجاح بكود التحكم التابع لماين كرافت!');

  ws.on('message', (message) => {
    const command = message.toString().trim();
    console.log(`[Socket Command Received]: ${command}`);

    // تنفيذ الأمر الممرر من السوكيت مباشرة داخل كونسل ماين كرافت
    minecraft.server.executeCommand(command);
  });
});

// إعداد كونسل الـ Terminal المحلي للجهاز الأساسي للتحكم الفوري أيضاً
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.on('line', (line) => {
  minecraft.server.executeCommand(line);
});
