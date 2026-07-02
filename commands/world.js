// ========================================================
// ⚙️ [ملف world.js المطور - الجزء 1 من 2]
// معالج التعديل الديناميكي وحفظ إعدادات سيرفر ماين كرافت
// ========================================================

const fs = require('fs');
const path = require('path');
const { executeCommand } = require('./server.js');

// مسار ملف خصائص السيرفر الرئيسي
const propertiesPath = path.join(__dirname, '../server.properties');

/**
 * دالة مساعدة مركزية لقراءة وتحديث قيم محددة داخل ملف server.properties
 */
function updateProperty(key, value) {
  if (!fs.existsSync(propertiesPath)) {
    console.log('[سيرفر العالم]: ملف server.properties غير موجود بعد، يرجى تشغيل السيرفر مرة واحدة لتوليده.');
    return false;
  }

  try {
    let content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    let keyExists = false;

    const updatedLines = lines.map(line => {
      if (line.trim().startsWith(`${key}=`)) {
        keyExists = true;
        return `${key}=${value}`;
      }
      return line;
    });

    if (!keyExists) {
      updatedLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(propertiesPath, updatedLines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    console.error(`[سيرفر العالم ERROR]: فشل تعديل الخاصية ${key}:`, error);
    return false;
  }
}

/**
 * دالة ذكية لجلب كافة الإعدادات الحالية المتواجدة في ملف server.properties كـ JSON
 */
function getAllProperties() {
  if (!fs.existsSync(propertiesPath)) return {};
  const settings = {};
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        settings[key] = value;
      }
    });
  } catch (e) {
    console.error('[سيرفر العالم ERROR]: فشل جلب الخصائص:', e);
  }
  return settings;
}
// ========================================================
// ⚙️ [ملف world.js المطور - الجزء 2 من 2]
// دوال تعديل الجيم مود، الصعوبة، الكراك، الوايت لست، والتصدير العام
// ========================================================

/**
 * تعديل الحد الأقصى للاعبين في السيرفر
 * @param {number} count - عدد اللاعبين
 */
function setMaxPlayers(count) {
  if (isNaN(count) || count < 0) return false;
  if (updateProperty('max-players', count)) {
    console.log(`[سيرفر العالم]: تم تعديل الحد الأقصى للاعبين إلى: ${count} (يتطلب إعادة تشغيل).`);
    return true;
  }
  return false;
}

/**
 * تغيير وضع اللعب الافتراضي (Gamemode) وإرسال أمر فوري
 * @param {string} mode - (survival, creative, adventure, spectator)
 */
function changeGamemode(mode) {
  const validModes = ['survival', 'creative', 'adventure', 'spectator'];
  if (!validModes.includes(mode.toLowerCase())) return false;

  updateProperty('gamemode', mode.toLowerCase());
  executeCommand(`defaultgamemode ${mode.toLowerCase()}`);
  console.log(`[سيرفر العالم]: تم تغيير وضع اللعب الافتراضي إلى: ${mode}`);
  return true;
}

/**
 * تغيير صعوبة اللعبة (Difficulty) وإرسال أمر فوري
 * @param {string} difficulty - (peaceful, easy, normal, hard)
 */
function changeDifficulty(difficulty) {
  const validLevels = ['peaceful', 'easy', 'normal', 'hard'];
  if (!validLevels.includes(difficulty.toLowerCase())) return false;

  updateProperty('difficulty', difficulty.toLowerCase());
  executeCommand(`difficulty ${difficulty.toLowerCase()}`);
  console.log(`[سيرفر العالم]: تم تغيير صعوبة السيرفر إلى: ${difficulty}`);
  return true;
}

/**
 * التحكم في السماح بدخول الحسابات المكركة (Online Mode)
 * @param {boolean} allowed - true للسماح بالمكرك، false للأصلي فقط
 */
function setCrackAllowed(allowed) {
  // في ماين كرافت online-mode=false تعني تفعيل الكراك (السماح بالدخول غير الأصلي)
  const onlineModeValue = allowed ? 'false' : 'true';
  if (updateProperty('online-mode', onlineModeValue)) {
    console.log(`[سيرفر العالم]: تم تعديل إعدادات الدخول المكرك إلى: ${allowed} (يتطلب إعادة تشغيل).`);
    return true;
  }
  return false;
}

/**
 * التحكم في إجبار اللاعبين على وضع اللعبة الافتراضي عند الدخول
 * @param {boolean} force - true للإجبار، false للمحافظة على وضعه السابق
 */
function setForceGamemode(force) {
  const value = force ? 'true' : 'false';
  if (updateProperty('force-gamemode', value)) {
    console.log(`[سيرفر العالم]: تم تعديل إجبار وضع اللعبة إلى: ${force}`);
    return true;
  }
  return false;
}

/**
 * التحكم في تفعيل القائمة البيضاء (Whitelist) حياً
 * @param {boolean} enable - true للتفعيل ومنع الغرباء، false للتعطيل
 */
function setWhitelistEnabled(enable) {
  const value = enable ? 'true' : 'false';
  if (updateProperty('white-list', value)) {
    executeCommand(`whitelist ${enable ? 'on' : 'off'}`);
    console.log(`[سيرفر العالم]: تم تعديل حالة القائمة البيضاء إلى: ${enable}`);
    return true;
  }
  return false;
}

/**
 * حذف مجلد العالم الحالي لتوليد خريطة جديدة تماماً (يجب أن يكون السيرفر مطفأً)
 */
function deleteWorld() {
  const worldPath = path.join(__dirname, '../world');
  if (fs.existsSync(worldPath)) {
    try {
      fs.rmSync(worldPath, { recursive: true, force: true });
      console.log('[سيرفر العالم]: تم حذف مجلد العالم بنجاح. سيتم إنشاء عالم جديد عند التشغيل القادم.');
      return true;
    } catch (error) {
      console.error('[سيرفر العالم ERROR]: فشل حذف العالم، تأكد من إطفاء السيرفر أولاً:', error);
      return false;
    }
  }
  return false;
}

// تصدير الدوال البرمجية المحدثة للإعدادات
module.exports = {
  updateProperty,
  getAllProperties,
  setMaxPlayers,
  changeGamemode,
  changeDifficulty,
  setCrackAllowed,
  setForceGamemode,
  setWhitelistEnabled,
  deleteWorld
};
