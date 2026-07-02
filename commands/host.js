const os = require('os');
const fs = require('fs');
const path = require('path');

// مسار ملف الخصائص لقراءة المنفذ (Port)
const propertiesPath = path.join(__dirname, '../server.properties');

/**
 * جلب الاسم الكامل لجهاز الاستضافة ونظام التشغيل المضيف
 * @returns {string} مثال: Windows 10 Pro / Linux 5.4
 */
function getFullHostName() {
  return `${os.type()} ${os.release()} (${os.arch()})`;
}

/**
 * جلب اسم الكمبيوتر المحلي (Host Name) المعرف على شبكة الاتصال
 * @returns {string}
 */
function getHostName() {
  return os.hostname();
}

/**
 * قراءة المنفذ (Port) المحجوز لسيرفر ماين كرافت من ملف الإعدادات
 * @returns {number} المنفذ الافتراضي هو 25565
 */
function getPortNumber() {
  if (!fs.existsSync(propertiesPath)) {
    return 25565; // المنفذ الافتراضي للعبة
  }
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    for (let line of lines) {
      if (line.trim().startsWith('server-port=')) {
        return parseInt(line.split('=')[1].trim(), 10) || 25565;
      }
    }
  } catch (error) {
    console.error('[Host Manager ERROR]: فشل قراءة رقم البورت:', error);
  }
  return 25565;
}

/**
 * استخراج إصدار السيرفر التقريبي من خلال ملف النواة التنفيذي
 * @returns {string}
 */
function getVersion() {
  // بما أن الملف يسمى paper.jar، يمكننا الإشارة إلى النواة المستخدمة
  return "Paper / Spigot (محددة في paper.jar)";
}

/**
 * جلب نوع برمجيات الخادم
 * @returns {string}
 */
function getSoftware() {
  return "Java Edition (Node.js Managed)";
}

/**
 * حساب النسبة المئوية لاستهلاك الذاكرة العشوائية (RAM) الإجمالية للجهاز حالياً
 * @returns {string} مثال: 45.50%
 */
function getRamUsage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercentage = (usedMemory / totalMemory) * 100;
  return `${usagePercentage.toFixed(2)}%`;
}

/**
 * جلب متوسط الضغط واستهلاك المعالج (CPU Load)
 * ملاحظة: os.loadavg في نظام ويندوز يعود دائماً بـ، لكنه يعمل بدقة فائقة على أنظمة لينكس وسيرفرات الاستضافة
 * @returns {string}
 */
function getCpuUsage() {
  const loads = os.loadavg();
  // جلب متوسط استهلاك المعالج في آخر دقيقة
  return `${(loads[0] * 10).toFixed(2)}%`;
}

// تصدير الدوال البرمجية
module.exports = {
  getFullHostName,
  getHostName,
  getPortNumber,
  getVersion,
  getSoftware,
  getRamUsage,
  getCpuUsage
};
