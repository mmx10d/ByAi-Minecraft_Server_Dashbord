/* ==========================================================
   📡 [Hardened Progress Tracking Engine - Part 1 of 5]
   WebSocket Configuration, DOM Captures & Core Message Routers
   ========================================================== */

// 1. Establish absolute standalone real-time connection link to socket backend (Port 8080)
const ws = new WebSocket('ws://localhost:8080');

// 2. Safely capture and hook DOM interface elements for execution loops
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

// Upgraded Generation Progress UI elements
const preparationStatusBadge = document.getElementById('preparationStatusBadge');
const progressOuterWrapper = document.getElementById('progressOuterWrapper');
const progressInnerBar = document.getElementById('progressInnerBar');
const progressPercentText = document.getElementById('progressPercentText');

// Connection table mount elements
const listOnline = document.getElementById('listOnline');
const listOps = document.getElementById('listOps');
const listWhitelist = document.getElementById('listWhitelist');
const listBanned = document.getElementById('listBanned');
const listBannedIps = document.getElementById('listBannedIps');

// Isolated Sandbox exploration parameters
const fileBrowserList = document.getElementById('fileBrowserList');
const currentPathDisplay = document.getElementById('currentPathDisplay');
let currentRelativePath = "";
let isPluginAreaActive = false;

// Local caching arrays to guarantee fluid update actions with zero page flicker
let cachedOnlinePlayersJson = "";

// WebSocket lifecycle events
ws.onopen = () => {
  socketIndicator.innerText = 'WebSocket: متصل 🟢';
  socketIndicator.style.color = '#00e676';
  badgeStatus.innerText = 'متصل بخادم السوكيت المركزي بنجاح';
  badgeStatus.style.color = '#00b0ff';

  // Immediately fetch host diagnostics & configurations upon synchronization
  sendAction('GET_HOST_STATS');
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

// Central incoming message hub decoding JSON payloads from index.js
ws.onmessage = (event) => {
  try {
    const packet = JSON.parse(event.data);

    if (packet.type === 'LOG') {
      appendLogLine(packet.data);
      // 🆕 Seamlessly intercept log streams to animate the progress loader
      interceptLogForWorldGeneration(packet.data);
    } else if (packet.type === 'HOST_STATS') {
      // Update global hardware computational cards smoothly
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

      // Only redraw active players if array elements actually change on disk
      const currentPlayersJson = JSON.stringify(packet.data.playersOnline);
      if (currentPlayersJson !== cachedOnlinePlayersJson) {
        cachedOnlinePlayersJson = currentPlayersJson;
        renderOnlinePlayersList(packet.data.playersOnline || []);
      }

      // Repopulate structural list nodes without disrupting view focal points
      renderSimpleList(listOps, packet.data.opsList || [], 'deop', '🛡️ سحب OP', 'mini-kick');
      renderSimpleList(listWhitelist, packet.data.whitelistList || [], 'whitelist remove', '❌ إزالة', 'mini-kick');
      renderSimpleList(listBanned, packet.data.bannedPlayersList || [], 'pardon', '🟢 فك حظر', 'mini-unban');
      renderSimpleList(listBannedIps, packet.data.bannedIpsList || [], 'pardon-ip', '🟢 فك آي بي', 'mini-unban');

      // Map standard property checkboxes
      syncAternosSettingsPanel(packet.data.serverProperties || {});

    } else if (packet.type === 'PLAYER_ADVANCED_DATA') {
      displayAdvancedPlayerDetails(packet.data);
    } else if (packet.type === 'DIRECTORY_ITEMS_DATA') {
      renderDirectoryFiles(packet.currentPath, packet.items || []);
    } else if (packet.type === 'FILE_TEXT_CONTENT_DATA') {
      openFileInEditor(packet.relativePath, packet.success, packet.data);
    } else if (packet.type === 'BACKUP_ZIP_DOWNLOAD' || packet.type === 'SINGLE_FILE_DOWNLOAD_DATA') {
      handleZipOrFileDownloadReady(packet.fileName, packet.fileData);
    }
  } catch (error) {
    appendLogLine(event.data);
  }
};

// Synchronize properties while skipping unneeded updates
function syncAternosSettingsPanel(props) {
  if (props['gamemode']) document.getElementById('setGamemode').value = props['gamemode'];
  if (props['difficulty']) document.getElementById('setDifficulty').value = props['difficulty'];

  const crackBtn = document.getElementById('toggleCrack');
  if (props['online-mode'] === 'false') {
    crackBtn.innerText = 'مفعل (مكرك) ✅';
    crackBtn.className = 'toggle-btn active';
  } else {
    crackBtn.innerText = 'معطل (أصلي فقط) ❌';
    crackBtn.className = 'toggle-btn';
  }

  const wlBtn = document.getElementById('toggleWhitelist');
  if (props['white-list'] === 'true') {
    wlBtn.innerText = 'مفعل ✅';
    wlBtn.className = 'toggle-btn active';
  } else {
    wlBtn.innerText = 'معطل ❌';
    wlBtn.className = 'toggle-btn';
  }
}
/* ==========================================================
   📡 [محرك الويب التفاعلي المصلح - الجزء 2 من 6]
   محرك رصد مخرجات الكونسل الحية وتحريك شريط تقدم توليد الخريطة
   ========================================================== */

// 🆕 محرك الـ RegEx الذكي لالتقاط أسطر توليد عوالم ماين كرافت وتحريك شريط التقدم حياً
function interceptLogForWorldGeneration(logLine) {
  // 1. التقاط بدء مرحلة توليد عوالم ماين كرافت (Overworld, Nether, End)
  if (logLine.includes('Preparing level') || logLine.includes('Selecting spawn point')) {
    preparationStatusBadge.innerText = 'الحالة الإجرائية: PREPARING... ⏳';
    preparationStatusBadge.style.color = 'var(--accent-gold)';
    preparationStatusBadge.style.background = 'rgba(255, 215, 0, 0.05)';

    // إظهار شريط التقدم الرسومي والنسبة المئوية النيون
    progressOuterWrapper.style.display = 'block';
    progressPercentText.style.display = 'block';
    return;
  }

  // 2. التقاط أسطر تقدم الـ Chunks بالـ RegEx (مثال: Preparing spawn area: 45%)
  if (logLine.includes('Preparing spawn area:')) {
    const percentMatch = logLine.match(/Preparing spawn area:\s*([0-9]+)%/);
    if (percentMatch && percentMatch[1]) {
      const percentageValue = parseInt(percentMatch[1], 10);

      // تحريك شريط التقدم الداخلي والنسبة المئوية بنعومة فلكية
      progressInnerBar.style.width = `${percentageValue}%`;
      progressPercentText.innerText = `${percentageValue}%`;

      preparationStatusBadge.innerText = `الحالة الإجرائية: PREPARING (${percentageValue}%) 🏗️`;
      preparationStatusBadge.style.color = 'var(--accent-blue)';
    }
    return;
  }

  // 3. التقاط لحظة الاكتمال التام للتحميل والإقلاع المستقر بنسبة 100%
  if (logLine.includes('Done (') && logLine.includes('For help, type "help"')) {
    progressInnerBar.style.width = '100%';
    progressPercentText.innerText = '100%';

    preparationStatusBadge.innerText = 'الحالة الإجرائية: ONLINE ✅ يعمل بسلام';
    preparationStatusBadge.style.color = 'var(--accent-green)';
    preparationStatusBadge.style.background = 'rgba(0, 230, 118, 0.05)';

    // إخفاء الـ Progress Bar بعد 4 ثوانٍ من استقرار السيرفر لتنظيف مظهر اللوحة العلوية
    setTimeout(() => {
      progressOuterWrapper.style.display = 'none';
      progressPercentText.style.display = 'none';
    }, 4000);
  }
}
/* ==========================================================
   📡 [Hardened Progress Tracking Engine - Part 3 of 6]
   Dynamic Live Player Table Renderers & Administrative Arrays
   ========================================================== */

// 4. Build dynamic active player list container with deep profiling triggers
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
            <span class="player-name" style="cursor:pointer; color:var(--accent-blue);" onclick="requestAdvancedPlayerData('${player}')" title="انقر لعرض تفاصيل وموارد اللاعب">👤 ${player} 🧰</span>
            <div class="player-actions">
                <button class="action-mini mini-op" onclick="executeQuickCmd('op ${player}')" title="ترقية لأدمن">👑</button>
                <button class="action-mini mini-kick" onclick="executeQuickCmd('kick ${player} طرد عبر الويب')" title="طرد من السيرفر">🥾</button>
                <button class="action-mini mini-ban" onclick="executeQuickCmd('ban ${player} حظر عبر الويب')" title="حظر نهائي">🚫</button>
            </div>
        `;
    listOnline.appendChild(row);
  });
}

// 5. Secondary administrative data sync renderer (Ops, Whitelist, Bans)
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
/* ==========================================================
   📡 [محرك الويب التفاعلي المصلح - الجزء 4 من 6]
   تفاصيل وموارد اللاعب المدمجة، وتبديل مجلدات الساند بوكس
   ========================================================== */

// 6. محرك كشف وعرض تفاصيل وموارد اللاعب المدمجة (Player Details & Inventory View)
function requestAdvancedPlayerData(playerName) {
  ws.send(JSON.stringify({ action: 'GET_PLAYER_ADVANCED_DATA', payload: { playerName } }));
}

function displayAdvancedPlayerDetails(data) {
  // الموارد والإحصائيات الحية التي بحوزته أولاً في الأعلى
  document.getElementById('advPlayerName').innerText = data.name;
  document.getElementById('invPlayerKills').innerText = data.playerKills;
  document.getElementById('invMobKills').innerText = data.mobKills;
  document.getElementById('invJumps').innerText = data.jumps;
  document.getElementById('invAdvancements').innerText = data.advancementsCount;

  // معلومات الحساب والاتصال بالخادم بالأسفل لبناء واجهة موحدة
  document.getElementById('invUuid').innerText = data.uuid;
  document.getElementById('invPlayTime').innerText = data.playTime;
  document.getElementById('invDeaths').innerText = data.deaths;

  // إظهار اللوحة المنسقة للمستخدم
  document.getElementById('playerAdvancedView').style.display = 'block';
}

function closePlayerInventory() {
  document.getElementById('playerAdvancedView').style.display = 'none';
}

// 7. محرك تبديل واجهات الملفات المعزولة (العالم world أو الإضافات plugins حصراً)
function switchFileArea(toPluginArea) {
  isPluginAreaActive = toPluginArea;
  const tabWorld = document.getElementById('tabWorldBtn');
  const tabPlugins = document.getElementById('tabPluginsBtn');
  const currentPathDisp = document.getElementById('currentPathDisplay');

  if (toPluginArea) {
    tabPlugins.style.background = 'var(--accent-blue)';
    tabPlugins.style.color = '#000';
    tabWorld.style.background = 'transparent';
    tabWorld.style.color = 'var(--text-main)';
    tabWorld.style.border = '1px solid var(--border-color)';
    currentPathDisp.innerText = "/plugins";
  } else {
    tabWorld.style.background = 'var(--accent-blue)';
    tabWorld.style.color = '#000';
    tabPlugins.style.background = 'transparent';
    tabPlugins.style.color = 'var(--text-main)';
    tabPlugins.style.border = '1px solid var(--border-color)';
    currentPathDisp.innerText = "/world";
  }
  // تصفح المجلد الرئيسي للمنطقة المحددة فور التبديل لضمان الأمان
  browseFolder('');
}
/* ==========================================================
   📡 [Hardened Progress Tracking Engine - Part 5 of 6]
   Sandboxed Directory Traversal Loops & Cyber Modal Prompts
   ========================================================== */

// 8. Dispatch filesystem crawl requests over the WebSocket channel
function browseFolder(pathStr) {
  currentRelativePath = pathStr;
  const prefix = isPluginAreaActive ? "/plugins" : "/world";
  currentPathDisplay.innerText = pathStr === "" ? `${prefix}/` : `${prefix}/${pathStr}/`;

  ws.send(JSON.stringify({
    action: 'BROWSE_SERVER_DIRECTORY',
    payload: { relativePath: pathStr, isPluginArea: isPluginAreaActive }
  }));
}

function goBackFolder() {
  if (currentRelativePath === "" || currentRelativePath === "/") return;
  const parts = currentRelativePath.split('/');
  parts.pop();
  browseFolder(parts.join('/'));
}

// 9. Populating database nodes with utility functions (Download, Delete, and Rename)
function renderDirectoryFiles(currentPath, itemsArray) {
  fileBrowserList.innerHTML = '';
  if (itemsArray.length === 0) {
    fileBrowserList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:15px; font-size:13px;">هذا المجلد المعزول فارغ تماماً</div>';
    return;
  }

  itemsArray.forEach(item => {
    const row = document.createElement('div');
    row.className = 'file-item-row';

    const icon = item.isDirectory ? "📁" : "📄";
    const clickAction = item.isDirectory ? `browseFolder('${item.relativePath}')` : `requestReadFileContent('${item.relativePath}')`;

    let actionButtons = `<button class="action-mini mini-unban" onclick="triggerRenameModal('${item.relativePath}')">📝 اسم</button>`;
    if (!item.isDirectory) {
      actionButtons += ` <button class="action-mini mini-op" onclick="downloadSingleServerFile('${item.relativePath}')">📥 تحميل</button>`;
    }
    actionButtons += ` <button class="action-mini mini-kick" onclick="triggerDeleteFileConfirm('${item.relativePath}')">🗑️ حذف</button>`;

    row.innerHTML = `
            <div class="file-info" onclick="${clickAction}">
                <span>${icon} <b>${item.name}</b></span>
            </div>
            <div class="file-meta">
                <span>الحجم: ${item.size}</span>
                <div class="player-actions">${actionButtons}</div>
            </div>
        `;
    fileBrowserList.appendChild(row);
  });
}

// 10. Cyber-Industrial prompt window overlay event loops (No alert popups)
let activeModalCallback = null;

function showCustomModal(title, bodyText, showInput = false, placeholder = '', callback) {
  document.getElementById('customModalTitle').innerText = title;
  document.getElementById('customModalBody').innerText = bodyText;

  const inputElement = document.getElementById('customModalInput');
  if (showInput) {
    inputElement.value = '';
    inputElement.placeholder = placeholder;
    inputElement.style.display = 'block';
  } else {
    inputElement.style.display = 'none';
  }

  activeModalCallback = callback;
  document.getElementById('customModalContainer').style.display = 'flex';
}

function closeCustomModal() {
  document.getElementById('customModalContainer').style.display = 'none';
  activeModalCallback = null;
}

document.getElementById('customModalConfirmBtn').onclick = function () {
  if (activeModalCallback) {
    const inputVal = document.getElementById('customModalInput').value.trim();
    activeModalCallback(inputVal);
  }
  closeCustomModal();
};
/* ==========================================================
   📡 [محرك الويب التفاعلي المصلح - الجزء 6 من 6]
   إدارة الصناديق المخصصة، محرر النصوص، ونظام الباك أب النيون والكونسل
   ========================================================== */

// 11. تشغيل صناديق التأكيد المخصصة لعمليات الحذف والاسم وإعادة تصفير العالم بالريستارت التلقائي
function triggerDeleteFileConfirm(pathStr) {
  showCustomModal('🗑️ تأكيد الحذف الصارم', `هل أنت متأكد تماماً من تدمير وحذف: ${pathStr}؟ لا يمكن التراجع!`, false, '', function () {
    ws.send(JSON.stringify({ action: 'DELETE_FILE_OR_FOLDER', payload: { relativePath: pathStr, isPluginArea: isPluginAreaActive } }));
    setTimeout(() => browseFolder(currentRelativePath), 1000);
  });
}

function triggerRenameModal(oldPath) {
  showCustomModal('📝 إعادة تسمية المكون', `أدخل الاسم أو المسار الجديد للمكون الحقيقي:`, true, 'مثال: server.properties', function (newName) {
    if (!newName) return;
    ws.send(JSON.stringify({ action: 'RENAME_FILE_OR_FOLDER', payload: { oldRelativePath: oldPath, newRelativePath: newName, isPluginArea: isPluginAreaActive } }));
    setTimeout(() => browseFolder(currentRelativePath), 1000);
  });
}

function triggerWorldRecreationConfirm() {
  showCustomModal('🗺️ تصفير وإعادة إنشاء العالم بالكامل', '🚨 تحذير: سيتم مسح مجلد العالم تماماً وإعادة تشغيل السيرفر تلقائياً فوراً لتوليد عالم جديد بكر! هل تود الاستمرار؟', false, '', function () {
    ws.send(JSON.stringify({ action: 'RECREATE_FRESH_WORLD' }));
  });
}

// 12. محرر النصوص السحابي، التحميل المنفرد الباينري، ورفع ملفات العالم والبلقنز
function requestReadFileContent(pathStr) {
  ws.send(JSON.stringify({ action: 'READ_FILE_TEXT_CONTENT', payload: { relativePath: pathStr, isPluginArea: isPluginAreaActive } }));
}

function openFileInEditor(pathStr, success, content) {
  if (!success) return showCustomModal('❌ فشل فتح الملف', content, false, '', null);
  document.getElementById('editingFileName').innerText = pathStr;
  document.getElementById('fileEditorTextArea').value = content;
  document.getElementById('fileEditorSection').style.display = 'block';
}

function saveEditingFile() {
  const pathStr = document.getElementById('editingFileName').innerText;
  const text = document.getElementById('fileEditorTextArea').value;
  ws.send(JSON.stringify({ action: 'SAVE_FILE_TEXT_CONTENT', payload: { relativePath: pathStr, content: text, isPluginArea: isPluginAreaActive } }));
  showCustomModal('✅ نجاح الحفظ', 'تم حفظ وتحديث محتوى الملف على القرص بسلام.', false, '', null);
  closeFileEditor();
}

function closeFileEditor() { document.getElementById('fileEditorSection').style.display = 'none'; }

function downloadSingleServerFile(pathStr) {
  ws.send(JSON.stringify({ action: 'DOWNLOAD_SINGLE_FILE', payload: { relativePath: pathStr, isPluginArea: isPluginAreaActive } }));
}

function handleFileUpload(inputElement) {
  const file = inputElement.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Data = e.target.result.split(',')[1];
    const targetUploadPath = currentRelativePath === "" ? file.name : `${currentRelativePath}/${file.name}`;
    ws.send(JSON.stringify({ action: 'UPLOAD_FILE_TO_SERVER', payload: { relativePath: targetUploadPath, fileData: base64Data, isPluginArea: isPluginAreaActive } }));
    showCustomModal('📥 جاري رفع الملف', `يتم الآن ضخ ورفع الملف [${file.name}] إلى خادم الاستضافة...`, false, '', null);
    setTimeout(() => browseFolder(currentRelativePath), 1200);
  };
  reader.readAsDataURL(file);
}

// 13. إدارة ومزامنة خصائص السيرفر والتحميل التلقائي لملفات الباينري
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
  showCustomModal('⚙️ تم حفظ الإعداد', 'تم حفظ الحد الأقصى للاعبين بنجاح، يتطلب ريستارت لتطبيقه.', false, '', null);
}

// دالة جديدة ومعدلة: استقبال ملفات الباك أب والملفات الباينري وبناء جاهزية التحميل الفوري النيون
function handleZipOrFileDownloadReady(fileName, base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  const blob = new Blob([bytes], { type: 'application/octet-stream' });

  // إعادة زر الباك أب لوضعه الطبيعي النظيف فوراً
  const backupBtn = document.getElementById('btnDownloadBackup');
  backupBtn.innerHTML = '💾 تنزيل الباك أب (.zip)';
  backupBtn.disabled = false;
  backupBtn.style.background = 'var(--accent-purple)';

  // إظهار صندوق التأكيد المطور مع زر بدء التنزيل المباشر الموثوق فوراً دون وميض
  showCustomModal('📥 جاهزية ملف التحميل السحابي', `تم جمد وضغط ملف العالم [${fileName}] بنجاح وجاهز للسحب الحركي الآن! انقر زر التأكيد لبدء التنزيل الفوري.`, false, '', function () {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// 14. الأوامر وسجلات الكونسل والجدولة والتحكم بالقدرة العامة
function executeQuickCmd(rawCommand) {
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: rawCommand } }));
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
}

document.getElementById('btnStart').onclick = () => sendAction('START_SERVER');
document.getElementById('btnStop').onclick = () => sendAction('STOP_SERVER');
document.getElementById('btnRestart').onclick = () => sendAction('RESTART_SERVER');
document.getElementById('btnRefresh').onclick = () => sendAction('GET_HOST_STATS');
document.getElementById('btnSend').onclick = () => sendCommand();

// سد ثغرة أمر الباك أب المكسور وتفعيل عداد الانتظار الذكي النيون
document.getElementById('btnDownloadBackup').onclick = function () {
  const backupBtn = this;
  backupBtn.innerHTML = '⏳ جاري معالجة وتوليد الباك أب الحقيقي...';
  backupBtn.disabled = true;
  backupBtn.style.background = '#444';

  // إرسال الطلب معزولاً وصارماً كـ Action للسوكيت وليس كنص في الكونسل!
  ws.send(JSON.stringify({ action: 'CREATE_ZIP_BACKUP' }));
};

cmdInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') sendCommand(); });

// الجدولة التلقائية الدورية الصافية لتحديث الموارد كل 5 ثوانٍ بدون وميض
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    sendAction('GET_HOST_STATS');
  }
}, 5000);
