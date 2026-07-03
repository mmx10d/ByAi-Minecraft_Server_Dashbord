const fs = require('fs');
const path = require('path');

const pluginsPath = path.join(__dirname, '../plugins');

// التأكد من وجود مجلد البلقنز
if (!fs.existsSync(pluginsPath)) {
  fs.mkdirSync(pluginsPath, { recursive: true });
}

/**
 * جلب قائمة بكافة الـ Plugins أو Mods المثبتة حالياً
 * @returns {Array<string>} قائمة بأسماء ملفات .jar
 */
function getInstalledPlugins() {
  try {
    const files = fs.readdirSync(pluginsPath);
    return files.filter(file => file.endsWith('.jar'));
  } catch (error) {
    console.error('[Plugin Manager ERROR]: فشل قراءة مجلد البلقنز:', error);
    return [];
  }
}

/**
 * حذف بلقن معين عن طريق اسمه
 * @param {string} pluginName - اسم ملف البلقن مع الصيغة (مثال: EssentialsX.jar)
 */
function deletePlugin(pluginName) {
  const targetPath = path.join(pluginsPath, pluginName);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      console.log(`[Plugin Manager]: تم حذف البلقن ${pluginName} بنجاح. (يتطلب ريستارت)`);
      return true;
    } catch (error) {
      console.error(`[Plugin Manager ERROR]: فشل حذف البلقن ${pluginName}:`, error);
      return false;
    }
  } else {
    console.log(`[Plugin Manager]: البلقن ${pluginName} غير موجود.`);
    return false;
  }
}

module.exports = {
  getInstalledPlugins,
  deletePlugin
};
