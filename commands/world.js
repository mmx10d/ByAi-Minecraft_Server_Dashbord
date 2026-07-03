// ========================================================
// ⚙️ [ملف world.js المصلح بالكامل - جودة أترنوس الصارمة]
// إصلاح الـ max-players المضمون، وإعادة إنشاء وتصفير العوالم حياً
// ========================================================

const fs = require('fs');
const path = require('path');
const { executeCommand } = require('./server.js');

const propertiesPath = path.join(__dirname, '../server.properties');

/**
 * دالة مساعدة مركزية مصلحة تماماً لكتابة الخصائص للقرص فوراً دون مسافات مشوهة
 */
function updateProperty(key, value) {
  if (!fs.existsSync(propertiesPath)) {
    console.log('[سيرفر العالم]: ملف server.properties غير موجود بعد.');
    return false;
  }

  try {
    let content = fs.readFileSync(propertiesPath, 'utf8');
    // معالجة السطور للتخلص من حقول الـ \r الزائدة في بيئة الويندوز
    const lines = content.split(/\r?\n/);
    let keyExists = false;

    const updatedLines = lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(`${key}=`)) {
        keyExists = true;
        return `${key}=${value}`; // كتابة صارمة بدون مسافات حول اليساوي
      }
      return line;
    });

    if (!keyExists) {
      updatedLines.push(`${key}=${value}`);
    }

    // كتابة الملف مع توحيد السطور وضمان الـ Flush الفوري على الهارد ديسك
    fs.writeFileSync(propertiesPath, updatedLines.join('\n'), 'utf8');
    return true;
  } catch (error) {
    console.error(`[سيرفر العالم ERROR]: فشل تعديل الخاصية الصارمة ${key}:`, error);
    return false;
  }
}

/**
 * جلب كافة الإعدادات الحالية من ملف الخصائص كـ JSON نظيف لمزامنة اللوحات
 */
function getAllProperties() {
  if (!fs.existsSync(propertiesPath)) return {};
  const settings = {};
  try {
    const content = fs.readFileSync(propertiesPath, 'utf8');
    const lines = content.split(/\r?\n/);
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

/**
 * دالة مصلحة ومضمونة 100% لتحديث كاونت اللاعبين الأقصى وحفظه الفوري
 */
function setMaxPlayers(count) {
  const numericCount = parseInt(count, 10);
  if (isNaN(numericCount) || numericCount < 1) return false;

  // التحديث الصارم على الملف
  if (updateProperty('max-players', numericCount.toString())) {
    console.log(`[سيرفر العالم]: تم قفل وحفظ الحد الأقصى للاعبين على: ${numericCount} (يتطلب ريستارت).`);
    return true;
  }
  return false;
}

function changeGamemode(mode) {
  const validModes = ['survival', 'creative', 'adventure', 'spectator'];
  if (!validModes.includes(mode.toLowerCase())) return false;
  updateProperty('gamemode', mode.toLowerCase());
  executeCommand(`defaultgamemode ${mode.toLowerCase()}`);
  return true;
}

function changeDifficulty(difficulty) {
  const validLevels = ['peaceful', 'easy', 'normal', 'hard'];
  if (!validLevels.includes(difficulty.toLowerCase())) return false;
  updateProperty('difficulty', difficulty.toLowerCase());
  executeCommand(`difficulty ${difficulty.toLowerCase()}`);
  return true;
}

function setCrackAllowed(allowed) {
  const onlineModeValue = allowed ? 'false' : 'true'; // online-mode=false يعني السماح بالمكرك
  return updateProperty('online-mode', onlineModeValue);
}

function setForceGamemode(force) {
  const value = force ? 'true' : 'false';
  return updateProperty('force-gamemode', value);
}

function setWhitelistEnabled(enable) {
  const value = enable ? 'true' : 'false';
  if (updateProperty('white-list', value)) {
    executeCommand(`whitelist ${enable ? 'on' : 'off'}`);
    return true;
  }
  return false;
}

/**
 * ميزة جديدة: إعادة تصفير وإنشاء العالم بالكامل (مدمج بربط الحذف الآمن)
 * يجب أن يتم استدعاؤها والسيرفر مطفأ لضمان تحرير الملفات من عملية الجافا
 */
function recreateFreshWorld() {
  const worldPath = path.join(__dirname, '../world');
  if (fs.existsSync(worldPath)) {
    try {
      // حذف العالم تكرارياً لتهيئة الأرض لتوليد عالم جديد عند الإقلاع القادم
      fs.rmSync(worldPath, { recursive: true, force: true });
      console.log('[سيرفر العالم]: تم حذف العالم القديم تماماً. السيرفر جاهز لتوليد خريطة جديدة عند التشغيل.');
      return true;
    } catch (error) {
      console.error('[سيرفر العالم ERROR]: فشل حذف العالم لإعادة إنشائه، تأكد من إطفاء اللعبة أولاً:', error);
      return false;
    }
  }
  return true; // إذا لم يكن موجوداً أصلاً، يعتبر جاهزاً للتوليد
}

module.exports = {
  updateProperty,
  getAllProperties,
  setMaxPlayers,
  changeGamemode,
  changeDifficulty,
  setCrackAllowed,
  setForceGamemode,
  setWhitelistEnabled,
  recreateFreshWorld
};
