/* ==========================================================
   📡 [محرك الربط التفاعلي المستقل - الجزء 1 من 2]
   فتح خط الاتصال بالسوكيت المركزي، والإنصات لحزم البيانات (JSON)
   ========================================================== */

// 1. فتح خط اتصال السوكيت الفوري والمستقل بالخادم المركزي للـ Backend
const ws = new WebSocket('ws://localhost:8080');

// 2. جلب وتأمين عناصر واجهة الويب من الـ DOM
const consoleScreen = document.getElementById('consoleScreen');
const socketIndicator = document.getElementById('socketIndicator');
const badgeStatus = document.getElementById('badgeStatus');
const cardStatus = document.getElementById('cardStatus');

const valStatus = document.getElementById('valStatus');
const valRam = document.getElementById('valRam');
const valCpu = document.getElementById('valCpu');
const valPlayers = document.getElementById('valPlayers');

const cmdInput = document.getElementById('cmdInput');

// 3. مستمع الأحداث عند نجاح فتح خط الاتصال بالسوكيت المركزي واستقراره
ws.onopen = () => {
  socketIndicator.innerText = 'WebSocket: متصل 🟢';
  socketIndicator.style.color = '#00e676';
  badgeStatus.innerText = 'متصل بخادم السوكيت المركزي بنجاح';
  badgeStatus.style.color = '#00b0ff';

  // طلب حزمة بيانات الموارد الحية فور قفل خط الاتصال لتهيئة الشاشة
  sendAction('GET_HOST_STATS');
};

// 4. معالجة انقطاع الاتصال المفاجئ بالشبكة أو عند إطفاء خادم الـ Node.js
ws.onclose = () => {
  socketIndicator.innerText = 'WebSocket: منفصل 🔴';
  socketIndicator.style.color = '#ff3d00';
  badgeStatus.innerText = 'فشل الاتصال - الخادم المركزي مطفأ';
  badgeStatus.style.color = '#ff3d00';
  valStatus.innerText = 'UNKNOWN';
  valStatus.style.color = '#848d9a';
  cardStatus.style.borderColor = '#222938';
};

// 5. استقبال وتحليل حزم الـ JSON الواردة حياً من ملف index.js الرئيسي
ws.onmessage = (event) => {
  try {
    const packet = JSON.parse(event.data);

    if (packet.type === 'LOG') {
      appendLogLine(packet.data);
    } else if (packet.type === 'HOST_STATS') {
      // تحديث كروت الموارد الأربعة حياً وبأرقام دقيقة
      valStatus.innerText = packet.data.status;
      valRam.innerText = packet.data.ram;
      valCpu.innerText = packet.data.cpu;
      valPlayers.innerText = packet.data.playersCount;

      // تلوين ذكي لكرت الحالة بناءً على وضع خادم ماين كرافت الحالي
      if (packet.data.status === 'ONLINE') {
        valStatus.style.color = '#00e676';
        cardStatus.style.borderColor = 'rgba(0, 230, 118, 0.3)';
      } else if (packet.data.status === 'OFFLINE') {
        valStatus.style.color = '#ff3d00';
        cardStatus.style.borderColor = 'rgba(255, 61, 0, 0.3)';
      }
    }
  } catch (error) {
    // خيار احتياطي عادي لحماية الكونسل في حال وصول سجل نصي مجرد
    appendLogLine(event.data);
  }
};
/* ==========================================================
   📡 [محرك الربط التفاعلي المستقل - الجزء 2 من 2]
   تلوين السجلات، إرسال الأوامر، ربط الأزرار، والجدولة الحية
   ========================================================== */

// 6. دالة طباعة الأسطر في شاشة الكونسل وتلوينها الذكي والمنظم
function appendLogLine(text) {
  const line = document.createElement('div');
  line.className = 'log-line';

  // فحص الكلمات المفتاحية لتلوين السجلات لمحاكاة شاشات الاستضافة العالمية
  if (text.includes('[ERROR]') || text.includes('WARN') || text.includes('Exception')) {
    line.className += ' log-error';
  } else if (text.includes('[System]') || text.includes('Connected')) {
    line.className += ' log-system';
  } else if (text.includes('Done') || text.includes('joined the game')) {
    line.className += ' log-info';
  }

  line.innerText = text;
  consoleScreen.appendChild(line);

  // النزول التلقائي لأسفل الشاشة لمتابعة مخرجات الكونسل الحية فوراً
  consoleScreen.scrollTop = consoleScreen.scrollHeight;
}

// 7. دالة إرسال الأكشن العام للسوكيت (مثل تشغيل أو ريستارت)
function sendAction(actionName) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: actionName }));
  }
}

// 8. دالة إرسال الكوماند المكتوب من شريط الإدخال لكونسل اللعبة
function sendCommand() {
  const commandText = cmdInput.value.trim();
  if (!commandText) return;

  // تغليف الأمر داخل البروتوكول الموحد المتوافق مع معالج index.js
  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: commandText }
  }));

  cmdInput.value = ''; // تصفير شريط الإدخال فوراً
}

// 9. ربط أزرار التحكم الفوري في الواجهة بالدوال البرمجية المباشرة
document.getElementById('btnStart').onclick = () => sendAction('START_SERVER');
document.getElementById('btnStop').onclick = () => sendAction('STOP_SERVER');
document.getElementById('btnRestart').onclick = () => sendAction('RESTART_SERVER');
document.getElementById('btnRefresh').onclick = () => sendAction('GET_HOST_STATS');
document.getElementById('btnSend').onclick = () => sendCommand();

// 10. مستمع لزر الـ Enter بالكيبورد لسرعة وسهولة إرسال الأوامر دون ضغط الزر بالماوس
cmdInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') sendCommand();
});

// 11. جدولة تلقائية لتحديث نسب استهلاك الرام والمعالج كل 5 ثوانٍ حياً وبانتظام
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    sendAction('GET_HOST_STATS');
  }
}, 5000);
