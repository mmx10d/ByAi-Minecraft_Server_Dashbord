// ========================================================
// ⚙️ [ملف information.js المصلح - الجزء 1 من 2]
// مسارات النظام، تنظيف فلاتر الألوان، وحالة السيرفر العامة
// ========================================================

const fs = require('fs');
const path = require('path');

// تحديد المسارات لملفات إعدادات ماين كرافت
const propertiesPath = path.join(__dirname, '../server.properties');
const opsPath = path.join(__dirname, '../ops.json');
const whitelistPath = path.join(__dirname, '../whitelist.json');
const bannedPlayersPath = path.join(__dirname, '../banned-players.json');
const bannedIpsPath = path.join(__dirname, '../banned-ips.json');

let isServerOnline = false;
let onlinePlayersList = [];

/**
 * دالة مساعدة لتنظيف مخرجات الكونسل من أكواد الألوان (ANSI Escape Codes)
 * لمنع تداخل أرقام الألوان مع أسماء اللاعبين
 */
function cleanAnsiCodes(text) {
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=]/g, '');
}

/**
 * دالة داخلية لقراءة ملفات الـ JSON الخاصة بماين كرافت وتحليلها بأمان من القرص
 */
function readMinecraftJson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return [];
    const parsed = JSON.parse(content);

    return parsed.map(entry => {
      if (typeof entry === 'object') {
        return entry.name || entry.ip || entry.target || 'مجهول';
      }
      return entry;
    });
  } catch (error) {
    console.error(`[Smart Information ERROR]: فشل قراءة الملف ${path.basename(filePath)}:`, error);
    return [];
  }
}
// ========================================================
// ⚙️ [ملف information.js المصلح - الجزء 2 من 2]
// محرك الـ RegEx الصارم لاستخراج الاسم الصافي وتصدير الدوال الحية
// ========================================================

/**
 * دالة ذكية ومصلحة بالكامل تعتمد على الـ RegEx الصارم لالتقاط أسماء اللاعبين النظيفة
 * @param {string} rawLogLine - السطر الخام القادم من كونسل السيرفر
 */
function parseServerLog(rawLogLine) {
  // 1. تنظيف السطر تماماً من أي أكواد تلوين ANSI قد تلتصق بالأسماء
  const logLine = cleanAnsiCodes(rawLogLine);

  // 2. فحص وتحديث حالة السيرفر العامة
  if (logLine.includes('Done') && logLine.includes('For help, type "help"')) {
    isServerOnline = true;
  }
  if (logLine.includes('Closing Server') || logLine.includes('Stopping server')) {
    isServerOnline = false;
    onlinePlayersList = [];
  }

  // 3. رصد دخول اللاعبين عبر نمط RegEx صارم (يبحث عن الحروف والأرقام الصافية فقط قبل العبارة المحددة)
  if (logLine.includes('joined the game')) {
    const joinMatch = logLine.match(/([a-zA-Z0-9_]+)\s+joined the game/);
    if (joinMatch && joinMatch[1]) {
      const playerName = joinMatch[1].trim();
      if (!onlinePlayersList.includes(playerName)) {
        onlinePlayersList.push(playerName);
        console.log(`[Smart Tracker]: تم رصد دخول اللاعب بالاسم الصافي: ${playerName}`);
      }
    }
  }

  // 4. رصد خروج اللاعبين عبر نمط RegEx صارم
  if (logLine.includes('left the game')) {
    const leaveMatch = logLine.match(/([a-zA-Z0-9_]+)\s+left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const playerName = leaveMatch[1].trim();
      onlinePlayersList = onlinePlayersList.filter(name => name !== playerName);
      console.log(`[Smart Tracker]: تم رصد خروج اللاعب بالاسم الصافي: ${playerName}`);
    }
  }
}

/**
 * دالة لمعرفة حالة السيرفر الحالية
 */
function getServerStatus() {
  return isServerOnline ? 'ONLINE' : 'OFFLINE';
}

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
    console.error('[Information Manager ERROR]:', error);
  }
  return 20;
}

/**
 * دالة إرجاع قائمة اللاعبين المتصلين حياً بالاسم الصافي
 */
function getOnlinePlayersList() {
  return onlinePlayersList;
}

/**
 * جلب قائمة الأدمنية والمسؤولين (OP) من ملف ops.json
 */
function getOpsList() {
  return readMinecraftJson(opsPath);
}

/**
 * جلب قائمة اللاعبين المدرجين في القائمة البيضاء (Whitelist)
 */
function getWhitelistList() {
  return readMinecraftJson(whitelistPath);
}

/**
 * جلب قائمة اللاعبين المحظورين (Banned Players)
 */
function getBannedPlayersList() {
  return readMinecraftJson(bannedPlayersPath);
}

/**
 * جلب قائمة عناوين الآي بي المحظورة (Banned IPs)
 */
function getBannedIpsList() {
  return readMinecraftJson(bannedIpsPath);
}

// تصدير واجهة الدوال المحدثة لتغذية النواة والكلاينتس
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
