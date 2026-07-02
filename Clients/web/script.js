/* ==========================================================
   📡 [محرك الربط التفاعلي الفائق - الجزء 1 من 2]
   تأسيس خط اتصال السوكيت، قراءة الموارد، وتحديث إعدادات السيرفر حياً
   ========================================================== */

// 1. فتح خط اتصال السوكيت الفوري والمستقل بالخادم المركزي للـ Backend (البورت 8080)
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
const countOnline = document.getElementById('countOnline');
const cmdInput = document.getElementById('cmdInput');

// حاويات جداول اللاعبين الخمسة
const listOnline = document.getElementById('listOnline');
const listOps = document.getElementById('listOps');
const listWhitelist = document.getElementById('listWhitelist');
const listBanned = document.getElementById('listBanned');
const listBannedIps = document.getElementById('listBannedIps');

// حاوية وإحصائيات متصفح ملفات السيرفر الحية
const fileBrowserList = document.getElementById('fileBrowserList');
const currentPathDisplay = document.getElementById('currentPathDisplay');
let currentRelativePath = ""; // حفظ المجلد الحالي للتصفح تكرارياً

// مستمع الأحداث عند نجاح فتح خط الاتصال بالسوكيت المركزي واستقراره
ws.onopen = () => {
  socketIndicator.innerText = 'WebSocket: متصل 🟢';
  socketIndicator.style.color = '#00e676';
  badgeStatus.innerText = 'متصل بخادم السوكيت المركزي بنجاح';
  badgeStatus.style.color = '#00b0ff';

  // طلب حزمة البيانات الشاملة فور الاتصال لتهيئة وإعطاء حالة القرص والإعدادات
  sendAction('GET_HOST_STATS');
  // تصفح المجلد الرئيسي للسيرفر فور الإقلاع
  browseFolder('');
};

ws.onclose = () => {
  socketIndicator.innerText = 'WebSocket: منفصل 🔴';
  socketIndicator.style.color = '#ff3d00';
  badgeStatus.innerText = 'فشل الاتصال - السيرفر المركزي مطفأ';
  badgeStatus.style.color = '#ff3d00';
  valStatus.innerText = 'UNKNOWN';
  valStatus.style.color = '#848d9a';
  cardStatus.style.borderColor = '#222938';
};

// معالجة وتحليل حزم الـ JSON المتقدمة الواردة حياً من ملف index.js الرئيسي
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

      if (packet.data.status === 'ONLINE') {
        valStatus.style.color = '#00e676';
        cardStatus.style.borderColor = 'rgba(0, 230, 118, 0.3)';
      } else {
        valStatus.style.color = '#ff3d00';
        cardStatus.style.borderColor = 'rgba(255, 61, 0, 0.3)';
      }

      // ب) تفعيل التحديث الحي وبناء الجداول الخمسة للاعبين برمجياً بنظام النقر
      renderOnlinePlayersList(packet.data.playersOnline || []);
      renderSimpleList(listOps, packet.data.opsList || [], 'deop', '🛡️ سحب OP', 'mini-kick');
      renderSimpleList(listWhitelist, packet.data.whitelistList || [], 'whitelist remove', '❌ إزالة', 'mini-kick');
      renderSimpleList(listBanned, packet.data.bannedPlayersList || [], 'pardon', '🟢 فك حظر', 'mini-unban');
      renderSimpleList(listBannedIps, packet.data.bannedIpsList || [], 'pardon-ip', '🟢 فك آي بي', 'mini-unban');

      // ج) مزامنة وتحديث قيم لوحة خيارات وإعدادات السيرفر (Aternos Stats Screen)
      syncAternosSettingsPanel(packet.data.serverProperties || {});

    } else if (packet.type === 'PLAYER_ADVANCED_DATA') {
      // د) استقبال حزمة كشف بيانات جرد اللاعب المتقدمة وحقنها في الـ E-View
      displayAdvancedPlayerInventory(packet.data);
    } else if (packet.type === 'DIRECTORY_ITEMS_DATA') {
      // هـ) استقبال قائمة ملفات المجلد المحقونة وتحديث واجهة التصفح
      renderDirectoryFiles(packet.currentPath, packet.items || []);
    } else if (packet.type === 'FILE_TEXT_CONTENT_DATA') {
      // و) فتح محتوى ملف نصي داخل واجهة المحرر السحابي لتعديله
      openFileInEditor(packet.relativePath, packet.success, packet.data);
    } else if (packet.type === 'BACKUP_ZIP_DOWNLOAD') {
      // ز) ميزة فك وتحميل العالم المضغوط .zip تلقائياً في المتصفح وحفظه في جهازك
      downloadBackupZipFile(packet.fileName, packet.fileData);
    }
  } catch (error) {
    appendLogLine(event.data);
  }
};

// دالة تفاعلية لمزامنة الأزرار والـ Select داخل اللوحة بناءً على قيم القرص الحقيقية
function syncAternosSettingsPanel(props) {
  if (props['gamemode']) document.getElementById('setGamemode').value = props['gamemode'];
  if (props['difficulty']) document.getElementById('setDifficulty').value = props['difficulty'];

  // ضبط وتلوين أزرار التبديل (Toggle Buttons) حياً
  const crackBtn = document.getElementById('toggleCrack');
  if (props['online-mode'] === 'false') { // online-mode=false تعني مكرك في ماين كرافت
    crackBtn.innerText = 'مفعل (مكرك) 🔓';
    crackBtn.className = 'toggle-btn active';
  } else {
    crackBtn.innerText = 'معطل (أصلي فقط) 🔐';
    crackBtn.className = 'toggle-btn';
  }

  const wlBtn = document.getElementById('toggleWhitelist');
  if (props['white-list'] === 'true') {
    wlBtn.innerText = 'مفعل 🛡️';
    wlBtn.className = 'toggle-btn active';
  } else {
    wlBtn.innerText = 'معطل 🔓';
    wlBtn.className = 'toggle-btn';
  }
}
/* ==========================================================
   📡 [محرك الربط التفاعلي الفائق - الجزء 2 من 3]
   لوحة جرد حساب اللاعب الرسومية (E) ومتصفح ملفات السيرفر
   ========================================================== */

// 6. دالة بناء جدول اللاعبين المتصلين وتوليد زر كشف بيانات الجرد المتقدمة (E View)
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
            <span class="player-name" style="cursor:pointer; color:var(--accent-blue);" onclick="requestAdvancedPlayerData('${player}')" title="انقر لفتح جرد وبيانات حساب اللاعب">👤 ${player} 🧰</span>
            <div class="player-actions">
                <button class="action-mini mini-op" onclick="executeQuickCmd('op ${player}')" title="ترقية لأدمن">👑</button>
                <button class="action-mini mini-kick" onclick="executeQuickCmd('kick ${player} طرد عبر الويب')" title="طرد من السيرفر">🥾</button>
                <button class="action-mini mini-ban" onclick="executeQuickCmd('ban ${player} حظر عبر الويب')" title="حظر نهائي">🚫</button>
            </div>
        `;
    listOnline.appendChild(row);
  });
}

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

// 7. محرك كشف وعرض بيانات جرد اللاعب الرسومية (Inventory View System - E)
function requestAdvancedPlayerData(playerName) {
  ws.send(JSON.stringify({ action: 'GET_PLAYER_ADVANCED_DATA', payload: { playerName } }));
}

function displayAdvancedPlayerInventory(data) {
  document.getElementById('advPlayerName').innerText = data.name;
  document.getElementById('invUuid').innerText = data.uuid;
  document.getElementById('invPlayTime').innerText = data.playTime;
  document.getElementById('invDeaths').innerText = data.deaths;
  document.getElementById('invJumps').innerText = data.jumps;
  document.getElementById('invPlayerKills').innerText = data.playerKills;
  document.getElementById('invMobKills').innerText = data.mobKills;
  document.getElementById('invAdvancements').innerText = data.advancementsCount;
  document.getElementById('playerAdvancedView').style.display = 'block';
}

function closePlayerInventory() {
  document.getElementById('playerAdvancedView').style.display = 'none';
}

// 8. محرك متصفح ومدير ملفات السيرفر والعالم (Aternos File Manager)
function browseFolder(pathStr) {
  currentRelativePath = pathStr;
  currentPathDisplay.innerText = pathStr === "" ? "المجلد الرئيسي /" : `مجلد: ${pathStr} /`;
  ws.send(JSON.stringify({ action: 'BROWSE_SERVER_DIRECTORY', payload: { relativePath: pathStr } }));
}

function goBackFolder() {
  if (currentRelativePath === "" || currentRelativePath === "/") return;
  const parts = currentRelativePath.split('/');
  parts.pop();
  browseFolder(parts.join('/'));
}

function renderDirectoryFiles(currentPath, itemsArray) {
  fileBrowserList.innerHTML = '';
  if (itemsArray.length === 0) {
    fileBrowserList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:15px; font-size:13px;">هذا المجلد فارغ تماماً</div>';
    return;
  }

  itemsArray.forEach(item => {
    const row = document.createElement('div');
    row.className = 'file-item-row';

    const icon = item.isDirectory ? "📁" : "📄";
    const clickAction = item.isDirectory ? `browseFolder('${item.relativePath}')` : `requestReadFileContent('${item.relativePath}')`;

    row.innerHTML = `
            <div class="file-info" onclick="${clickAction}">
                <span>${icon} <b>${item.name}</b></span>
            </div>
            <div class="file-meta">
                <span>حجم الملف: ${item.size}</span>
                <button class="action-mini mini-kick" onclick="deleteServerFileOrFolder('${item.relativePath}')">🗑️ حذف</button>
            </div>
        `;
    fileBrowserList.appendChild(row);
  });
}
/* ==========================================================
   📡 [محرك الربط التفاعلي الفائق - الجزء 3 من 3]
   محرر النصوص، خصائص السيرفر، ومحرك تنزيل ملف الباك أب الـ zip
   ========================================================== */

// 9. محرك قراءة وحفظ محتويات الملفات نصياً عبر المحرر السحابي
function requestReadFileContent(pathStr) {
  ws.send(JSON.stringify({ action: 'READ_FILE_TEXT_CONTENT', payload: { relativePath: pathStr } }));
}

function openFileInEditor(pathStr, success, content) {
  if (!success) return alert(`فشل فتح الملف: ${content}`);
  document.getElementById('editingFileName').innerText = pathStr;
  document.getElementById('fileEditorTextArea').value = content;
  document.getElementById('fileEditorSection').style.display = 'block';
}

function saveEditingFile() {
  const pathStr = document.getElementById('editingFileName').innerText;
  const text = document.getElementById('fileEditorTextArea').value;
  ws.send(JSON.stringify({ action: 'SAVE_FILE_TEXT_CONTENT', payload: { relativePath: pathStr, content: text } }));
  alert('💾 تم حفظ وتحديث محتوى الملف على القرص بسلام.');
  closeFileEditor();
}

function closeFileEditor() {
  document.getElementById('fileEditorSection').style.display = 'none';
}

function deleteServerFileOrFolder(pathStr) {
  if (confirm(`🚨 هل أنت متأكد نهائياً من حذف: ${pathStr}؟ لا يمكن التراجع!`)) {
    ws.send(JSON.stringify({ action: 'DELETE_FILE_OR_FOLDER', payload: { relativePath: pathStr } }));
    setTimeout(() => browseFolder(currentRelativePath), 1000);
  }
}

function handleFileUpload(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Data = e.target.result.split(',')[1];
    const targetUploadPath = currentRelativePath === "" ? file.name : `${currentRelativePath}/${file.name}`;
    ws.send(JSON.stringify({ action: 'UPLOAD_FILE_TO_SERVER', payload: { relativePath: targetUploadPath, fileData: base64Data } }));
    alert(`📥 جاري رفع ملف: ${file.name} للمجلد المضيف حالياً...`);
    setTimeout(() => browseFolder(currentRelativePath), 1200);
  };
  reader.readAsDataURL(file);
}

// 10. إدارة ومزامنة خصائص السيرفر القياسية (Aternos Options Actions)
function sendServerProperty(key, value) {
  ws.send(JSON.stringify({ action: 'UPDATE_SERVER_PROPERTY', payload: { key, value } }));
}

function toggleServerFeature(feature) {
  if (feature === 'online-mode') {
    const currentText = document.getElementById('toggleCrack').innerText;
    const nextState = currentText.includes('معطل');
    ws.send(JSON.stringify({ action: 'SET_CRACK_TOGGLE', payload: { allowed: nextState } }));
  } else if (feature === 'white-list') {
    const currentText = document.getElementById('toggleWhitelist').innerText;
    const nextState = currentText.includes('معطل');
    ws.send(JSON.stringify({ action: 'SET_WHITELIST_TOGGLE', payload: { enable: nextState } }));
  }
  setTimeout(() => sendAction('GET_HOST_STATS'), 1000);
}

function saveMaxPlayersSetting() {
  const val = parseInt(document.getElementById('setMaxPlayersInput').value, 10);
  ws.send(JSON.stringify({ action: 'UPDATE_SERVER_PROPERTY', payload: { key: 'max-players', value: val } }));
  alert('⚙️ تم حفظ تعديل كاونت اللاعبين، يتطلب إعادة تشغيل السيرفر لتطبيقه.');
}

// 11. محرك معالجة وتنزيل ملفات الـ .zip الخاصة بالنسخ الاحتياطية مباشرة لجهازك
function downloadBackupZipFile(fileName, base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'application/zip' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert(`💾 تم جمد وإنتاج ملف النسخة الاحتياطية بنجاح وتحميله على جهازك باسم:\n${fileName}`);
}

// 12. الأوامر وسجلات الكونسل والجدولة والتحكم بالقدرة العامة
function executeQuickCmd(rawCommand) {
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: rawCommand } }));
  setTimeout(() => sendAction('GET_HOST_STATS'), 1000);
}

function appendLogLine(text) {
  const line = document.createElement('div');
  line.className = 'log-line';
  if (text.includes('[ERROR]') || text.includes('WARN') || text.includes('Exception')) { line.className += ' log-error'; }
  else if (text.includes('[System]') || text.includes('Connected')) { line.className += ' log-system'; }
  else if (text.includes('Done') || text.includes('joined the game')) { line.className += ' log-info'; }
  line.innerText = text;
  consoleScreen.appendChild(line);
  consoleScreen.scrollTop = consoleScreen.scrollHeight;
}

function sendAction(actionName) {
  if (ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify({ action: actionName })); }
}

function sendCommand() {
  const text = cmdInput.value.trim();
  if (!text) return;
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: text } }));
  cmdInput.value = '';
  setTimeout(() => sendAction('GET_HOST_STATS'), 1200);
}

// ربط أحداث الضغط على الأزرار الأساسية بالواجهة
document.getElementById('btnStart').onclick = () => sendAction('START_SERVER');
document.getElementById('btnStop').onclick = () => sendAction('STOP_SERVER');
document.getElementById('btnRestart').onclick = () => sendAction('RESTART_SERVER');
document.getElementById('btnRefresh').onclick = () => sendAction('GET_HOST_STATS');
document.getElementById('btnSend').onclick = () => sendCommand();
document.getElementById('btnDownloadBackup').onclick = () => {
  alert('💾 جاري معالجة وضغط الخريطة حالياً وتحويلها باينري... يرجى عدم قفل الصفحة حتى يتم التنزيل.');
  sendAction('CREATE_ZIP_BACKUP');
};

// مستمع لزر الـ Enter في الكيبورد لسرعة الإرسال
cmdInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') sendCommand(); });

// جدولة التحديث التلقائي للموارد كل 5 ثوانٍ
setInterval(() => { if (ws.readyState === WebSocket.OPEN) { sendAction('GET_HOST_STATS'); } }, 5000);
