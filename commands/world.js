const fs = require('fs');
const path = require('path');
const { executeCommand } = require('./server.js');

// مسار ملف خصائص السيرفر الافتراضي
const propertiesPath = path.join(__dirname, '../server.properties');

/**
 * دالة مساعدة داخلية لقراءة وتحديث قيم محددة في ملف server.properties
 */
function updateProperty(key, value) {
  if (!fs.existsSync(propertiesPath)) {
    console.log('[World Manager]: ملف server.properties غير موجود بعد، يرجى تشغيل السيرفر مرة واحدة لتوليده.');
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
    console.error(`[World Manager ERROR]: فشل تعديل الخاصية ${key}:`, error);
    return false;
  }
}

/**
 * دالة لتحديد الحد الأقصى للاعبين في السيرفر (يتطلب إعادة تشغيل لتطبيقه بالكامل)
 * @param {number} count - عدد اللاعبين الأقصى
 */
function setMaxPlayers(count) {
  if (isNaN(count) || count < 0) {
    console.log('[World Manager]: يرجى إدخال رقم صحيح لعدد اللاعبين.');
    return;
  }
  if (updateProperty('max-players', count)) {
    console.log(`[World Manager]: تم تعديل الحد الأقصى للاعبين إلى: ${count} (سيطبق بعد إعادة التشغيل).`);
  }
}

/**
 * دالة لتغيير وضع اللعب الافتراضي (Gamemode) وإرسال أمر فوري للسيرفر الحي
 * @param {string} mode - وضع اللعب (survival, creative, adventure, spectator)
 */
function changeGamemode(mode) {
  const validModes = ['survival', 'creative', 'adventure', 'spectator'];
  if (!validModes.includes(mode.toLowerCase())) {
    console.log(`[World Manager]: وضع اللعب غير صالح. الخيارات المتاحة: ${validModes.join(', ')}`);
    return;
  }

  // تعديل الإعداد للمستقبل
  updateProperty('gamemode', mode.toLowerCase());
  // تطبيق الأمر فورياً على السيرفر الحي
  executeCommand(`defaultgamemode ${mode.toLowerCase()}`);
  console.log(`[World Manager]: تم تغيير وضع اللعب الافتراضي إلى: ${mode}`);
}

/**
 * دالة للتحكم في السماح بدخول الحسابات المكركة (Offline Mode)
 * @param {boolean} state - true للأصلي فقط، false للسماح بالمكرك
 */
function setCrackAllowed(state) {
  // في ماين كرافت online-mode=false تعني السماح بالمكرك
  const onlineModeValue = state ? 'false' : 'true';
  if (updateProperty('online-mode', onlineModeValue)) {
    console.log(`[World Manager]: تم تعديل إعدادات الدخول المكرك إلى: ${state} (يتطلب إعادة تشغيل).`);
  }
}

/**
 * دالة لحذف مجلد العالم الحالي لتوليد خريطة جديدة تماماً (يجب أن يكون السيرفر مطفأً)
 */
function deleteWorld() {
  const worldPath = path.join(__dirname, '../world');

  if (fs.existsSync(worldPath)) {
    try {
      // حذف مجلد العالم بشكل تكراري آمن
      fs.rmSync(worldPath, { recursive: true, force: true });
      console.log('[World Manager]: تم حذف مجلد العالم بنجاح. سيتم إنشاء عالم جديد عند التشغيل القادم.');
    } catch (error) {
      console.error('[World Manager ERROR]: فشل حذف العالم، تأكد من إطفاء السيرفر أولاً:', error);
    }
  } else {
    console.log('[World Manager]: مجلد العالم غير موجود بالفعل.');
  }
}

/**
 * دالة لتهيئة أو توليد عالم جديد (يمكن تمرير مسار مجلد عالم خارجي لاستبداله)
 * @param {string|null} worldSourcePath - مسار العالم الخارجي المراد وضعه (اختياري)
 */
function generateNewWorld(worldSourcePath = null) {
  // أولاً نقوم بحذف العالم القديم لتهيئة الساحة
  deleteWorld();

  if (worldSourcePath) {
    const destPath = path.join(__dirname, '../world');
    try {
      if (fs.existsSync(worldSourcePath)) {
        fs.cpSync(worldSourcePath, destPath, { recursive: true });
        console.log('[World Manager]: تم نسخ واستيراد العالم الجديد بنجاح.');
      } else {
        console.log('[World Manager]: المسار الخارجي الممرر للعالم غير صحيح.');
      }
    } catch (error) {
      console.error('[World Manager ERROR]: فشل استيراد العالم الخارجي:', error);
    }
  }
}

// تصدير الدوال للاستخدام الخارجي
module.exports = {
  setMaxPlayers,
  changeGamemode,
  setCrackAllowed,
  generateNewWorld,
  deleteWorld
};
