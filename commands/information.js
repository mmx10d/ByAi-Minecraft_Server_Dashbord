// ========================================================
// ⚙️ [ملف information.js المطور - الجزء 1 من 2]
// مسارات النظام، تحليل ملفات JSON الحية للاعبين من القرص، وحالة السيرفر
// ========================================================

const fs = require('fs');
const path = require('path');

// تحديد المسارات الصارمة لملفات إعدادات ماين كرافت الرئيسية في المجلد الرئيسي
const propertiesPath = path.join(__dirname, '../server.properties');
const opsPath = path.join(__dirname, '../ops.json');
const whitelistPath = path.join(__dirname, '../whitelist.json');
const bannedPlayersPath = path.join(__dirname, '../banned-players.json');
const bannedIpsPath = path.join(__dirname, '../banned-ips.json');

// متغيرات الذاكرة الحية المؤقتة
let isServerOnline = false;
let onlinePlayersList = [];

/**
 * دالة مساعدة داخلية لقراءة ملفات الـ JSON الخاصة بماين كرافت وتحليلها بأمان من القرص
 */
function readMinecraftJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return [];
    const parsed = JSON.parse(content);

    // ملف ops.json يحتوي على كائنات بداخلها حقل name، بينما الآخرين قد يختلفون
    return parsed.map(entry => {
      if (typeof entry === 'object') {
        return entry.name || entry.ip || entry.target || 'مجهول';
      }
      return entry;
    });
  } catch (error) {
    console.error(`[Smart Information ERROR]: فشل قراءة أو تحليل الملف ${path.basename(filePath)}:`, error);
    return [];
  }
}

/**
 * دالة ذكية جداً تعتمد على الـ RegEx لتحليل الكونسل ورصد اللاعبين بدقة عند الدخول والخروج حياً
 */
function parseServerLog(logLine) {
  if (logLine.includes('Done') && logLine.includes('For help, type "help"')) {
    isServerOnline = true;
  }
  if (logLine.includes('Closing Server') || logLine.includes('Stopping server')) {
    isServerOnline = false;
    onlinePlayersList = [];
  }

  // فحص رصد دخول اللاعبين عبر النمط العالمي الصارم
  if (logLine.includes('joined the game')) {
    const joinMatch = logLine.match(/([a-zA-Z0-9_]+)\s+joined the game/);
    if (joinMatch && joinMatch[1]) {
      const playerName = joinMatch[1].trim();
      if (!onlinePlayersList.includes(playerName)) {
        onlinePlayersList.push(playerName);
        console.log(`[Smart Tracker]: تم رصد دخول حقيقي للاعب: ${playerName}`);
      }
    }
  }

  // فحص رصد خروج اللاعبين عبر النمط العالمي الصارم
  if (logLine.includes('left the game')) {
    const leaveMatch = logLine.match(/([a-zA-Z0-9_]+)\s+left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const playerName = leaveMatch[1].trim();
      onlinePlayersList = onlinePlayersList.filter(name => name !== playerName);
      console.log(`[Smart Tracker]: تم رصد خروج حقيقي للاعب: ${playerName}`);
    }
  }
}

/**
 * دالة لمعرفة حالة السيرفر الحالية
 */
function getServerStatus() {
  return isServerOnline ? 'ONLINE' : 'OFFLINE';
}
// ========================================================
// ⚙️ [ملف information.js المطور - الجزء 2 من 2]
// دوال تصدير القوائم الأربعة الحية (OP, Whitelist, Ban, Ban-IP) والتصدير العام
// ========================================================

/**
 * دالة لجلب الحد الأقصى للاعبين المسموح به من ملف server.properties
 */
function getTotalPlayers() {
  if (!fs.existsSync(propertiesPath)) return 20;
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    for (let line of lines) {
      if (line.trim().startsWith('max-players=')) {
        const parts = line.split('=');
        return parseInt(parts[1].trim(), 10) || 20;
      }
    }
  } catch (error) {
    console.error('[Information Manager ERROR]: فشل قراءة الحد الأقصى للاعبين:', error);
  }
  return 20;
}

/**
 * دالة إرجاع قائمة اللاعبين المتصلين حياً حالياً بالسيرفر
 * @returns {Array<string>} مصفوفة بأسماء اللاعبين أونلاين
 */
function getOnlinePlayersList() {
  return onlinePlayersList;
}

/**
 * ميزة جديدة: جلب قائمة الأدمنية والمسؤولين الذين يمتلكون رتبة (OP)
 * @returns {Array<string>} مصفوفة بأسماء الأدمنية
 */
function getOpsList() {
  return readMinecraftJson(opsPath);
}

/**
 * ميزة جديدة: جلب قائمة اللاعبين المدرجين في القائمة البيضاء (Whitelist)
 * @returns {Array<string>} مصفوفة بأسماء اللاعبين في الوايت لست
 */
function getWhitelistList() {
  return readMinecraftJson(whitelistPath);
}

/**
 * ميزة جديدة: جلب قائمة اللاعبين المحظورين نهائياً من السيرفر (Banned Players)
 * @returns {Array<string>} مصفوفة بأسماء اللاعبين المحظورين
 */
function getBannedPlayersList() {
  return readMinecraftJson(bannedPlayersPath);
}

/**
 * ميزة جديدة: جلب قائمة عناوين الآي بي المحظورة من السيرفر (Banned IPs)
 * @returns {Array<string>} مصفوفة بعناوين الآي بي المحظورة
 */
function getBannedIpsList() {
  return readMinecraftJson(bannedIpsPath);
}

// تصدير واجهة الدوال البرمجية بالكامل لتغذية النواة والكلاينتس
module.exports = {
  parseServerLog,
  getServerStatus,
  getTotalPlayers,
  getOnlinePlayersList,
  getOpsList,
  getWhitelistList,
  getBannedPlayersList,
  getBannedIpsList
};
