// ========================================================
// 🎮 [ملف server.js المستقر والمصلح - الجزء 1 من 2]
// إطلاق عملية الجافا، الموافقة على الـ EULA، وإدارة قنوات التدفق حياً
// ========================================================

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// تحديد مسار ملف تشغيل السيرفر ومجلد العمل المركزي
const jarPath = path.join(__dirname, '../paper.jar');
const serverDir = path.join(__dirname, '../');

let minecraftProcess = null;
let logListenerCallback = null;

/**
 * دالة مساعدة صارمة لفرض وتفعيل الموافقة الآلية على اتفاقية ماين كرافت eula.txt
 */
function ensureEulaAgreement() {
  const eulaFilePath = path.join(serverDir, 'eula.txt');
  try {
    if (fs.existsSync(eulaFilePath)) {
      let content = fs.readFileSync(eulaFilePath, 'utf8');
      if (!content.includes('eula=true')) {
        fs.writeFileSync(eulaFilePath, 'eula=true\n', 'utf8');
        console.log('[نواة التشغيل]: تم تعديل والموافقة على اتفاقية الـ EULA بنجاح حياً.');
      }
    } else {
      fs.writeFileSync(eulaFilePath, 'eula=true\n', 'utf8');
      console.log('[نواة التشغيل]: تم توليد والموافقة التلقائية على ملف eula.txt الجديد.');
    }
  } catch (error) {
    console.error('[نواة التشغيل ERROR]: فشل معالجة ملف eula.txt:', error);
  }
}

/**
 * دالة بدء وتشغيل السيرفر برمجياً وضخ عملية الجافا في الخلفية بسلام
 */
function startServer() {
  if (minecraftProcess) {
    console.log('[نواة التشغيل]: السيرفر يعمل بالفعل حالياً، لا يمكن إطلاقه مرتين.');
    return false;
  }

  // التأكد من الموافقة على الشروط أولاً قبل الإقلاع لمنع كراش الجافا الفوري
  ensureEulaAgreement();

  if (!fs.existsSync(jarPath)) {
    console.error(`🚨 [نظام التشغيل]: ملف السيرفر server.jar غير متواجد في المسار: ${jarPath}`);
    return false;
  }

  console.log('[نواة التشغيل]: جاري إطلاق وإيقاظ عملية الجافا السحابية لماين كرافت...');

  // تشغيل ملف الـ jar مع تخصيص الذاكرة الافتراضية المستقرة وإلغاء واجهة الـ GUI للويندوز
  minecraftProcess = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', jarPath, 'nogui'], {
    cwd: serverDir
  });

  // الإنصات لقناة المخرجات وتمرير الأسطر حياً لمحلل اللوغز والسوكيت
  minecraftProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) {
        console.log(trimmed); // طباعة السجل في الكونسيل المحلي للنواة
        if (logListenerCallback) {
          logListenerCallback(trimmed); // ضخ السطر للسوكيت المركزي فوراً
        }
      }
    });
  });

  // الإنصات لقناة الأخطاء لتفادي توقف الكور في الخلفية
  minecraftProcess.stderr.on('data', (data) => {
    console.error(`[Minecraft Process ERROR]: ${data.toString().trim()}`);
  });

  minecraftProcess.on('close', (code) => {
    console.log(`[نواة التشغيل]: تم إغلاق وإنهاء عملية ماين كرافت بالكامل برمز الخروج: ${code}`);
    minecraftProcess = null;
  });

  return true;
}
// ========================================================
// 🎮 [ملف server.js المستقر والمصلح - الجزء 2 من 2]
// أوامر الإيقاف الآمن، الريستارت الذكي، وتمرير مدخلات الأوامر
// ========================================================

/**
 * تنفيذ أمر كونسل مباشر وإرساله لعملية ماين كرافت حياً
 * @param {string} command - الأمر المراد تنفيذه (مثل say, kick, op)
 */
function executeCommand(command) {
  if (!minecraftProcess || !minecraftProcess.stdin) {
    console.log('[نواة التشغيل]: لا يمكن تنفيذ الأمر، السيرفر مطفأ أو عملية الجافا لم تبدأ بعد.');
    return false;
  }

  try {
    // ضخ الأمر النظيف داخل قناة المدخلات القياسية (stdin) لعملية الجافا
    minecraftProcess.stdin.write(`${command.trim()}\n`);
    return true;
  } catch (error) {
    console.error('[نواة التشغيل ERROR]: فشل ضخ الأمر في stdin:', error);
    return false;
  }
}

/**
 * إيقاف السيرفر بشكل آمن ومحكم للمحافظة على الخرائط والبيانات
 */
function stopServer() {
  if (!minecraftProcess) {
    console.log('[نواة التشغيل]: السيرفر مطفأ بالفعل حالياً.');
    return false;
  }

  console.log('[نواة التشغيل]: جاري إرسال أمر الإيقاف الآمن (stop) لحفظ العوالم...');
  executeCommand('stop');
  return true;
}

/**
 * إعادة تشغيل ذكية لحفظ البيانات وإنعاش منفذ الاستضافة
 */
function restartServer() {
  console.log('[نواة التشغيل]: جاري البدء في عملية إعادة التشغيل الذكية للمنظومة...');
  stopServer();

  // جدولة إقلاع السيرفر من جديد بعد 5 ثوانٍ تلقائياً لضمان تحرير المنفذ تماماً
  setTimeout(() => {
    console.log('[نواة التشغيل]: جاري المباشرة في عملية الإقلاع المتزامن بعد الريستارت...');
    startServer();
  }, 5000);

  return true;
}

/**
 * تعيين دالة الإنصات الحية لبث السجلات والسجلات القادمة حياً إلى ملف index.js
 */
function setLogListener(callback) {
  logListenerCallback = callback;
}

module.exports = {
  startServer,
  stopServer,
  restartServer,
  executeCommand,
  setLogListener
};
