// ========================================================
// ⏳ [ملف scheduler.js المصلح والمضمون - الجزء 1 من 2]
// تهيئة عدادات الخمول الذكية وفحص تواجد اللاعبين حياً
// ========================================================

const fs = require('fs');
const path = require('path');
const { executeCommand } = require('./server.js');
const { getOnlinePlayersList, getServerStatus } = require('./information.js');

// عداد الدقائق المتتالية التي قضاه السيرفر فارغاً بدون لاعبين
let idleMinutesCounter = 0;

// الحد الأقصى لدقائق الخمول قبل إغلاق السيرفر تلقائياً (مثال: 5 دقائق)
const MAX_IDLE_MINUTES = parseInt(process.env.SERVER_MAX_IDLE_MINUTES, 10) || 5;

/**
 * دالة داخلية مصلحة وآمنة تماماً لجلب رقم منفذ السيرفر (Port) دون الاعتماد على موديولات خارجية
 * تقرأ البورت من ملف الـ .env أولاً، وإذا لم يوجد ترتد للمنفذ القياسي لماين كرافت 25565
 */
function getMinecraftServerPortSecure() {
  const envPort = process.env.MINECRAFT_PORT || process.env.SERVER_PORT;
  if (envPort) {
    const parsedPort = parseInt(envPort, 10);
    if (!isNaN(parsedPort)) return parsedPort;
  }

  // الارتداد الآمن للمنفذ الافتراضي القياسي لماين كرافت
  return 25565;
}
// ========================================================
// ⏳ [ملف scheduler.js المصلح والمضمون - الجزء 2 من 2]
// الدالة الدورية checkServerIdle لتفعيل النوم الآلي وحفظ الملفات
// ========================================================

/**
 * الدالة المركزية المصلحة تماماً والتي يستدعيها ملف index.js كل دقيقة
 * لفحص خمول الخادم وإطفائه تلقائياً في حال خروج كافة اللاعبين
 */
function checkServerIdle() {
  try {
    // إذا كان السيرفر مطفأً بالفعل، نقوم بتصفير العداد والخروج فورا لعدم استهلاك الموارد
    if (getServerStatus() !== 'ONLINE') {
      idleMinutesCounter = 0;
      return;
    }

    const currentOnlinePlayers = getOnlinePlayersList() || [];
    const portNumber = getMinecraftServerPortSecure();

    // 1. في حال وجود لاعبين داخل عوالم اللعبة، نقوم بتصفير عداد الخمول
    if (currentOnlinePlayers.length > 0) {
      idleMinutesCounter = 0;
      return;
    }

    // 2. في حال كان السيرفر يعمل ولكنه فارغ تماماً، نقوم بزيادة العداد دقيقة واحدة
    idleMinutesCounter++;
    console.log(`[نظام النوم الذكي]: السيرفر فارغ على المنفذ (${portNumber}). دقيقة خمول متتالية: ${idleMinutesCounter}/${MAX_IDLE_MINUTES}`);

    // 3. إذا وصل عداد الخمول إلى الحد الأقصى المصرح به، يتم تنفيذ الإغلاق الآمن فوراً
    if (idleMinutesCounter >= MAX_IDLE_MINUTES) {
      console.log(`🚨 [نظام النوم الذكي]: تم بلوغ الحد الأقصى للخمول (${MAX_IDLE_MINUTES} دقائق). جاري إغلاق السيرفر لحفظ موارد الاستضافة...`);

      // إرسال أمر كونسل رسمي فوري لحفظ الخريطة وإيقاف الجافا بسلام
      executeCommand('say [النظام]: جاري إدخال السيرفر في وضع النوم الآلي لعدم تواجد لاعبين...');
      executeCommand('stop');

      // تصفير العداد لتهيئة الدورة القادمة عند استيقاظ الخادم
      idleMinutesCounter = 0;
    }
  } catch (error) {
    console.error('[نظام النوم الذكي ERROR]: حدث خطأ أثناء فحص خمول السيرفر:', error);
  }
}

// تصفير العداد يدوياً عند رصد دخول لاعب جديد لضمان استقرار المزامنة حياً
function resetIdleCounter() {
  idleMinutesCounter = 0;
}

// تصدير دالة الفحص الدورية لربطها بملف index.js بنجاح تام
module.exports = {
  checkServerIdle,
  resetIdleCounter
};
