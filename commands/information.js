// ========================================================
// ⚙️ [ملف information.js النظيف والمصلح - الجزء 1 من 2]
// مسارات القرص، فلاتر الألوان، وقراءة الـ JSON وحالة السيرفر العامة
// ========================================================

const fs = require('fs');
const path = require('path');

// تحديد مسارات ملفات الحماية والإعدادات الرئيسية لماين كرافت
const propertiesPath = path.join(__dirname, '../server.properties');
const opsPath = path.join(__dirname, '../ops.json');
const whitelistPath = path.join(__dirname, '../whitelist.json');
const bannedPlayersPath = path.join(__dirname, '../banned-players.json');
const bannedIpsPath = path.join(__dirname, '../banned-ips.json');

// مسارات ملفات بيانات إنجازات وإحصائيات اللاعبين المتقدمة
const statsDirectory = path.join(__dirname, '../world/stats');
const advancementsDirectory = path.join(__dirname, '../world/advancements');
const userCachePath = path.join(__dirname, '../usercache.json');

let isServerOnline = false;
let onlinePlayersList = [];

/**
 * دالة مساعدة لتنظيف مخرجات الكونسل من أكواد الألوان (ANSI Escape Codes)
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

/**
 * محرك الـ RegEx الصارم والمصلح لرصد اللاعبين بدقة عند الدخول والخروج حياً ومنع الأرقام الزائدة
 */
function parseServerLog(rawLogLine) {
  const logLine = cleanAnsiCodes(rawLogLine);

  if (logLine.includes('Done') && logLine.includes('For help, type "help"')) {
    isServerOnline = true;
  }
  if (logLine.includes('Closing Server') || logLine.includes('Stopping server')) {
    isServerOnline = false;
    onlinePlayersList = [];
  }

  // لقط الدخول بالاسم الصافي الصحيح التام من الكونسل
  if (logLine.includes('joined the game')) {
    const joinMatch = logLine.match(/([a-zA-Z0-9_]+)\s+joined the game/);
    if (joinMatch && joinMatch[1]) {
      const playerName = joinMatch[1].trim();
      if (!onlinePlayersList.includes(playerName)) {
        onlinePlayersList.push(playerName);
        console.log(`[Smart Tracker]: تم رصد دخول لاعب صافي: ${playerName}`);
      }
    }
  }

  // لقط الخروج بالاسم الصافي الصحيح التام من الكونسل
  if (logLine.includes('left the game')) {
    const leaveMatch = logLine.match(/([a-zA-Z0-9_]+)\s+left the game/);
    if (leaveMatch && leaveMatch[1]) {
      const playerName = leaveMatch[1].trim();
      onlinePlayersList = onlinePlayersList.filter(name => name !== playerName);
      console.log(`[Smart Tracker]: تم رصد خروج لاعب صافي: ${playerName}`);
    }
  }
}

function getServerStatus() {
  return isServerOnline ? 'ONLINE' : 'OFFLINE';
}
// ========================================================
// ⚙️ [ملف information.js النظيف والمصلح - الجزء 2 من 2]
// محرك ربط الـ UUID وجلب إحصائيات اللاعبين المتقدمة من ملفات العالم
// ========================================================

/**
 * دالة ذكية للبحث عن الـ UUID الخاص باللاعب من خلال اسمه عبر ملف usercache.json التابع لماين كرافت
 * @param {string} playerName - اسم اللاعب الصافي
 * @returns {string|null} الـ UUID الخاص باللاعب أو null
 */
function getPlayerUuid(playerName) {
  if (!fs.existsSync(userCachePath)) return null;
  try {
    const content = fs.readFileSync(userCachePath, 'utf8');
    const cache = JSON.parse(content);
    // البحث داخل الكاش المولد من السيرفر
    const userData = cache.find(entry => entry.name && entry.name.toLowerCase() === playerName.toLowerCase());
    return userData ? userData.uuid : null;
  } catch (e) {
    return null;
  }
}

/**
 * ميزة حصرية فخمة: جلب كشف بيانات وإحصائيات اللاعب المتقدمة من ملفات الحفظ بالقرص
 * @param {string} playerName - اسم اللاعب الصافي
 * @returns {object} كائن يحتوي على إحصائيات جرد اللاعب التفصيلية
 */
function getPlayerDataDetails(playerName) {
  const uuid = getPlayerUuid(playerName);

  // قيم افتراضية نموذجية في حال عدم وجود ملفات بيانات للحساب بعد
  const defaultStats = {
    name: playerName,
    uuid: uuid || '🔐 حساب مكرك / غير مسجل',
    playTime: '0 دقيقة',
    deaths: 0,
    jumps: 0,
    playerKills: 0,
    mobKills: 0,
    advancementsCount: 0
  };

  if (!uuid) return defaultStats;

  try {
    // 1. قراءة وتحليل ملف الإحصائيات (Stats) الخاص باللاعب
    const statFilePath = path.join(statsDirectory, `${uuid}.json`);
    if (fs.existsSync(statFilePath)) {
      const rawData = fs.readFileSync(statFilePath, 'utf8');
      const statsJson = JSON.parse(rawData).stats || {};

      // ماين كرافت تخزن الإحصائيات تحت فئات مخصصة (custom)
      const customStats = statsJson['minecraft:custom'] || {};

      // وقت اللعب يخزن بالـ Ticks (كل 20 تيك تساوي ثانية واحدة)
      const ticks = customStats['minecraft:play_time'] || customStats['minecraft:total_world_time'] || 0;
      const totalMinutes = Math.floor(ticks / 20 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      defaultStats.playTime = hours > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${mins} دقيقة`;
      defaultStats.deaths = customStats['minecraft:deaths'] || 0;
      defaultStats.jumps = customStats['minecraft:jump'] || 0;
      defaultStats.playerKills = customStats['minecraft:player_kills'] || 0;
      defaultStats.mobKills = customStats['minecraft:mob_kills'] || 0;
    }

    // 2. قراءة وتحليل ملف الإنجازات (Advancements) المفتوحة للحساب
    const advFilePath = path.join(advancementsDirectory, `${uuid}.json`);
    if (fs.existsSync(advFilePath)) {
      const rawData = fs.readFileSync(advFilePath, 'utf8');
      const advJson = JSON.parse(rawData) || {};

      // حساب عدد الإنجازات التي تمتلك حقل done=true بداخلها برمجياً
      let doneCount = 0;
      Object.keys(advJson).forEach(key => {
        if (advJson[key] && advJson[key].done === true) {
          doneCount++;
        }
      });
      defaultStats.advancementsCount = doneCount;
    }

  } catch (error) {
    console.error(`[Smart Tracker ERROR]: وفشل استخراج إحصائيات اللاعب المتقدمة لـ ${playerName}:`, error);
  }

  return defaultStats;
}

/**
 * دالة لجلب الحد الأقصى للاعبين المسموح به من ملف server.properties
 */
function getTotalPlayers() {
  if (!fs.existsSync(propertiesPath)) return 20;
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      if (line.trim().startsWith('max-players=')) {
        return parseInt(line.split('=').trim(), 10) || 20;
      }
    }
  } catch (error) {
    console.error('[Information Manager ERROR]:', error);
  }
  return 20;
}

function getOnlinePlayersList() { return onlinePlayersList; }
function getOpsList() { return readMinecraftJson(opsPath); }
function getWhitelistList() { return readMinecraftJson(whitelistPath); }
function getBannedPlayersList() { return readMinecraftJson(bannedPlayersPath); }
function getBannedIpsList() { return readMinecraftJson(bannedIpsPath); }

// تصدير واجهة الدوال المحدثة والشاملة لبيانات اللاعبين والإنجازات
module.exports = {
  parseServerLog,
  getServerStatus,
  getTotalPlayers,
  getOnlinePlayersList,
  getOpsList,
  getWhitelistList,
  getBannedPlayersList,
  getBannedIpsList,
  getPlayerDataDetails
};
