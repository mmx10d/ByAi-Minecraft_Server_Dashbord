import { spawn } from 'child_process';
import EventEmitter from 'events';

class MinecraftServer extends EventEmitter {
  constructor(jarName = 'paper.jar', memory = '2G') {
    super();
    this.jarName = jarName;
    this.memory = memory;
    this.process = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    // تشغيل سيرفر ماين كرافت كعملية فرعية خلف الكواليس
    this.process = spawn('java', [
      `-Xmx${this.memory}`,
      `-Xms${this.memory}`,
      '-jar',
      this.jarName,
      'nogui'
    ]);

    this.isRunning = true;
    this.emit('status', 'running');

    // قراءة بث البيانات العادية من السيرفر
    this.process.stdout.on('data', (data) => {
      this.emit('console', data.toString().trim());
    });

    // قراءة بث الأخطاء
    this.process.stderr.on('data', (data) => {
      this.emit('console', `[ERROR]: ${data.toString().trim()}`);
    });

    // مراقبة توقف أو إغلاق السيرفر مفاجئاً أو بطلب منك
    this.process.on('close', (code) => {
      this.isRunning = false;
      this.process = null;
      this.emit('status', 'stopped');
      this.emit('console', `Server exited with code ${code}`);
    });
  }

  // إرسال الأوامر المباشرة لكونسول اللعبة
  sendCommand(command) {
    if (!this.isRunning || !this.process) return;
    this.process.stdin.write(command + '\n');
  }

  stop() {
    if (!this.isRunning) return;
    this.sendCommand('stop');
  }
}

export default MinecraftServer;
