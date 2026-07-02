// ========================================================
// ⚙️ [ملف files.js الجديد والمطور - الجزء 1 من 2]
// مدير الملفات المركزي: تصفح المجلدات وقراءة محتوى ملفات السيرفر
// ========================================================

const fs = require('fs');
const path = require('path');

// تحديد المسار الرئيسي للسيرفر كحد أقصى للأمان (منع الخروج للمجلدات الأب)
const rootServerPath = path.join(__dirname, '../');

/**
 * دالة مساعدة للتأكد من أن المسار المطلوب يقع داخل مجلد السيرفر لحماية أمن النظام
 */
function getSafePath(relativePath = '') {
  const resolvedPath = path.resolve(rootServerPath, relativePath);
  if (!resolvedPath.startsWith(rootServerPath)) {
    return rootServerPath; // إرجاع المسار الرئيسي في حال محاولة الاختراق للأعلى
  }
  return resolvedPath;
}

/**
 * تصفح وقراءة محتويات مجلد معين (قائمة الملفات والمجلدات بالداخل)
 * @param {string} relativePath - المسار النسبي المراد تصفحه (مثال: 'world' أو '')
 * @returns {Array<object>} قائمة تفصيلية بالملفات والمجلدات
 */
function browseDirectory(relativePath = '') {
  const targetPath = getSafePath(relativePath);
  if (!fs.existsSync(targetPath)) return [];

  try {
    const items = fs.readdirSync(targetPath);
    return items.map(item => {
      const itemPath = path.join(targetPath, item);
      const stats = fs.statSync(itemPath);
      const isDir = stats.isDirectory();

      return {
        name: item,
        relativePath: path.relative(rootServerPath, itemPath).replace(/\\/g, '/'),
        isDirectory: isDir,
        size: isDir ? '-' : `${(stats.size / 1024).toFixed(2)} KB`,
        rawSize: stats.size,
        updatedAt: stats.mtime
      };
    }).sort((a, b) => (b.isDirectory - a.isDirectory) || a.name.localeCompare(b.name)); // المجلدات أولاً ثم الملفات أبجدياً
  } catch (error) {
    console.error(`[مدير الملفات ERROR]: فشل تصفح المجلد (${relativePath}):`, error);
    return [];
  }
}

/**
 * قراءة محتوى نصي لملف معين (مثل ملفات الإعدادات والخصائص)
 * @param {string} relativePath - مسار الملف النسبي
 * @returns {object} يحتوي على حالة النجاح والمحتوى النصي
 */
function readFileContent(relativePath) {
  const targetPath = getSafePath(relativePath);
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    return { success: false, data: 'الملف غير موجود أو أنه مجلد' };
  }

  try {
    // فحص صيغ الملفات المسموح بقراءتها نصياً لحماية استقرار الخادم
    const allowedExtensions = ['.txt', '.properties', '.json', '.yml', '.yaml', '.conf', '.log'];
    const ext = path.extname(targetPath).toLowerCase();

    if (!allowedExtensions.includes(ext) && path.basename(targetPath) !== 'eula.txt') {
      return { success: false, data: 'نوع هذا الملف غير مدعوم للقراءة النصية المباشرة' };
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    console.error(`[مدير الملفات ERROR]: فشل قراءة الملف (${relativePath}):`, error);
    return { success: false, data: error.message };
  }
}
// ========================================================
// ⚙️ [ملف files.js الجديد والمطور - الجزء 2 من 2]
// حفظ التعديلات، كتابة الملفات المرفوعة، والحذف الآمن للملفات والمجلدات
// ========================================================

/**
 * حفظ أو تعديل المحتوى النصي لملف معين على القرص
 * @param {string} relativePath - مسار الملف النسبي المراد حفظه
 * @param {string} textContent - النص الجديد المراد كتابته
 * @returns {boolean} حالة نجاح العملية
 */
function saveFileContent(relativePath, textContent) {
  const targetPath = getSafePath(relativePath);

  // منع الكتابة أو التعديل على المجلدات لحماية النظام
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    return false;
  }

  try {
    // التأكد من وجود المجلد الأب للملف قبل الكتابة (توليده تلقائياً إن لم يوجد)
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, textContent, 'utf8');
    console.log(`[مدير الملفات]: تم حفظ وتحديث محتوى الملف بنجاح: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات ERROR]: فشل حفظ الملف (${relativePath}):`, error);
    return false;
  }
}

/**
 * دالة لكتابة وحفظ الملفات المرفوعة (باينري أو نصوص) مباشرة إلى السيرفر
 * @param {string} relativePath - المسار النسبي والاسم المراد حفظ الملف به
 * @param {string|Buffer} fileData - البيانات الخام القادمة من الرفع (مغلفة بـ Base64 أو Buffer)
 * @param {boolean} isBase64 - هل البيانات ممررة بصيغة Base64 من السوكيت؟
 * @returns {boolean} حالة نجاح الرفع
 */
function uploadFile(relativePath, fileData, isBase64 = false) {
  const targetPath = getSafePath(relativePath);

  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const buffer = isBase64 ? Buffer.from(fileData, 'base64') : Buffer.from(fileData);
    fs.writeFileSync(targetPath, buffer);
    console.log(`[مدير الملفات]: تم رفع وكتابة ملف جديد في السيرفر: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات ERROR]: فشل رفع وحفظ الملف (${relativePath}):`, error);
    return false;
  }
}

/**
 * حذف ملف أو مجلد بالكامل وبشكل نهائي من القرص (بما في ذلك مجلدات العوالم والبلقنز)
 * @param {string} relativePath - المسار النسبي للملف أو المجلد المراد مسحه
 * @returns {boolean} حالة نجاح الحذف
 */
function deleteFileOrFolder(relativePath) {
  const targetPath = getSafePath(relativePath);

  // حماية أمنية صارمة: منع حذف الملفات الحيوية لنظام التشغيل أو مجلد السيرفر الرئيسي
  if (targetPath === rootServerPath || relativePath === '' || relativePath === '/') {
    console.log('[مدير الملفات]: تم منع محاولة حذف مجلد السيرفر الرئيسي لحماية النظام!');
    return false;
  }

  if (!fs.existsSync(targetPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      // حذف المجلد وما بداخله تكرارياً (Recursive)
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`[مدير الملفات]: تم تدمير وحذف المجلد بالكامل: ${relativePath}`);
    } else {
      // حذف ملف منفرد
      fs.unlinkSync(targetPath);
      console.log(`[مدير الملفات]: تم حذف الملف من القرص: ${relativePath}`);
    }
    return true;
  } catch (error) {
    console.error(`[مدير الملفات ERROR]: فشل حذف الملف أو المجلد (${relativePath}):`, error);
    return false;
  }
}

// تصدير واجهة التحكم بالملفات المتكاملة
module.exports = {
  browseDirectory,
  readFileContent,
  saveFileContent,
  uploadFile,
  deleteFileOrFolder
};
