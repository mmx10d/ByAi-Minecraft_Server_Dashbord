import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import MinecraftServer from './minecraft.js'; // يجب كتابة الامتداد .js في نظام الموديل

// توليد بديل لـ __dirname المفقود في نظام الـ ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// تهيئة السيرفر (تأكد من تسمية ملف الجار بـ paper.jar)
const mc = new MinecraftServer('paper.jar', '2G');

// تقديم ملفات الواجهة الساكنة
app.use(express.static(path.join(__dirname, 'public')));

// إدارة أحداث الـ Web Sockets
io.on('connection', (socket) => {
  // بث حالة السيرفر الحالية للمتصفح فور دخوله
  socket.emit('status', mc.isRunning ? 'running' : 'stopped');

  // الاستماع لأزرار التحكم من الواجهة
  socket.on('control', (action) => {
    if (action === 'start') mc.start();
    if (action === 'stop') mc.stop();
  });

  // استقبال الأوامر المكتوبة من المستخدم وتمريرها للسيرفر
  socket.on('command', (cmd) => {
    mc.sendCommand(cmd);
  });
});

// بث مخرجات كونسول اللعبة وحالتها فوراً إلى جميع الواجهات المتصلة
mc.on('console', (line) => io.emit('console', line));
mc.on('status', (status) => io.emit('status', status));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Control panel (ESM) is live at http://localhost:${PORT}`);
});
