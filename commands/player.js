// ========================================================
// 👥 [ملف player.js المستقر والمصلح كلياً - نظام العقوبات]
// ========================================================

const { executeCommand } = require('./server.js');

/**
 * طرد لاعب خارج السيرفر فوراً مع كتابة سبب مخصص
 * @param {string} playerName - اسم اللاعب الصافي
 * @param {string} reason - سبب الطرد
 */
function kickPlayer(playerName, reason = 'تم طردك بواسطة لوحة الإدارة السحابية') {
  if (!playerName) return false;
  return executeCommand(`kick ${playerName.trim()} ${reason}`);
}

/**
 * حظر لاعب نهائياً بالاسم (Ban) لمنعه من الدخول
 * @param {string} playerName - اسم اللاعب الصافي
 * @param {string} reason - سبب الحظر
 */
function banPlayer(playerName, reason = 'تم حظرك نهائياً من دخول هذا السيرفر') {
  if (!playerName) return false;
  return executeCommand(`ban ${playerName.trim()} ${reason}`);
}

/**
 * فك الحظر عن لاعب (Pardon) للسماح له بالدخول مجدداً
 * @param {string} playerName - اسم اللاعب
 */
function pardonPlayer(playerName) {
  if (!playerName) return false;
  return executeCommand(`pardon ${playerName.trim()}`);
}

/**
 * حظر عنوان آي بي رقمي (IP Ban) لمنع دخول كافة حسابات المعتدي
 * @param {string} ipAddress - عنوان الآي بي الرقمي
 */
function banIp(ipAddress) {
  if (!ipAddress) return false;
  return executeCommand(`ban-ip ${ipAddress.trim()}`);
}

/**
 * فk الحظر عن عنوان آي بي رقمي معين
 * @param {string} ipAddress - عنوان الآي بي
 */
function pardonIp(ipAddress) {
  if (!ipAddress) return false;
  return executeCommand(`pardon-ip ${ipAddress.trim()}`);
}

/**
 * ترفيع لاعب ومنحه رتبة مسؤول كونسل اللعبة الكاملة (OP)
 * @param {string} playerName - اسم اللاعب
 */
function opPlayer(playerName) {
  if (!playerName) return false;
  return executeCommand(`op ${playerName.trim()}`);
}

/**
 * تجريد لاعب وسحب رتبة المسؤول (De-OP) منه حياً
 * @param {string} playerName - اسم اللاعب
 */
function deopPlayer(playerName) {
  if (!playerName) return false;
  return executeCommand(`deop ${playerName.trim()}`);
}

/**
 * إضافة لاعب إلى القائمة البيضاء (Whitelist)
 * @param {string} playerName - اسم اللاعب
 */
function addWhitelist(playerName) {
  if (!playerName) return false;
  return executeCommand(`whitelist add ${playerName.trim()}`);
}

/**
 * إزالة لاعب وحذفه من القائمة البيضاء
 * @param {string} playerName - اسم اللاعب
 */
function removeWhitelist(playerName) {
  if (!playerName) return false;
  return executeCommand(`whitelist remove ${playerName.trim()}`);
}

module.exports = {
  kickPlayer,
  banPlayer,
  pardonPlayer,
  banIp,
  pardonIp,
  opPlayer,
  deopPlayer,
  addWhitelist,
  removeWhitelist
};
