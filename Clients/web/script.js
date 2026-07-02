/* ==========================================================
   📡 [محرك الربط التفاعلي المطور - الجزء 1 من 2]
   تأسيس خط اتصال السوكيت والإنصات لحزم جداول اللاعبين المتقدمة
   ========================================================== */

// 1. فتح خط اتصال السوكيت الفوري والمستقل بالخادم المركزي للـ Backend
const ws = new WebSocket('ws://localhost:8080');

// 2. جلب وتأمين عناصر واجهة الويب من الـ DOM لقراءة الكروت
const consoleScreen = document.getElementById('consoleScreen');
const socketIndicator = document.getElementById('socketIndicator');
const badgeStatus = document.getElementById('badgeStatus');
const cardStatus = document.getElementById('cardStatus');

const valStatus = document.getElementById('valStatus');
const valRam = document.getElementById('valRam');
const valCpu = document.getElementById('valCpu');
const valPlayers = document.getElementById('valPlayers');
const countOnline = document.getElementById('countOnline');
const cmdInput = document.getElementById('cmdInput');

// جلب حاويات الجداول الخمسة لحقن الأزرار التفاعلية باللاعبين داخلها حياً
const listOnline = document.getElementById('listOnline');
const listOps = document.getElementById('listOps');
const listWhitelist = document.getElementById('listWhitelist');
const listBanned = document.getElementById('listBanned');
const listBannedIps = document.getElementById('listBannedIps');

// 3. مستمع الأحداث عند نجاح فتح خط الاتصال بالسوكيت المركزي واستقراره
ws.onopen = () => {
  socketIndicator.innerText = 'WebSocket: متصل 🟢';
  socketIndicator.style.color = '#00e676';
  badgeStatus.innerText = 'متصل بخادم السوكيت المركزي بنجاح';
  badgeStatus.style.color = '#00b0ff';

  // طلب حزمة بيانات الموارد والملفات فور قفل خط الاتصال لتهيئة الواجهة
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
      // أ) تحديث كروت الموارد الأربعة العلوية حياً وبأرقام دقيقة
      valStatus.innerText = packet.data.status;
      valRam.innerText = packet.data.ram;
      valCpu.innerText = packet.data.cpu;
      valPlayers.innerText = packet.data.playersCount;
      countOnline.innerText = packet.data.playersCount;

      // تلوين ذكي لكرت الحالة بناءً على وضع خادم ماين كرافت الحالي
      if (packet.data.status === 'ONLINE') {
        valStatus.style.color = '#00e676';
        cardStatus.style.borderColor = 'rgba(0, 230, 118, 0.3)';
      } else if (packet.data.status === 'OFFLINE') {
        valStatus.style.color = '#ff3d00';
        cardStatus.style.borderColor = 'rgba(255, 61, 0, 0.3)';
      }

      // ب) تفعيل التحديث الحي وبناء الجداول الخمسة للاعبين برمجياً بنظام النقر
      renderOnlinePlayersList(packet.data.playersOnline || []);
      renderSimpleList(listOps, packet.data.opsList || [], 'deop', '🛡️ سحب OP', 'mini-kick');
      renderSimpleList(listWhitelist, packet.data.whitelistList || [], 'whitelist remove', '❌ إزالة', 'mini-kick');
      renderSimpleList(listBanned, packet.data.bannedPlayersList || [], 'pardon', '🟢 فك حظر', 'mini-unban');
      renderSimpleList(listBannedIps, packet.data.bannedIpsList || [], 'pardon-ip', '🟢 فك آي بي', 'mini-unban');
    }
  } catch (error) {
    appendLogLine(event.data);
  }
};
/* ==========================================================
   📡 [محرك الربط التفاعلي المطور - الجزء 2 من 2]
   بناء الجداول الحية، الأزرار التفاعلية، والتحكم المنظومي
   ========================================================== */

// 6. دالة بناء جدول اللاعبين المتصلين حياً حياً وتوليد أزرار العقوبات الفردية لهم
function renderOnlinePlayersList(playersArray) {
  listOnline.innerHTML = '';
  if (playersArray.length === 0) {
    listOnline.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:12px; padding:10px;">لا يوجد لاعبين متصلين حالياً</div>';
    return;
  }

  playersArray.forEach(player => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
            <span class="player-name">${player}</span>
            <div class="player-actions">
                <button class="action-mini mini-op" onclick="executeQuickCmd('op ${player}')" title="ترقية لأدمن">👑</button>
                <button class="action-mini mini-kick" onclick="executeQuickCmd('kick ${player} طرد عبر الويب')" title="طرد من السيرفر">🥾</button>
                <button class="action-mini mini-ban" onclick="executeQuickCmd('ban ${player} حظر عبر الويب')" title="حظر نهائي">🚫</button>
            </div>
        `;
    listOnline.appendChild(row);
  });
}

// 7. دالة عامة وذكية لبناء الجداول الأربعة المتبقية (الأدمنية، الوايت لست، المحظورين، والآي بي)
function renderSimpleList(containerElement, dataArray, minecraftCommandPrefix, buttonText, buttonClass) {
  containerElement.innerHTML = '';
  if (dataArray.length === 0) {
    containerElement.innerHTML = '<div style="color:var(--text-muted); font-style:italic; font-size:12px; padding:10px;">القائمة فارغة حالياً</div>';
    return;
  }

  dataArray.forEach(target => {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
            <span class="player-name" title="${target}">${target}</span>
            <div class="player-actions">
                <button class="action-mini ${buttonClass}" onclick="executeQuickCmd('${minecraftCommandPrefix} ${target}')">${buttonText}</button>
            </div>
        `;
    containerElement.appendChild(row);
  });
}

// 8. دالة تنفيذ الأوامر التلقائية الفورية عند النقر على الأزرار المصغرة للاعبين
function executeQuickCmd(rawCommand) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      action: 'MINECRAFT_COMMAND',
      payload: { command: rawCommand }
    }));
    // طلب تحديث البيانات فوراً بعد ثانية واحدة لإعادة قراءة ملفات الـ JSON وتحديث القوائم تلقائياً
    setTimeout(() => sendAction('GET_HOST_STATS'), 1000);
  }
}

// 9. دالة طباعة الأسطر في شاشة الكونسل وتلوينها الذكي والمنظم
function appendLogLine(text) {
  const line = document.createElement('div');
  line.className = 'log-line';

  if (text.includes('[ERROR]') || text.includes('WARN') || text.includes('Exception')) {
    line.className += ' log-error';
  } else if (text.includes('[System]') || text.includes('Connected')) {
    line.className += ' log-system';
  } else if (text.includes('Done') || text.includes('joined the game')) {
    line.className += ' log-info';
  }

  line.innerText = text;
  consoleScreen.appendChild(line);
  consoleScreen.scrollTop = consoleScreen.scrollHeight; // النزول التلقائي لأسفل الشاشة
}

// 10. دالة إرسال الأكشن العام للسوكيت (مثل تشغيل أو ريستارت)
function sendAction(actionName) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ action: actionName }));
  }
}

// 11. دالة إرسال الكوماند المكتوب من شريط الإدخال لكونسل اللعبة
function sendCommand() {
  const commandText = cmdInput.value.trim();
  if (!commandText) return;

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: commandText }
  }));

  cmdInput.value = ''; // تصفير شريط الإدخال
  setTimeout(() => sendAction('GET_HOST_STATS'), 1200); // تحديث الجداول بعد ضغط الإنتر
}

// 12. ربط أزرار التحكم الفوري في الواجهة بالدوال البرمجية المباشرة
document.getElementById('btnStart').onclick = () => sendAction('START_SERVER');
document.getElementById('btnStop').onclick = () => sendAction('STOP_SERVER');
document.getElementById('btnRestart').onclick = () => sendAction('RESTART_SERVER');
document.getElementById('btnRefresh').onclick = () => sendAction('GET_HOST_STATS');
document.getElementById('btnSend').onclick = () => sendCommand();

// 13. مستمع لزر الـ Enter بالكيبورد لسرعة وسهولة إرسال الأوامر يدوياً
cmdInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') sendCommand();
});

// 14. جدولة تلقائية ذكية لتحديث نسب الموارد وإعادة قراءة ملفات الـ JSON كل 5 ثوانٍ حياً وبانتظام
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    sendAction('GET_HOST_STATS');
  }
}, 5000);
