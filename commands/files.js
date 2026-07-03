// ========================================================
// ⚙️ [ملف files.js المطور والآمن كلياً - الجزء 1 من 2]
// فرض العزل الأمني الصارم لمجلدات العالم والبلقنز وتصفح الملفات حياً
// ========================================================

const fs = require('fs');
const path = require('path');

// 🔒 المسارات الأساسية المصرح بلمسها وتصفحها فقط لحماية المشروع
const worldRootPath = path.resolve(__dirname, '../world');
const pluginsRootPath = path.resolve(__dirname, '../plugins');

// التأكد من وجود مجلد البلقنز والعالم للتفعيل الفوري
if (!fs.existsSync(pluginsRootPath)) {
  fs.mkdirSync(pluginsRootPath, { recursive: true });
}
if (!fs.existsSync(worldRootPath)) {
  fs.mkdirSync(worldRootPath, { recursive: true });
}

/**
 * دالة حماية حديدية للتأكد من أن المسار المطلوب يقع حصرياً داخل world أو plugins
 */
function getStrictSafePath(relativePath = '', isPluginArea = false) {
  const baseRoot = isPluginArea ? pluginsRootPath : worldRootPath;
  const resolvedPath = path.resolve(baseRoot, relativePath);

  // التحقق الصارم من أن المسار الناتج يبدأ بالمسار الأب المصرح له لمنع الاختراق للأعلى
  if (!resolvedPath.startsWith(baseRoot)) {
    return baseRoot;
  }
  return resolvedPath;
}

/**
 * تصفح وقراءة محتويات المجلدات المعزولة بنظام الأمان
 * @param {string} relativePath - المسار النسبي المطلوب
 * @param {boolean} isPluginArea - هل التصفح داخل مجلد البلقنز؟
 */
function browseDirectory(relativePath = '', isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);
  if (!fs.existsSync(targetPath)) return [];

  try {
    const items = fs.readdirSync(targetPath);
    return items.map(item => {
      const itemPath = path.join(targetPath, item);
      const stats = fs.statSync(itemPath);
      const isDir = stats.isDirectory();

      return {
        name: item,
        relativePath: path.relative(isPluginArea ? pluginsRootPath : worldRootPath, itemPath).replace(/\\/g, '/'),
        isDirectory: isDir,
        size: isDir ? '-' : `${(stats.size / 1024).toFixed(2)} KB`,
        rawSize: stats.size,
        updatedAt: stats.mtime
      };
    }).sort((a, b) => (b.isDirectory - a.isDirectory) || a.name.localeCompare(b.name));
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل تصفح المجلد (${relativePath}):`, error);
    return [];
  }
}

/**
 * قراءة المحتوى النصي لملف تكوين داخل النطاق الآمن
 */
function readFileContent(relativePath, isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    return { success: false, data: 'الملف غير موجود أو أنه مجلد' };
  }

  try {
    const allowedExtensions = ['.txt', '.properties', '.json', '.yml', '.yaml', '.conf', '.log'];
    const ext = path.extname(targetPath).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return { success: false, data: 'نوع هذا الملف غير مدعوم للقراءة النصية المباشرة' };
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, data: error.message };
  }
}
// ========================================================
// ⚙️ [ملف files.js المطور والآمن كلياً - الجزء 2 من 2]
// ميزة إعادة التسمية، الرفع، الحذف، والتحميل الباينري الآمن
// ========================================================

/**
 * حفظ أو تعديل المحتوى النصي لملف معين على القرص داخل النطاق الآمن
 */
function saveFileContent(relativePath, textContent, isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) return false;

  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(targetPath, textContent, 'utf8');
    console.log(`[مدير الملفات الآمن]: تم تحديث الملف بنجاح: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل حفظ الملف (${relativePath}):`, error);
    return false;
  }
}

/**
 * ميزة جديدة مصلحة: تغيير اسم أو مسار ملف أو مجلد برمجياً (Rename / Move)
 * @param {string} oldRelativePath - الاسم/المسار القديم
 * @param {string} newRelativePath - الاسم/المسار الجديد
 * @param {boolean} isPluginArea - هل العملية داخل مجلد البلقنز؟
 */
function renameFileOrFolder(oldRelativePath, newRelativePath, isPluginArea = false) {
  const oldPath = getStrictSafePath(oldRelativePath, isPluginArea);
  const newPath = getStrictSafePath(newRelativePath, isPluginArea);

  // حماية أمنية: منع لمس المجلدات الرئيسية المصرح بها أو الخروج عنها
  if (oldPath === worldRootPath || oldPath === pluginsRootPath || newPath === worldRootPath || newPath === pluginsRootPath) {
    return false;
  }

  if (!fs.existsSync(oldPath)) return false;

  try {
    const parentDir = path.dirname(newPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    fs.renameSync(oldPath, newPath);
    console.log(`[مدير الملفات الآمن]: تم تغيير الاسم من [${oldRelativePath}] إلى [${newRelativePath}]`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل إعادة التسمية:`, error);
    return false;
  }
}

/**
 * كتابة وحفظ الملفات المرفوعة (مثل البلقنز أو ملفات الخرائط) مباشرة إلى السيرفر
 */
function uploadFile(relativePath, fileData, isBase64 = false, isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);
  try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    const buffer = isBase64 ? Buffer.from(fileData, 'base64') : Buffer.from(fileData);
    fs.writeFileSync(targetPath, buffer);
    console.log(`[مدير الملفات الآمن]: تم رفع ملف جديد بنجاح: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل رفع وحفظ الملف (${relativePath}):`, error);
    return false;
  }
}

/**
 * ميزة جديدة: قراءة ملف منفرد بصيغة Buffer وإرجاع بياناته لتحميله عبر المنصات
 * @param {string} relativePath - مسار الملف المراد تنزيله
 * @param {boolean} isPluginArea - هل الملف داخل مجلد البلقنز؟
 * @returns {object|boolean} يحتوي على اسم الملف وبياناته كـ Buffer أو false
 */
function downloadSingleFile(relativePath, isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) return false;

  try {
    const fileBuffer = fs.readFileSync(targetPath);
    return {
      name: path.basename(targetPath),
      buffer: fileBuffer
    };
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل قراءة الملف للتحميل (${relativePath}):`, error);
    return false;
  }
}

/**
 * حذف ملف أو مجلد بالكامل وبشكل نهائي من القرص داخل النطاق الآمن
 */
function deleteFileOrFolder(relativePath, isPluginArea = false) {
  const targetPath = getStrictSafePath(relativePath, isPluginArea);

  // منع تدمير المجلدات الأب الرئيسية
  if (targetPath === worldRootPath || targetPath === pluginsRootPath || relativePath === '' || relativePath === '/') {
    return false;
  }

  if (!fs.existsSync(targetPath)) return false;

  try {
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    console.log(`[مدير الملفات الآمن]: تم حذف المكون: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`[مدير الملفات الآمن ERROR]: فشل حذف المكون (${relativePath}):`, error);
    return false;
  }
}

module.exports = {
  browseDirectory,
  readFileContent,
  saveFileContent,
  renameFileOrFolder,
  uploadFile,
  downloadSingleFile,
  deleteFileOrFolder
};
