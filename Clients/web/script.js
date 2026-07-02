/* ==========================================================
   📡 [Hardened Frontend Core: script.js - Part 1 of 4]
   WebSocket Life-Cycle Hooks, Global DOM Injections & Option Sync
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

// Table list connection mount targets
const listOnline = document.getElementById('listOnline');
const listOps = document.getElementById('listOps');
const listWhitelist = document.getElementById('listWhitelist');
const listBanned = document.getElementById('listBanned');
const listBannedIps = document.getElementById('listBannedIps');

// Isolated Sandbox exploration parameters (World & Plugins folder separation)
const fileBrowserList = document.getElementById('fileBrowserList');
const currentPathDisplay = document.getElementById('currentPathDisplay');
let currentRelativePath = "";
let isPluginAreaActive = false; // Switches folder boundaries safely

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
    } else if (packet.type === 'HOST_STATS') {
      // A) Update global computation cards (CPU usage calculation is now fixed)
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

      // B) Populate real-time entity state tables
      renderOnlinePlayersList(packet.data.playersOnline || []);
      renderSimpleList(listOps, packet.data.opsList || [], 'deop', '🛡️ سحب OP', 'mini-kick');
      renderSimpleList(listWhitelist, packet.data.whitelistList || [], 'whitelist remove', '❌ إزالة', 'mini-kick');
      renderSimpleList(listBanned, packet.data.bannedPlayersList || [], 'pardon', '🟢 فك حظر', 'mini-unban');
      renderSimpleList(listBannedIps, packet.data.bannedIpsList || [], 'pardon-ip', '🟢 فك آي بي', 'mini-unban');

      // C) Dynamically verify setting statuses with (✅ / ❌) icons
      syncAternosSettingsPanel(packet.data.serverProperties || {});

    } else if (packet.type === 'PLAYER_ADVANCED_DATA') {
      displayAdvancedPlayerDetails(packet.data);
    } else if (packet.type === 'DIRECTORY_ITEMS_DATA') {
      renderDirectoryFiles(packet.currentPath, packet.items || []);
    } else if (packet.type === 'FILE_TEXT_CONTENT_DATA') {
      openFileInEditor(packet.relativePath, packet.success, packet.data);
    } else if (packet.type === 'BACKUP_ZIP_DOWNLOAD' || packet.type === 'SINGLE_FILE_DOWNLOAD_DATA') {
      downloadBinaryZipOrFile(packet.fileName, packet.fileData);
    }
  } catch (error) {
    appendLogLine(event.data);
  }
};

// Synchronize toggles using real database property matches
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
   📡 [Hardened Frontend Core: script.js - Part 2 of 4]
   In-Game Player Data Arrays & Unified Resource Profiler Panels
   ========================================================== */

// 5. Build dynamic active player list container with deep profiling triggers
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

// 6. Secondary state collection layout utility function
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

// 7. Requesting and injecting unified inventory statistics and tracking data (E View)
function requestAdvancedPlayerData(playerName) {
  ws.send(JSON.stringify({ action: 'GET_PLAYER_ADVANCED_DATA', payload: { playerName } }));
}

function displayAdvancedPlayerDetails(data) {
  // In-game properties first
  document.getElementById('advPlayerName').innerText = data.name;
  document.getElementById('invPlayerKills').innerText = data.playerKills;
  document.getElementById('invMobKills').innerText = data.mobKills;
  document.getElementById('invJumps').innerText = data.jumps;
  document.getElementById('invAdvancements').innerText = data.advancementsCount;

  // Connection specifics below
  document.getElementById('invUuid').innerText = data.uuid;
  document.getElementById('invPlayTime').innerText = data.playTime;
  document.getElementById('invDeaths').innerText = data.deaths;

  // Smoothly draw panel block into view
  document.getElementById('playerAdvancedView').style.display = 'block';
}

function closePlayerInventory() {
  document.getElementById('playerAdvancedView').style.display = 'none';
}
/* ==========================================================
   📡 [Hardened Frontend Core: script.js - Part 3 of 4]
   Sandboxed Directory Explorer Tabs & Real-Time File Row Anchors
   ========================================================== */

// 8. Safely isolate and switch workspace boundaries between World and Plugins
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
  // Instantly traverse back to root node of newly queried sandbox area
  browseFolder('');
}

// 9. Dispatching targeted filesystem crawl operations through socket channel
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

// 10. Injecting live filesystem nodes dynamically populated with custom file utilities
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

    // Assembling contextual operations (Rename, Download Single, and Destroy)
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
/* ==========================================================
   📡 [محرك الويب التفاعلي الفائق - الجزء 4 من 4]
   صناديق التأكيد المخصصة، محرر النصوص، والتحميل والرفع الباينري
   ========================================================== */

let activeModalCallback = null;

// 11. محرك تشغيل وإدارة صناديق التأكيد والمدخلات المخصصة (Custom HTML Modals)
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

// تنفيذ الأكشن المربوط عند ضغط زر تأكيد من صندوق المودال المخصص
document.getElementById('customModalConfirmBtn').onclick = function () {
  if (activeModalCallback) {
    const inputVal = document.getElementById('customModalInput').value.trim();
    activeModalCallback(inputVal);
  }
  closeCustomModal();
};

// 12. تشغيل صناديق التأكيد المخصصة لعمليات الحذف والاسم وإعادة تصفير العالم
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
  showCustomModal('🗺️ تصفير وإعادة إنشاء العالم بالكامل', '🚨 تحذير: سيتم مسح مجلد العالم "world" تماماً من الهارد ديسك وتوليد عالم جديد عند الإقلاع القادم! هل تود الاستمرار؟', false, '', function () {
    ws.send(JSON.stringify({ action: 'RECREATE_FRESH_WORLD' }));
  });
}

// 13. محرر النصوص السحابي، التحميل المنفرد الباينري، ورفع ملفات العالم والبلقنز
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
  const file = inputElement.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Data = e.target.result.split(',');
    const targetUploadPath = currentRelativePath === "" ? file.name : `${currentRelativePath}/${file.name}`;
    ws.send(JSON.stringify({ action: 'UPLOAD_FILE_TO_SERVER', payload: { relativePath: targetUploadPath, fileData: base64Data, isPluginArea: isPluginAreaActive } }));
    showCustomModal('📥 جاري رفع الملف', `يتم الآن ضخ ورفع الملف [${file.name}] إلى خادم الاستضافة...`, false, '', null);
    setTimeout(() => browseFolder(currentRelativePath), 1200);
  };
  reader.readAsDataURL(file);
}

// 14. إدارة ومزامنة خصائص السيرفر والتحميل التلقائي لملفات الباينري
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

function downloadBinaryZipOrFile(fileName, base64String) {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }

  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 15. الأوامر وسجلات الكونسل والجدولة والتحكم بالقدرة العامة
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

document.getElementById('btnStart').onclick = () => sendAction('START_SERVER');
document.getElementById('btnStop').onclick = () => sendAction('STOP_SERVER');
document.getElementById('btnRestart').onclick = () => sendAction('RESTART_SERVER');
document.getElementById('btnRefresh').onclick = () => sendAction('GET_HOST_STATS');
document.getElementById('btnSend').onclick = () => sendCommand();
document.getElementById('btnDownloadBackup').onclick = () => {
  showCustomModal('💾 جاري إنشاء الباك أب', 'يتم الآن ضغط ملفات السيرفر كحزمة zip حية باينري... يرجى عدم قفل الصفحة حتى يبدأ التنزيل.', false, '', null);
  sendAction('CREATE_ZIP_BACKUP');
};
cmdInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') sendCommand(); });

setInterval(() => { if (ws.readyState === WebSocket.OPEN) { sendAction('GET_HOST_STATS'); } }, 5000);
