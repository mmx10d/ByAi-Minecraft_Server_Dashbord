import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';
import MinecraftServer from './minecraft.js'; // التأكد من الاسم والامتداد بدقة

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// حل مشكلة معرف __dirname في نظام الـ ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد كلاس ماين كرافت (تأكد أن ملف السيرفر في مجلدك اسمه paper.jar)
const mc = new MinecraftServer('paper.jar', '2G');
let onlinePlayers = [];

// إعداد نظام رفع المودات والبلوجنز وحصرها على صيغة .jar
const pluginStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'plugins')); },
  filename: (req, file, cb) => { cb(null, file.originalname); }
});
const uploadPlugin = multer({
  storage: pluginStorage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) === '.jar') cb(null, true);
    else cb(new Error('Only .jar files allowed!'), false);
  }
});

// إعداد رفع حزم العوالم (.zip)
const worldStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'worlds_upload')); },
  filename: (req, file, cb) => { cb(null, 'custom_world.zip'); }
});
const uploadWorld = multer({ storage: worldStorage });

// التأكد من تهيئة المجلدات الأساسية لمنع أخطاء النظام
if (!fs.existsSync('./plugins')) fs.mkdirSync('./plugins');
if (!fs.existsSync('./worlds_upload')) fs.mkdirSync('./worlds_upload');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسارات الرفع (APIs)
app.post('/api/upload-plugin', uploadPlugin.single('pluginFile'), (req, res) => {
  res.json({ success: true, message: 'Plugin uploaded successfully!' });
});

app.post('/api/upload-world', uploadWorld.single('worldFile'), (req, res) => {
  res.json({ success: true, message: 'World package uploaded! Click Apply to inject.' });
});

// دالة فحص حالة الـ EULA
function checkEulaStatus() {
  const eulaPath = path.join(__dirname, 'eula.txt');
  if (fs.existsSync(eulaPath)) {
    const content = fs.readFileSync(eulaPath, 'utf8');
    return content.includes('eula=true');
  }
  return false;
}

// دالة جلب إحصائيات موارد الجهاز الدقيقة (الرام والمعالج ومعلومات الأي بي)
function getSystemStats() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const ramUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(1);
  const usedGB = (usedMemory / (1024 ** 3)).toFixed(2);
  const totalGB = (totalMemory / (1024 ** 3)).toFixed(2);

  const cpus = os.cpus();
  const load = os.loadavg();
  const cpuUsage = ((load[0] / cpus.length) * 100).toFixed(1);

  return {
    ramPercent: ramUsagePercent,
    ramText: `${usedGB} / ${totalGB} GB`,
    cpuPercent: Math.min(cpuUsage, 100).toFixed(1),
    platform: `${os.type()} ${os.arch()}`
  };
}

// معالجة وبث أحداث ومخرجات سيرفر ماين كرافت فوراً للواجهة
mc.on('log', (data) => {
  // 1. السجلات (Logs) الآن تستقبل النص الخام والكامل لكل ما يحدث في الخلفية
  io.emit('system_log', data);

  // 2. الكونسل (Console) في النصف الأيسر يستقبل فقط الأحداث النظيفة والمصفاة
  if (data.includes("Starting minecraft server") || data.includes("Loading properties") || data.includes("Preparing level") || data.includes("Done")) {
    io.emit('console_log', `[SERVER STATUS] ${data}`);
  } else if (data.includes("joined the game") || data.includes("left the game")) {
    io.emit('console_log', `[PLAYER CONNECTION] ${data}`);

    // 🔥 التعديل الذكي هنا: تنظيف التوقيت والرموز الغريبة لاستخراج اسم اللاعب الصافي فقط
    if (data.includes("joined the game")) {
      // إزالة كل ما يسبق كلمة "INFO]:" إن وجد، ثم أخذ الكلمة التي تسبق joined مباشرة
      const cleanLine = data.includes("INFO]:") ? data.split("INFO]:")[1].trim() : data.trim();
      const playerName = cleanLine.split(" joined the game")[0].trim().split(" ").pop();

      if (!onlinePlayers.includes(playerName)) onlinePlayers.push(playerName);
    } else {
      const cleanLine = data.includes("INFO]:") ? data.split("INFO]:")[1].trim() : data.trim();
      const playerName = cleanLine.split(" left the game")[0].trim().split(" ").pop();

      onlinePlayers = onlinePlayers.filter(p => p !== playerName);
    }
    io.emit('update_players', onlinePlayers);
  }
});


mc.on('ready', () => {
  io.emit('status_change', 'running');
});

mc.on('stop', () => {
  onlinePlayers = [];
  io.emit('update_players', onlinePlayers);
  io.emit('status_change', 'stopped');
});

// إدارة اتصالات Socket.io والتحكم بالميزات
io.on('connection', (socket) => {
  // إرسال البيانات الأولية فور دخول المستخدم للوحة
  socket.emit('update_players', onlinePlayers);
  socket.emit('eula_status', checkEulaStatus());

  // جلب عنوان الأي بي المكتشف ونظام التشغيل من مكتبة os
  const networkInterfaces = os.networkInterfaces();
  let localIp = '127.0.0.1';
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
      }
    }
  }

  // 🔥 التعديل هنا: نرسل الـ platform والـ IP معاً فور الاتصال
  socket.emit('server_info', {
    localIp,
    port: 25565,
    platform: `${os.type()} ${os.arch()}`
  });


  // بث تحديثات الرام والمعالج وموارد الجهاز بانتظام كل ثانيتين
  const statsInterval = setInterval(() => {
    socket.emit('sys_stats', getSystemStats());
  }, 2000);

  // الاستماع لأوامر التحكم (تشغيل / إيقاف / ريستارت) من الأزرار الفوقية
  socket.on('server_action', (action) => {
    if (action === 'start') {
      if (!checkEulaStatus()) {
        socket.emit('console_log', '[SYSTEM]: Cannot start server without accepting EULA first.');
        return;
      }
      io.emit('status_change', 'preparing');
      mc.start();
    } else if (action === 'stop') {
      mc.sendCommand('stop');
    } else if (action === 'restart') {
      io.emit('status_change', 'preparing');
      mc.sendCommand('stop');
      setTimeout(() => { mc.start(); }, 5000);
    }
  });

  // الموافقة على اتفاقية الـ EULA من المتصفح
  socket.on('accept_eula', () => {
    const eulaPath = path.join(__dirname, 'eula.txt');
    fs.writeFileSync(eulaPath, 'eula=true\n');
    io.emit('eula_status', true);
    io.emit('console_log', '[SYSTEM]: EULA accepted successfully.');
  });

  // معالجة خيارات تفاصيل العالم المتقدمة عند إعادة الإنشاء
  socket.on('regenerate_world', (config) => {
    const propertiesPath = path.join(__dirname, 'server.properties');
    if (fs.existsSync(propertiesPath)) {
      let content = fs.readFileSync(propertiesPath, 'utf8');
      content = content.replace(/gamemode=.*/, `gamemode=${config.gamemode}`);
      content = content.replace(/level-type=.*/, `level-type=${config.type}`);
      fs.writeFileSync(propertiesPath, content);
      io.emit('console_log', `[SYSTEM]: World settings updated. Default gamemode: ${config.gamemode}, Type: ${config.type}.`);
    }
  });

  // معالجة أوامر اللاعبين المتقدمة بشكل مستقر
  socket.on('player_command', ({ player, commandType }) => {
    // حماية إضافية: التأكد من أن اسم اللاعب والوضع ليسوا فارغين
    if (!player || !commandType) return;

    switch (commandType) {
      case 'kick': mc.sendCommand(`kick ${player} Kicked by Web Admin`); break;
      case 'ban': mc.sendCommand(`ban ${player}`); break;
      case 'banip': mc.sendCommand(`ban-ip ${player}`); break;
      case 'gmc': mc.sendCommand(`gamemode creative ${player}`); break;
      case 'gms': mc.sendCommand(`gamemode survival ${player}`); break;
      case 'gma': mc.sendCommand(`gamemode adventure ${player}`); break;
      case 'gmsp': mc.sendCommand(`gamemode spectator ${player}`); break;
    }
  });


  // تمرير الأوامر المكتوبة يدوياً في كونسل الويب إلى السيرفر
  socket.on('send_command', (cmd) => {
    mc.sendCommand(cmd);
  });

  socket.on('disconnect', () => {
    clearInterval(statsInterval);
  });
});

server.listen(3000, () => {
  console.log('🔗 Control Panel Ready: http://localhost:3000');
});
