// ========================================================
// ⚙️ [Meticulously Repaired backup.js - Part 1 of 2]
// Sandboxed Zip Map Archive Handler via Stream Compression
// ========================================================

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Strictly locking map data targets to prevent system file tampering
const worldPath = path.resolve(__dirname, '../world');
const backupsPath = path.resolve(__dirname, '../backups');

// Proactively ensuring the centralized backup directory exists
if (!fs.existsSync(backupsPath)) {
  fs.mkdirSync(backupsPath, { recursive: true });
}

/**
 * Packs the entire map folder cleanly into a high-grade portable zip file.
 * @returns {Promise<string|boolean>} The absolute system path of the created zip file.
 */
function createZipBackup() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(worldPath)) {
      console.log('[Backup Subsystem]: Aborting backup generation, world directory not initialized yet.');
      return resolve(false);
    }

    // Generating a unique, ultra-precise snapshot filename based on date and time
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.zip`;
    const outputFilePath = path.join(backupsPath, fileName);

    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Deploying maximum mathematical compression to dramatically save bandwidth
    });

    // Firing safety handles when the binary write stream fully commits and flushes to the disk
    output.on('close', () => {
      console.log(`[Backup Subsystem]: Map compression succeeded. Total compressed archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve(outputFilePath); // Exporting the clean string address of the finished archive
    });

    archive.on('error', (err) => {
      console.error('[Backup Subsystem ERROR]: An unexpected error halted zip archiving:', err);
      resolve(false);
    });

    // Hard-linking the stream compression engine to the final file output writer
    archive.pipe(output);

    // Recursively stitching the world folder into the zip root structure safely
    archive.directory(worldPath, false);

    // Finalizing the compression pipeline and locking file access
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
