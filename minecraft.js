import { spawn } from 'child_process';
import { EventEmitter } from 'events';

class MinecraftServer extends EventEmitter {
  constructor(jarFile = 'server.jar', memory = '2G') {
    super();
    this.jarFile = jarFile;
    this.memory = memory;
    this.process = null;
  }

  start() {
    if (this.process) {
      this.emit('log', '[SYSTEM]: Server is already running.');
      return;
    }

    // تشغيل عملية الجافا في الخلفية
    this.process = spawn('java', [
      `-Xmx${this.memory}`,
      `-Xms${this.memory}`,
      '-jar',
      this.jarFile,
      'nogui'
    ]);

    // 🔥 هنا السر: قراءة مخرجات السيرفر الحية وتمريرها عبر الـ Event
    this.process.stdout.on('data', (data) => {
      const output = data.toString().trim();
      this.emit('log', output); // إرسال النص إلى ملف index.js

      // إذا اشتغل السيرفر بالكامل، أرسل حدث الجاهزية
      if (output.includes('Done')) {
        this.emit('ready');
      }
    });

    // قراءة الأخطاء وتمريرها أيضاً
    this.process.stderr.on('data', (data) => {
      this.emit('log', `[JAVA ERROR]: ${data.toString().trim()}`);
    });

    // التعامل مع إغلاق السيرفر
    this.process.on('close', (code) => {
      this.emit('log', `[SYSTEM]: Server stopped with code ${code}`);
      this.process = null;
      this.emit('stop');
    });
  }

  // دالة إرسال الأوامر من الكونسل إلى السيرفر
  // دالة إرسال الأوامر المعدلة والمتوافقة مع نظام التشغيل لمنع الكراش
  sendCommand(command) {
    // استيراد os المدمج محلياً لمعرفة رمز السطر الجديد الفعلي للجهاز
    import('os').then((os) => {
      if (this.process && this.process.stdin && this.process.stdin.writable) {
        // استخدام os.EOL بدلاً من '\n' لضمان قراءة ماين كرافت للأمر بدون كراش
        this.process.stdin.write(command + os.EOL);
      } else {
        this.emit('log', '[SYSTEM]: Cannot send command. Server is offline or stdin is closed.');
      }
    }).catch(err => {
      if (this.process && this.process.stdin) this.process.stdin.write(command + '\n');
    });
  }

}

export default MinecraftServer;
