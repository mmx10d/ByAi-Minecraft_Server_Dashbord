const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

let serverProcess = null;
const eulaPath = path.join(__dirname, '../eula.txt');

// مستمع خارجي لإرسال البيانات إلى السوكيت ومحلل البيانات
let logListener = () => { };

function setLogListener(listener) {
  logListener = listener;
}

/**
 * دالة للموافقة التلقائية على شروط EULA
 */
function acceptEula() {
  try {
    fs.writeFileSync(eulaPath, 'eula=true', 'utf8');
    console.log('[Minecraft]: تم الموافقة على شروط EULA بنجاح برمجياً.');
    return true;
  } catch (error) {
    console.error('[Minecraft ERROR]: فشل تعديل ملف eula.txt:', error);
    return false;
  }
}

function startServer() {
  if (serverProcess) {
    console.log('[Minecraft]: السيرفر يعمل بالفعل حالياً!');
    return;
  }

  // الموافقة التلقائية قبل التشغيل لضمان عدم توقف السيرفر
  acceptEula();

  console.log('[Minecraft]: جاري تشغيل سيرفر ماين كرافت...');
  serverProcess = spawn('java', ['-Xmx2G', '-Xms2G', '-jar', 'paper.jar', 'nogui']);

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    console.log(text);
    logListener(text); // إرسال السجل حياً
  });

  serverProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    console.error(`[Minecraft ERROR]: ${text}`);
    logListener(`[ERROR]: ${text}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[Minecraft]: تم إغلاق السيرفر برمز الخروج: ${code}`);
    logListener(`[System]: Server exited with code ${code}`);
    serverProcess = null;
  });
}

function stopServer() {
  if (!serverProcess) {
    console.log('[Minecraft]: لا يمكن الإغلاق، السيرفر مطفأ بالفعل.');
    return;
  }
  console.log('[Minecraft]: جاري إرسال أمر الإغلاق الآمن للمحافظة على البيانات...');
  executeCommand('stop');
}

function restartServer() {
  console.log('[Minecraft]: جاري البدء في عملية إعادة التشغيل...');
  if (serverProcess) {
    stopServer();
    const checkInterval = setInterval(() => {
      if (!serverProcess) {
        clearInterval(checkInterval);
        startServer();
      }
    }, 1000);
  } else {
    startServer();
  }
}

function executeCommand(command) {
  if (serverProcess && serverProcess.stdin) {
    serverProcess.stdin.write(command + '\n');
  } else {
    console.log(`[Minecraft]: تعذر تنفيذ الأمر (${command}) لأن السيرفر لا يعمل حالياً.`);
  }
}

module.exports = {
  startServer,
  stopServer,
  restartServer,
  executeCommand,
  acceptEula,
  setLogListener
};
