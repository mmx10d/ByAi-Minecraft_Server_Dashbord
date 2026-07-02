const fs = require('fs');
const path = require('path');

const worldPath = path.join(__dirname, '../world');
const backupsPath = path.join(__dirname, '../backups');

if (!fs.existsSync(backupsPath)) {
  fs.mkdirSync(backupsPath, { recursive: true });
}

/**
 * إنشاء نسخة احتياطية من مجلد العالم الحالي
 */
function createBackup() {
  if (!fs.existsSync(worldPath)) {
    console.log('[Backup Manager]: لا يمكن عمل نسخة احتياطية، مجلد العالم غير موجود بعد.');
    return false;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(backupsPath, `backup-${timestamp}`);

    // نسخ مجلد العالم تكرارياً إلى مجلد الباك اب الجديد
    fs.cpSync(worldPath, backupFolder, { recursive: true });
    console.log(`[Backup Manager]: تم إنشاء نسخة احتياطية بنجاح في: backup-${timestamp}`);
    return true;
  } catch (error) {
    console.error('[Backup Manager ERROR]: فشل إنشاء النسخة الاحتياطية:', error);
    return false;
  }
}

/**
 * جلب قائمة بجميع النسخ الاحتياطية المتوفرة
 */
function getBackupList() {
  try {
    return fs.readdirSync(backupsPath);
  } catch (error) {
    return [];
  }
}

module.exports = {
  createBackup,
  getBackupList
};
