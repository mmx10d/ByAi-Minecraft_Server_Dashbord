// ========================================================
// ⚙️ [ملف backup.js المطور والذكي - الجزء 1 من 2]
// دمج محرك الضغط الحقيقي Archiver لإصدار نسخ .zip احترافية
// ========================================================

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const worldPath = path.join(__dirname, '../world');
const backupsPath = path.join(__dirname, '../backups');

// التأكد التام من وجود مجلد النسخ الاحتياطية المركزي بالمشروع
if (!fs.existsSync(backupsPath)) {
  fs.mkdirSync(backupsPath, { recursive: true });
}

/**
 * دالة تفاعلية لضغط مجلد العالم بالكامل بصيغة .zip حقيقية وقابلة للنقل
 * @returns {Promise<string|boolean>} مسار ملف الـ zip الناتج عند النجاح
 */
function createZipBackup() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(worldPath)) {
      console.log('[محرر النسخ]: لا يمكن عمل نسخة، مجلد العالم world غير موجود بعد.');
      return resolve(false);
    }

    // توليد اسم فرعي للملف بناءً على التاريخ والوقت الحالي بدقة
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.zip`;
    const outputFilePath = path.join(backupsPath, fileName);

    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // تفعيل أقصى درجة ضغط وتصغير لحجم الملف
    });

    // الاستماع لانتهاء عملية الضغط وإغلاق الملف على القرص بسلام
    output.on('close', () => {
      console.log(`[محرر النسخ]: تم ضغط العالم بنجاح! الحجم الكلي: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(outputFilePath); // إرجاع المسار الفعلي للملف المضغوط
    });

    archive.on('error', (err) => {
      console.error('[محرر النسخ ERROR]: حدث خطأ أثناء عملية ضغط الـ zip:', err);
      resolve(false);
    });

    // ربط تدفق البيانات بصندوق الكتابة النهائي
    archive.pipe(output);

    // إضافة مجلد العالم بالكامل تكرارياً لداخل ملف الـ zip
    archive.directory(worldPath, false);

    // إغلاق وبدء الإنتاج الفعلي
    archive.finalize();
  });
}
// ========================================================
// ⚙️ [ملف backup.js المطور والذكي - الجزء 2 من 2]
// دوال جلب إحصائيات النسخ المتاحة وأحجامها وحذفها برمجياً
// ========================================================

/**
 * جلب قائمة تفصيلية بجميع النسخ الاحتياطية المتوفرة بصيغة .zip وأحجامها على القرص
 * @returns {Array<object>} مصفوفة كائنات تحتوي على اسم الملف وحجمه وتاريخه
 */
function getBackupListDetails() {
  try {
    if (!fs.existsSync(backupsPath)) return [];

    const files = fs.readdirSync(backupsPath);
    const zipFiles = files.filter(file => file.endsWith('.zip'));

    return zipFiles.map(file => {
      const filePath = path.join(backupsPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        rawSize: stats.size,
        createdAt: stats.mtime
      };
    }).sort((a, b) => b.createdAt - a.createdAt); // ترتيب من الأحدث للأقدم
  } catch (error) {
    console.error('[محرر النسخ ERROR]: فشل جلب تفاصيل قائمة الباك اب:', error);
    return [];
  }
}

/**
 * حذف نسخة احتياطية محددة من المجلد لحفظ مساحة التخزين
 * @param {string} fileName - اسم ملف الـ zip المراد حذفه
 * @returns {boolean} حالة النجاح
 */
function deleteBackupFile(fileName) {
  // حماية أمنية: منع حذف أي ملف خارج مجلد الباك اب عبر تصفية الاسم
  const safeFileName = path.basename(fileName);
  const targetPath = path.join(backupsPath, safeFileName);

  if (fs.existsSync(targetPath) && safeFileName.endsWith('.zip')) {
    try {
      fs.unlinkSync(targetPath);
      console.log(`[محرر النسخ]: تم حذف ملف النسخة الاحتياطية (${safeFileName}) بنجاح.`);
      return true;
    } catch (error) {
      console.error(`[محرر النسخ ERROR]: فشل حذف الملف ${safeFileName}:`, error);
      return false;
    }
  }
  return false;
}

/**
 * جلب مسار آخر نسخة احتياطية تم إنشاؤها لغرض التحميل الفوري عبر البوتات أو الويب
 * @returns {string|boolean} مسار الملف الكامل أو false
 */
function getLatestBackupPath() {
  const list = getBackupListDetails();
  if (list.length === 0) return false;
  return path.join(backupsPath, list[0].name);
}

module.exports = {
  createZipBackup,
  getBackupListDetails,
  deleteBackupFile,
  getLatestBackupPath
};
