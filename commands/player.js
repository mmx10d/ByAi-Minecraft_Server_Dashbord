// استيراد دالة تنفيذ الأوامر من ملف السيرفر الأساسي
const { executeCommand } = require('./server.js');

/**
 * دالة لحظر لاعب معين من دخول السيرفر باستخدام اسمه
 * @param {string} playerName - اسم اللاعب المراد حظره
 */
function bannedPlayer(playerName) {
  if (!playerName) {
    console.log('[Player Manager]: يرجى تحديد اسم اللاعب لتنفيذ أمر الحظر.');
    return;
  }
  console.log(`[Player Manager]: جاري حظر اللاعب ${playerName}...`);
  executeCommand(`ban ${playerName}`);
}

/**
 * دالة لحظر الآي بي (IP) الخاص باللاعب لمنعه من الدخول بحسابات أخرى
 * @param {string} playerName - اسم اللاعب المراد حظر عنوان الآي بي الخاص به
 */
function bannedIp(playerName) {
  if (!playerName) {
    console.log('[Player Manager]: يرجى تحديد اسم اللاعب لتنفيذ أمر حظر الآي بي.');
    return;
  }
  console.log(`[Player Manager]: جاري حظر آي بي اللاعب ${playerName}...`);
  executeCommand(`ban-ip ${playerName}`);
}

/**
 * دالة لطرد لاعب من السيرفر فوراً مع إمكانية كتابة سبب مخصص يظهر له
 * @param {string} playerName - اسم اللاعب المراد طرده
 * @param {string} reason - سبب الطرد (اختياري)
 */
function kickPlayer(playerName, reason = 'تم طردك من قبل إدارة السيرفر') {
  if (!playerName) {
    console.log('[Player Manager]: يرجى تحديد اسم اللاعب لتنفيذ أمر الطرد.');
    return;
  }
  console.log(`[Player Manager]: جاري طرد اللاعب ${playerName} بسبب: ${reason}`);
  executeCommand(`kick ${playerName} ${reason}`);
}

// تصدير الدوال البرمجية لتصبح جاهزة للاستخدام في المشروع
module.exports = {
  bannedPlayer,
  bannedIp,
  kickPlayer
};
