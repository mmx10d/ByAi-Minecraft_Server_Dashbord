const { spawn } = require('child_process');
const readline = require('readline');

// متغير لحفظ عملية السيرفر في الذاكرة
let serverProcess = null;

/**
 * دالة لتشغيل سيرفر ماين كرافت
 */
function startServer() {
  if (serverProcess) {
    console.log('[Minecraft]: السيرفر يعمل بالفعل حالياً!');
    return;
  }

  console.log('[Minecraft]: جاري تشغيل سيرفر ماين كرافت...');

  // تشغيل ملف paper.jar مع تخصيص الذاكرة العشوائية
  serverProcess = spawn('java', ['-Xmx2G', '-Xms2G', '-jar', 'paper.jar', 'nogui']);

  // قراءة مخرجات السيرفر وعرضها في الكونسل
  serverProcess.stdout.on('data', (data) => {
    console.log(`${data.toString().trim()}`);
  });

  // عرض الأخطاء في حال حدوثها
  serverProcess.stderr.on('data', (data) => {
    console.error(`[Minecraft ERROR]: ${data}`);
  });

  // التعامل مع إغلاق السيرفر مفاجئاً أو طبيعياً
  serverProcess.on('close', (code) => {
    console.log(`[Minecraft]: تم إغلاق السيرفر برمز الخروج: ${code}`);
    serverProcess = null;
  });
}

/**
 * دالة لإغلاق السيرفر بشكل آمن وحفظ العالم
 */
function stopServer() {
  if (!serverProcess) {
    console.log('[Minecraft]: لا يمكن الإغلاق، السيرفر مطفأ بالفعل.');
    return;
  }

  console.log('[Minecraft]: جاري إرسال أمر الإغلاق الآمن للمحافظة على البيانات...');
  executeCommand('stop');
}

/**
 * دالة لإعادة تشغيل السيرفر
 */
function restartServer() {
  console.log('[Minecraft]: جاري البدء في عملية إعادة التشغيل...');

  if (serverProcess) {
    stopServer();

    // الانتظار حتى يتوقف السيرفر تماماً قبل تشغيله مجدداً لتجنب أخطاء المنافذ
    const checkInterval = setInterval(() => {
      if (!serverProcess) {
        clearInterval(checkInterval);
        startServer();
      }
    }, 1000);
  } else {
    startServer();
  }
}

/**
 * دالة جوهرية لإرسال الأوامر المباشرة لكونسل السيرفر
 * ستستخدمها الملفات الأخرى مثل player.js و world.js
 */
function executeCommand(command) {
  if (serverProcess && serverProcess.stdin) {
    serverProcess.stdin.write(command + '\n');
  } else {
    console.log(`[Minecraft]: تعذر تنفيذ الأمر (${command}) لأن السيرفر لا يعمل حالياً.`);
  }
}

// إعداد إدخال الأوامر يدوياً من Terminal الخاص بـ Node.js مباشرة
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  executeCommand(line);
});

// تصدير الدوال البرمجية لتتمكن الملفات الأخرى من استدعائها
module.exports = {
  startServer,
  stopServer,
  restartServer,
  executeCommand
};
