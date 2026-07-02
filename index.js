// ========================================================
// 🚀 [ملف index.js المطور كلياً - الجزء 1 من 2]
// النواة المركزية المحدثة، خادم السوكيت، ومستمع السجلات الحية بصيغة JSON
// ========================================================

const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');
const fs = require('fs');

console.log('========================================================');
console.log(' ⚡ [نظام النواة السحابي المطور الفائق - Aternos Core] يعمل... ');
console.log('========================================================');

// 1. تشغيل وإقلاع سيرفر ماين كرافت تلقائياً
minecraft.server.startServer();

// 2. إنشاء خادم السوكيت المركزي المستقل (WebSocket Server) على المنفذ 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يستمع الآن بشكل مستقل على الرابط: ws://localhost:8080');

// 3. ربط مخرجات السيرفر الحية وإرسالها حياً لكل من يتصل بالسوكيت ولمحلل البيانات
minecraft.server.setLogListener((logLine) => {
  // تحديث قائمة اللاعبين والحالة حياً عبر محلل الـ RegEx الصارم
  minecraft.info.parseServerLog(logLine);

  // تحويل السجل إلى حزمة JSON موحدة لبثها فوراً
  const logPackage = JSON.stringify({
    type: 'LOG',
    data: logLine
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 تعني خط الاتصال مفتوح ومستقر (OPEN)
      client.send(logPackage);
    }
  });
});
// ========================================================
// 🚀 [ملف index.js المطور كلياً - الجزء 2 من 2]
// معالج أحداث السوكيت المتقدم لملفات العالم والـ zip وإعدادات السيرفر
// ========================================================

// 4. الإنصات لربط واجهات الويب المستقلة والبوتات ومعالجة حزم البيانات المتقدمة حياً
wss.on('connection', (ws) => {
  console.log('[Socket Server]: متصل جديد انضم لإدارة السيرفر بكافة الميزات.');
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected to Ultimate Aternos-Core Backend' }));

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message.toString());
      const { action, payload } = request;

      console.log(`[Action Received]: ${action}`);

      switch (action) {
        // ---- أ) أوامر التحكم بالقدرة والتشغيل ----
        case 'START_SERVER':
          minecraft.server.startServer();
          break;
        case 'STOP_SERVER':
          minecraft.server.stopServer();
          break;
        case 'RESTART_SERVER':
          minecraft.server.restartServer();
          break;
        case 'MINECRAFT_COMMAND':
          minecraft.server.executeCommand(payload.command);
          break;

        // ---- ب) جلب الموارد والإحصائيات الحية الشاملة والقوائم الخمس ----
        case 'GET_HOST_STATS':
          ws.send(JSON.stringify({
            type: 'HOST_STATS',
            data: {
              status: minecraft.info.getServerStatus(),
              ram: minecraft.host.getRamUsage(),
              cpu: minecraft.host.getCpuUsage(),
              playersCount: minecraft.info.getOnlinePlayersList().length,
              playersOnline: minecraft.info.getOnlinePlayersList(),
              opsList: minecraft.info.getOpsList(),
              whitelistList: minecraft.info.getWhitelistList(),
              bannedPlayersList: minecraft.info.getBannedPlayersList(),
              bannedIpsList: minecraft.info.getBannedIpsList(),
              // ميزة مدمجة جديدة: جلب كافة إعدادات ملف server.properties حياً للويب
              serverProperties: minecraft.world.getAllProperties()
            }
          }));
          break;

        // ---- ج) ميزة كشف بيانات اللاعبين المتقدمة (جرد الحساب والـ UUID) ----
        case 'GET_PLAYER_ADVANCED_DATA':
          const advancedData = minecraft.info.getPlayerDataDetails(payload.playerName);
          ws.send(JSON.stringify({
            type: 'PLAYER_ADVANCED_DATA',
            data: advancedData
          }));
          break;

        // ---- د) ميزة تعديل إعدادات السيرفر (Aternos Settings Server) ----
        case 'UPDATE_SERVER_PROPERTY':
          const successProp = minecraft.world.updateProperty(payload.key, payload.value);
          ws.send(JSON.stringify({ type: 'PROPERTY_UPDATED_STATUS', success: successProp, key: payload.key }));
          break;
        case 'SET_GAMEMODE_SETTING':
          minecraft.world.changeGamemode(payload.mode);
          break;
        case 'SET_DIFFICULTY_SETTING':
          minecraft.world.changeDifficulty(payload.difficulty);
          break;
        case 'SET_WHITELIST_TOGGLE':
          minecraft.world.setWhitelistEnabled(payload.enable);
          break;
        case 'SET_CRACK_TOGGLE':
          minecraft.world.setCrackAllowed(payload.allowed);
          break;

        // ---- هـ) ميزة إنشاء وإرسال باك اب العالم بصيغة .zip حقيقية ----
        case 'CREATE_ZIP_BACKUP':
          ws.send(JSON.stringify({ type: 'BACKUP_STATUS', status: 'PROCESSING', msg: 'جاري جمد وضغط مجلد العالم بصيغة zip...' }));
          const zipPath = await minecraft.backup.createZipBackup();
          if (zipPath) {
            // قراءة الملف وتحويله إلى Base64 لإرساله عبر السوكيت بأمان للويب والبوتات
            const fileBuffer = fs.readFileSync(zipPath);
            ws.send(JSON.stringify({
              type: 'BACKUP_ZIP_DOWNLOAD',
              fileName: path.basename(zipPath),
              fileData: fileBuffer.toString('base64')
            }));
          } else {
            ws.send(JSON.stringify({ type: 'BACKUP_STATUS', status: 'FAILED', msg: 'فشل إنشاء النسخة المضغوطة' }));
          }
          break;
        case 'GET_BACKUPS_LIST':
          ws.send(JSON.stringify({ type: 'BACKUPS_LIST_DATA', data: minecraft.backup.getBackupListDetails() }));
          break;
        case 'DELETE_BACKUP_FILE':
          minecraft.backup.deleteBackupFile(payload.fileName);
          break;

        // ---- و) ميزة تصفح وإدارة وقراءة وحذف ملفات العالم والسيرفر برمجياً ----
        case 'BROWSE_SERVER_DIRECTORY':
          const dirItems = minecraft.files.browseDirectory(payload.relativePath);
          ws.send(JSON.stringify({ type: 'DIRECTORY_ITEMS_DATA', currentPath: payload.relativePath, items: dirItems }));
          break;
        case 'READ_FILE_TEXT_CONTENT':
          const fileReadResult = minecraft.files.readFileContent(payload.relativePath);
          ws.send(JSON.stringify({ type: 'FILE_TEXT_CONTENT_DATA', relativePath: payload.relativePath, ...fileReadResult }));
          break;
        case 'SAVE_FILE_TEXT_CONTENT':
          const saveSuccess = minecraft.files.saveFileContent(payload.relativePath, payload.content);
          ws.send(JSON.stringify({ type: 'FILE_SAVE_STATUS', relativePath: payload.relativePath, success: saveSuccess }));
          break;
        case 'UPLOAD_FILE_TO_SERVER':
          const uploadSuccess = minecraft.files.uploadFile(payload.relativePath, payload.fileData, true); // true تعني Base64 ممرر
          ws.send(JSON.stringify({ type: 'FILE_UPLOAD_STATUS', relativePath: payload.relativePath, success: uploadSuccess }));
          break;
        case 'DELETE_FILE_OR_FOLDER':
          const deleteSuccess = minecraft.files.deleteFileOrFolder(payload.relativePath);
          ws.send(JSON.stringify({ type: 'FILE_DELETE_STATUS', relativePath: payload.relativePath, success: deleteSuccess }));
          break;

        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action Received' }));
      }
    } catch (error) {
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// 5. نظام النوم والجدولة الآلي عند الخمول والـ Proxy
setInterval(() => {
  minecraft.scheduler.checkServerIdle();
}, 60000);

// 6. تفعيل الـ Terminal المحلي للجهاز الأساسي للتحكم اليدوي المباشر
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => { minecraft.server.executeCommand(line); });
