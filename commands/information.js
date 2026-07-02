const { executeCommand } = require('./server.js');
const fs = require('fs');
const path = require('path');

// مسار ملف خصائص السيرفر لجلب الحد الأقصى للاعبين
const propertiesPath = path.join(__dirname, '../server.properties');

// متغيرات داخلية لتخزين البيانات المستخرجة حياً
let isServerOnline = false;
let onlinePlayersList = [];

/**
 * دالة مساعدة يتم استدعاؤها من ملف index.js لتحديث حالة السيرفر واللاعبين بناءً على مخرجات الكونسل
 * @param {string} logLine - السطر القادم من مخرجات السيرفر (stdout)
 */
function parseServerLog(logLine) {
  // التحقق مما إذا كان السيرفر قد انتهى من الإقلاع تماماً
  if (logLine.includes('Done') && logLine.includes('For help, type "help"')) {
    isServerOnline = true;
  }

  // التحقق مما إذا تم إغلاق السيرفر
  if (logLine.includes('Closing Server') || logLine.includes('Stopping server')) {
    isServerOnline = false;
    onlinePlayersList = [];
  }

  // رصد دخول اللاعبين (مثال: PlayerName joined the game)
  if (logLine.includes('joined the game')) {
    const parts = logLine.split(' ');
    // استخراج اسم اللاعب (يكون عادةً قبل كلمة joined)
    const joinedIndex = parts.indexOf('joined');
    if (joinedIndex > 0) {
      const playerName = parts[joinedIndex - 1].replace(/\[.*\]/g, '').trim(); // تنظيف الاسم من الأقواس إن وجدت
      if (!onlinePlayersList.includes(playerName)) {
        onlinePlayersList.push(playerName);
      }
    }
  }

  // رصد خروج اللاعبين (مثال: PlayerName left the game)
  if (logLine.includes('left the game')) {
    const parts = logLine.split(' ');
    const leftIndex = parts.indexOf('left');
    if (leftIndex > 0) {
      const playerName = parts[leftIndex - 1].replace(/\[.*\]/g, '').trim();
      onlinePlayersList = onlinePlayersList.filter(name => name !== playerName);
    }
  }
}

/**
 * دالة لمعرفة حالة السيرفر الحالية
 * @returns {string} - حالة السيرفر (ONLINE / OFFLINE)
 */
function getServerStatus() {
  return isServerOnline ? 'ONLINE' : 'OFFLINE';
}

/**
 * دالة لجلب الحد الأقصى للاعبين المسموح به من ملف الإعدادات
 * @returns {number} - العدد الأقصى للاعبين
 */
function getTotalPlayers() {
  if (!fs.existsSync(propertiesPath)) {
    return 20; // العدد الافتراضي لماين كرافت إذا لم يوجد الملف بعد
  }

  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    for (let line of lines) {
      if (line.trim().startsWith('max-players=')) {
        return parseInt(line.split('=')[1].trim(), 10) || 20;
      }
    }
  } catch (error) {
    console.error('[Information Manager ERROR]: فشل قراءة الحد الأقصى للاعبين:', error);
  }
  return 20;
}

/**
 * دالة لجلب مصفوفة بأسماء اللاعبين المتصلين حالياً بالسيرفر
 * @returns {Array<string>} - قائمة بأسماء اللاعبين أونلاين
 */
function getOnlinePlayersList() {
  // إذا كنت تريد إجبار السيرفر على تحديث القائمة يدوياً، يمكنك إرسال أمر list للكونسل
  // ولكن المصفوفة الحية التي نرصدها من الدخول والخروج أسرع وأكفأ.
  return onlinePlayersList;
}

// تصدير الدوال البرمجية
module.exports = {
  parseServerLog,
  getServerStatus,
  getTotalPlayers,
  getOnlinePlayersList
};
