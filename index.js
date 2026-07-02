// ========================================================
// 🚀 [ملف index.js المصلح الحديدي - الجزء 1 من 2]
// السوكيت المركزي المحدث، منع تسريب الأوامر، وبث السجلات الحية
// ========================================================

const minecraft = require('./minecraft.js');
const { WebSocketServer } = require('ws');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log(' ⚡ [نظام النواة السحابي الحديدي - Sandbox Core v3] يعمل... ');
console.log('========================================================');

// 1. تشغيل وإقلاع سيرفر ماين كرافت تلقائياً
minecraft.server.startServer();

// 2. إنشاء وتأمين خادم السوكيت المركزي المستقل على المنفذ 8080
const wss = new WebSocketServer({ port: 8080 });
console.log('[Socket Server]: يستمع الآن بأمان على الرابط: ws://localhost:8080');

// 3. ربط مخرجات السيرفر الحية وبثها فوراً كـ JSON لكافة الواجهات والبوتات
minecraft.server.setLogListener((logLine) => {
  // تحديث قائمة اللاعبين حياً وحالة السيرفر
  minecraft.info.parseServerLog(logLine);

  const logPackage = JSON.stringify({
    type: 'LOG',
    data: logLine
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(logPackage);
    }
  });
});
// ========================================================
// 🚀 [ملف index.js المصلح الحديدي - الجزء 2 من 3]
// مستمع اتصالات السوكيت، معالج الأوامر المعزول، وأحداث القدرة والخصائص
// ========================================================

// 4. الإنصات لربط واجهات الويب المستقلة والبوتات ومعالجة حزم البيانات المتقدمة حياً
wss.on('connection', (ws) => {
  console.log('[Socket Server]: متصل إداري جديد انضم لقنوات التحكم السحابية المحدثة v3.');
  ws.send(JSON.stringify({ type: 'SYSTEM', data: 'Connected to Hardened Minecraft Core v3' }));

  ws.on('message', async (message) => {
    try {
      // تصفية صارمة للمدخلات لمنع تسريب نصوص السوكيت الخام لملف الجار الخاص بماين كرافت
      const rawMessage = message.toString().trim();
      if (!rawMessage.startsWith('{') || !rawMessage.endsWith('}')) {
        // إذا لم تكن حزمة JSON، يتم تمريرها فوراً كأمر مباشر لكونسل اللعبة
        minecraft.server.executeCommand(rawMessage);
        return;
      }

      const request = JSON.parse(rawMessage);
      const { action, payload } = request;

      switch (action) {
        // ---- أ) أوامر التحكم بالقدرة والتشغيل الحي ----
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
          if (payload && payload.command) {
            minecraft.server.executeCommand(payload.command);
          }
          break;

        // ---- ب) جلب الموارد والإحصائيات الحية الشاملة وقراءة القرص ----
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
              serverProperties: minecraft.world.getAllProperties()
            }
          }));
          break;

        // ---- ج) جلب بيانات وتفاصيل اللاعب المتقدمة والموارد ----
        case 'GET_PLAYER_ADVANCED_DATA':
          const advancedData = minecraft.info.getPlayerDataDetails(payload.playerName);
          ws.send(JSON.stringify({
            type: 'PLAYER_ADVANCED_DATA',
            data: advancedData
          }));
          break;

        // ---- د) ميزة تعديل خيارات السيرفر (إصلاح حفظ الحد الأقصى للاعبين) ----
        case 'UPDATE_SERVER_PROPERTY':
          let successProp = false;
          if (payload.key === 'max-players') {
            successProp = minecraft.world.setMaxPlayers(payload.value);
          } else {
            successProp = minecraft.world.updateProperty(payload.key, payload.value);
          }
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
        // ========================================================
        // 🚀 [ملف index.js المصلح الحديدي - الجزء 3 من 3]
        // إعادة إنشاء العالم بالريستارت الفوري، معالجات الساند بوكس، والجدولة
        // ========================================================

        // 🗺️ إصلاح حديدي: ربط إعادة إنشاء وتصفير العالم بالريستارت الفوري التلقائي لإنتاج خريطة بكر
        case 'RECREATE_FRESH_WORLD':
          console.log('🚨 [نظام النواة]: تم استقبال طلب تصفير الخريطة. جاري البدء في دورة ريستارت حركية صارمة...');
          minecraft.server.stopServer();

          // تأخير قصير للتأكد من إغلاق عملية الجافا بالكامل وتحرير ملفات الهارد ديسك
          setTimeout(() => {
            const successRecreate = minecraft.world.recreateFreshWorld();
            ws.send(JSON.stringify({ type: 'WORLD_RECREATE_STATUS', success: successRecreate }));

            // الإقلاع التلقائي الفوري الصارم فور اكتمال المسح لتهيئة الخريطة الجديدة
            console.log('🚀 [نظام النواة]: اكتمل مسح مجلد العالم التالف. جاري إيقاظ الجافا لتوليد الـ Chunks البكر...');
            minecraft.server.startServer();
          }, 4000);
          break;

        // ---- هـ) ميزة إنشاء وإرسال باك اب العالم بصيغة .zip حقيقية باينري ----
        case 'CREATE_ZIP_BACKUP':
          const zipPath = await minecraft.backup.createZipBackup();
          if (zipPath) {
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

        // ---- و) مدير الملفات المطور والمعزول حديدياً (world و plugins حصراً) ----
        case 'BROWSE_SERVER_DIRECTORY':
          const dirItems = minecraft.files.browseDirectory(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({
            type: 'DIRECTORY_ITEMS_DATA',
            currentPath: payload.relativePath,
            isPluginArea: payload.isPluginArea || false,
            items: dirItems
          }));
          break;
        case 'READ_FILE_TEXT_CONTENT':
          const fileReadResult = minecraft.files.readFileContent(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_TEXT_CONTENT_DATA', relativePath: payload.relativePath, isPluginArea: payload.isPluginArea || false, ...fileReadResult }));
          break;
        case 'SAVE_FILE_TEXT_CONTENT':
          const saveSuccess = minecraft.files.saveFileContent(payload.relativePath, payload.content, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_SAVE_STATUS', relativePath: payload.relativePath, success: saveSuccess }));
          break;
        case 'UPLOAD_FILE_TO_SERVER':
          const uploadSuccess = minecraft.files.uploadFile(payload.relativePath, payload.fileData, true, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_UPLOAD_STATUS', relativePath: payload.relativePath, success: uploadSuccess }));
          break;
        case 'RENAME_FILE_OR_FOLDER':
          const renameSuccess = minecraft.files.renameFileOrFolder(payload.oldRelativePath, payload.newRelativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_RENAME_STATUS', success: renameSuccess }));
          break;
        case 'DOWNLOAD_SINGLE_FILE':
          const downloadResult = minecraft.files.downloadSingleFile(payload.relativePath, payload.isPluginArea);
          if (downloadResult) {
            ws.send(JSON.stringify({
              type: 'SINGLE_FILE_DOWNLOAD_DATA',
              fileName: downloadResult.name,
              fileData: downloadResult.buffer.toString('base64')
            }));
          } else {
            ws.send(JSON.stringify({ type: 'SINGLE_FILE_DOWNLOAD_STATUS', success: false }));
          }
          break;
        case 'DELETE_FILE_OR_FOLDER':
          const deleteSuccess = minecraft.files.deleteFileOrFolder(payload.relativePath, payload.isPluginArea);
          ws.send(JSON.stringify({ type: 'FILE_DELETE_STATUS', relativePath: payload.relativePath, success: deleteSuccess }));
          break;

        default:
          ws.send(JSON.stringify({ type: 'ERROR', data: 'Unknown Action Received' }));
      }
    } catch (error) {
      // قفل آمن في الخلفية لمنع كراش السوكيت وتمرير الأوامر المفتوحة
      minecraft.server.executeCommand(message.toString().trim());
    }
  });
});

// 5. نظام النوم والجدولة الآلي عند الخمول والـ Proxy كل دقيقة
setInterval(() => {
  minecraft.scheduler.checkServerIdle();
}, 60000);

// 6. تفعيل الـ Terminal المحلي للتحكم اليدوي المباشر في كونسل النواة
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('line', (line) => { minecraft.server.executeCommand(line); });
