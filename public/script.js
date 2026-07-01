const socket = io();
let currentLang = 'ar'; // اللغة الافتراضية عند فتح اللوحة هي العربية

// قاموس الترجمة الشامل لإدارة لغة الواجهة فقط بمرونة تامة لراحة المستخدم
const translations = {
  ar: {
    title: '<i class="fa-solid fa-sliders"></i> لوحة التحكم',
    langBtn: '<i class="fa-solid fa-globe"></i> English',
    start: 'تشغيل', stop: 'إيقاف',
    ramTitle: '<i class="fa-solid fa-microchip"></i> استهلاك الذاكرة (RAM)',
    cpuTitle: '<i class="fa-solid fa-gauge-high"></i> استهلاك المعالج (CPU)',
    ipTitle: '<i class="fa-solid fa-network-wired"></i> عنوان السيرفر (Local IP)',
    osTitle: '<i class="fa-solid fa-server"></i> نظام التشغيل المضيف',
    tabPlayers: '<i class="fa-solid fa-users"></i> اللاعبين',
    tabLogs: '<i class="fa-solid fa-file-lines"></i> السجلات (Logs)',
    tabPlugins: '<i class="fa-solid fa-puzzle-piece"></i> الإضافات',
    tabWorld: '<i class="fa-solid fa-earth-americas"></i> العالم',
    onlinePlayers: 'اللاعبين المتصلين',
    noPlayers: 'لا يوجد لاعبين حالياً.',
    sysLogsTitle: 'سجلات العمليات الخلفية المستقلة (Logs)',
    pluginsTitle: 'إدارة المودات والبلوجنز',
    btnPlugin: 'رفع ملف Plugin (.jar)',
    worldTitle: 'ملفات وإعدادات العالم',
    btnWorldUpload: 'رفع حزمة عالم جديدة (.zip)',
    btnWorldApply: 'تطبيق العالم المرفوع',
    btnWorldRegen: 'إعادة إنشاء العالم الافتراضي',
    modalTitle: 'تعديل إعدادات إعادة الإنشاء',
    modalGm: 'الوضع الافتراضي (Gamemode):',
    modalType: 'نوع العالم (World Type):',
    modalConfirm: 'تأكيد وإعادة الإنشاء',
    optSurvival: 'Survival (بقاء)', optCreative: 'Creative (إبداعي)', optAdventure: 'Adventure (مغامرة)',
    optNormal: 'Normal (عادي)', optFlat: 'Flat (مسطح)', optLarge: 'Large Biomes (تضاريس عملاقة)',
    alertPluginUpload: 'جاري رفع الإضافة...',
    alertWorldUpload: 'جاري رفع حزمة العالم، يرجى الانتظار...',
    alertWorldApply: 'تم تطبيق العالم الجديد بنجاح في ملفات السيرفر السفلية.',
    alertWorldRegenSuccess: 'تم تحديث خيارات إعادة الإنشاء الافتراضية بنجاح.',
    eulaWarn: 'اتفاقية ماين كرافت (EULA): يجب عليك الموافقة على شروط شركة Mojang لتشغيل السيرفر.',
    eulaBtn: 'أوافق على الاتفاقية (Agree)'
  },
  en: {
    title: '<i class="fa-solid fa-sliders"></i> Control Panel',
    langBtn: '<i class="fa-solid fa-globe"></i> العربية',
    start: 'Start', stop: 'Stop',
    ramTitle: '<i class="fa-solid fa-microchip"></i> Memory Usage (RAM)',
    cpuTitle: '<i class="fa-solid fa-gauge-high"></i> Processor Usage (CPU)',
    ipTitle: '<i class="fa-solid fa-network-wired"></i> Server Address (Local IP)',
    osTitle: '<i class="fa-solid fa-server"></i> Host Operating System',
    tabPlayers: '<i class="fa-solid fa-users"></i> Players',
    tabLogs: '<i class="fa-solid fa-file-lines"></i> Logs',
    tabPlugins: '<i class="fa-solid fa-puzzle-piece"></i> Plugins',
    tabWorld: '<i class="fa-solid fa-earth-americas"></i> World',
    onlinePlayers: 'Online Players',
    noPlayers: 'No online players currently.',
    sysLogsTitle: 'Independent Background Logs',
    pluginsTitle: 'Manage Mods & Plugins',
    btnPlugin: 'Upload Plugin File (.jar)',
    worldTitle: 'World Files & Configs',
    btnWorldUpload: 'Upload New World Pack (.zip)',
    btnWorldApply: 'Apply Uploaded World',
    btnWorldRegen: 'Regenerate Default World',
    modalTitle: 'Modify Regeneration Settings',
    modalGm: 'Default Gamemode:',
    modalType: 'World Type:',
    modalConfirm: 'Confirm & Regenerate',
    optSurvival: 'Survival', optCreative: 'Creative', optAdventure: 'Adventure',
    optNormal: 'Normal', optFlat: 'Flat', optLarge: 'Large Biomes',
    alertPluginUpload: 'Uploading plugin...',
    alertWorldUpload: 'Uploading world pack, please wait...',
    alertWorldApply: 'New world applied successfully in core files.',
    alertWorldRegenSuccess: 'Default regeneration configurations updated.',
    eulaWarn: 'Minecraft Agreement (EULA): You must accept Mojang terms to start the server.',
    eulaBtn: 'I Agree'
  }
};

// دالة تبديل اللغات وتعديل اتجاه واجهة الصفحة (RTL / LTR) لراحة المستخدم
function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  const htmlEl = document.getElementById('main-html');

  if (currentLang === 'ar') {
    htmlEl.setAttribute('dir', 'rtl');
    htmlEl.setAttribute('lang', 'ar');
  } else {
    htmlEl.setAttribute('dir', 'ltr');
    htmlEl.setAttribute('lang', 'en');
  }

  const lang = translations[currentLang];
  document.getElementById('txt-title').innerHTML = lang.title;
  document.getElementById('lang-toggle-btn').innerHTML = lang.langBtn;
  document.getElementById('txt-start').textContent = lang.start;
  document.getElementById('txt-stop').textContent = lang.stop;
  document.getElementById('txt-ram-title').innerHTML = lang.ramTitle;
  document.getElementById('txt-cpu-title').innerHTML = lang.cpuTitle;
  document.getElementById('txt-ip-title').innerHTML = lang.ipTitle;
  document.getElementById('txt-os-title').innerHTML = lang.osTitle;
  document.getElementById('tab-players-btn').innerHTML = lang.tabPlayers;
  document.getElementById('tab-logs-btn').innerHTML = lang.tabLogs;
  document.getElementById('tab-plugins-btn').innerHTML = lang.tabPlugins;
  document.getElementById('tab-world-btn').innerHTML = lang.tabWorld;
  document.getElementById('txt-online-players').textContent = lang.onlinePlayers;
  document.getElementById('txt-sys-logs-title').textContent = lang.sysLogsTitle;
  document.getElementById('txt-plugins-title').textContent = lang.pluginsTitle;
  document.getElementById('txt-btn-plugin').textContent = lang.btnPlugin;
  document.getElementById('txt-world-title').textContent = lang.worldTitle;
  document.getElementById('txt-btn-world-upload').textContent = lang.btnWorldUpload;
  document.getElementById('txt-btn-world-apply').textContent = lang.btnWorldApply;
  document.getElementById('txt-btn-world-regen').textContent = lang.btnWorldRegen;
  document.getElementById('txt-modal-title').textContent = lang.modalTitle;
  document.getElementById('txt-modal-gm').textContent = lang.modalGm;
  document.getElementById('txt-modal-type').textContent = lang.modalType;
  document.getElementById('txt-modal-confirm').textContent = lang.modalConfirm;
  document.getElementById('opt-survival').textContent = lang.optSurvival;
  document.getElementById('opt-creative').textContent = lang.optCreative;
  document.getElementById('opt-adventure').textContent = lang.optAdventure;
  document.getElementById('opt-normal').textContent = lang.optNormal;
  document.getElementById('opt-flat').textContent = lang.optFlat;
  document.getElementById('opt-large').textContent = lang.optLarge;
  document.getElementById('txt-eula-warn').textContent = lang.eulaWarn;
  document.getElementById('txt-eula-btn').textContent = lang.eulaBtn;

  const pList = document.getElementById('players-list');
  if (pList.querySelector('.placeholder')) {
    pList.innerHTML = `<p class="placeholder">${lang.noPlayers}</p>`;
  }
}

// التبديل السلس بين التبويبات والقوائم الجانبية
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
}
// دوال إرسال الأوامر والإجراءات للسيرفر الخلفي
function sendAction(action) { socket.emit('server_action', action); }
function acceptEula() { socket.emit('accept_eula'); }

function executeCommand(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('cmd-input');
    socket.emit('send_command', input.value);
    input.value = '';
  }
}

function sendPlayerCmd(player, commandType) {
  socket.emit('player_command', { player, commandType });
}

// ميزة رفع ملفات المودات والبلوجنز وحصرها
function uploadPluginFile() {
  const fileInput = document.getElementById('plugin-file-input');
  if (!fileInput.files[0]) return;
  const formData = new FormData();
  formData.append('pluginFile', fileInput.files[0]);

  document.getElementById('plugin-status').textContent = translations[currentLang].alertPluginUpload;
  fetch('/api/upload-plugin', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => { document.getElementById('plugin-status').textContent = data.message; });
}

// ميزة إدارة وحقن حزم العوالم
function uploadWorldFile() {
  const fileInput = document.getElementById('world-file-input');
  if (!fileInput.files[0]) return;
  const formData = new FormData();
  formData.append('worldFile', fileInput.files[0]);
  alert(translations[currentLang].alertWorldUpload);
  fetch('/api/upload-world', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => alert(data.message));
}

function applyUploadedWorld() { alert(translations[currentLang].alertWorldApply); }
function openRegenModal() { document.getElementById('regen-modal').style.display = 'block'; }

function submitWorldRegen() {
  const gamemode = document.getElementById('world-gamemode').value;
  const type = document.getElementById('world-type').value;
  socket.emit('regenerate_world', { gamemode, type });
  document.getElementById('regen-modal').style.display = 'none';
  alert(translations[currentLang].alertWorldRegenSuccess);
}

// استقبال حالة الـ EULA وعرض تنبيه الموافقة إن لزم الأمر
socket.on('eula_status', (accepted) => {
  document.getElementById('eula-box').style.display = accepted ? 'none' : 'block';
});

// ميزة عرض استخدام الرامات ومعلومات الجهاز والأي بي بدقة
socket.on('sys_stats', (stats) => {
  document.getElementById('ram-stat').textContent = `${stats.ramPercent}% (${stats.ramText})`;
  document.getElementById('cpu-stat').textContent = `${stats.cpuPercent}%`;
});

socket.on('server_info', (info) => {
  document.getElementById('ip-stat').textContent = `${info.localIp}:${info.port}`;
  document.getElementById('os-stat').textContent = info.platform;
});

// استقبال مخرجات الكونسل الحية (إنجليزية صارمة وثابتة في النصف الأيسر)
const consoleDiv = document.getElementById('console-log');
socket.on('console_log', (log) => {
  consoleDiv.textContent += '\n' + log;
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
});

// استقبال السجلات الحيوية المستقلة (Logs - إنجليزية صارمة)
const logsDiv = document.getElementById('system-logs-box');
socket.on('system_log', (log) => {
  logsDiv.textContent += '\n' + log;
  logsDiv.scrollTop = logsDiv.scrollHeight;
});

// التحكم بحالة السيرفر، وتفعيل الأنميشن الحركي (Loader) عند التحضير
socket.on('status_change', (status) => {
  const indicator = document.getElementById('status-indicator');
  const loader = document.getElementById('loader-bar');
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');

  if (status === 'preparing') {
    indicator.textContent = 'Preparing server... Please wait';
    indicator.className = 'status-preparing';
    loader.style.display = 'block'; // تشغيل الأنميشن الحركي فوراً
    btnStart.style.display = 'none';
    btnStop.style.display = 'none';
  } else if (status === 'running') {
    indicator.textContent = 'ONLINE';
    indicator.className = 'status-running';
    loader.style.display = 'none';
    btnStart.style.display = 'none';
    btnStop.style.display = 'inline-block';

    // 🔥 تشغيل صوت تنبيه عند تشغيل السيرفر بالكامل
    // يمكنك استخدام أي رابط صوت mp3 مباشر من الإنترنت، مثل نغمة إشعارات خفيفة
    const onlineSound = new Audio('https://mixkit.co');
    onlineSound.play().catch(e => console.log("Audio play blocked by browser preview settings. Click on the page first."));
  } else if (status === 'stopped') {
    indicator.textContent = 'OFFLINE';
    indicator.className = 'status-stopped';
    loader.style.display = 'none';
    btnStart.style.display = 'inline-block';
    btnStop.style.display = 'none';
  }
});

let currentPlayersList = [];
let activeSelectedPlayer = null;

// دالة لبناء وعرض واجهة اللاعبين (تتعامل مع قائمة الكل أو لاعب محدد)
function renderPlayersUI() {
  const list = document.getElementById('players-list');

  // 1. إذا كان المستخدم يتصفح لاعب معين حالياً
  if (activeSelectedPlayer) {
    // التحقق مما إذا كان اللاعب المحدد لا يزال متصلاً في السيرفر
    if (!currentPlayersList.includes(activeSelectedPlayer)) {
      activeSelectedPlayer = null; // إعادة التعيين إذا خرج اللاعب أثناء تصفحه
    }
  }

  // 2. عرض صفحة التحكم باللاعب المحدد
  if (activeSelectedPlayer) {
    list.innerHTML = `
            <div style="background: var(--bg-accent); padding: 15px; border-radius: 6px;">
                <!-- زر العودة لقائمة اللاعبين مع أيقونة سهم -->
                <button onclick="goBackToPlayersList()" class="lang-btn" style="margin-bottom: 15px; width: auto;">
                    <i class="fa-solid fa-arrow-right"></i> رجوع / Back
                </button>
                
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                    <!-- جلب وجه اللاعب الفعلي من الـ API -->
                    <img src="https://minotar.net{activeSelectedPlayer}/50" style="border-radius: 4px; background: #000; padding: 2px;" alt="${activeSelectedPlayer}">
                    <h3 style="margin:0;">🎮 ${activeSelectedPlayer}</h3>
                </div>

                                <!-- قائمة خيارات Gamemode الاحترافية المعدلة لمنع الانهيار -->
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 13px; color: var(--text-muted); display:block; margin-bottom: 5px;">تغيير وضع اللعب (Gamemode):</label>
                    <select onchange="if(this.value) sendPlayerCmd('${activeSelectedPlayer}', this.value)" style="width:100%; padding:10px; background:#000; color:#fff; border:1px solid #444; border-radius:4px;">
                        <option value="" disabled selected>--- اختر الوضع / Select Mode ---</option>
                        <option value="gms">Survival (بقاء)</option>
                        <option value="gmc">Creative (إبداعي)</option>
                        <option value="gma">Adventure (مغامرة)</option>
                        <option value="gmsp">Spectator (مشاهد)</option>
                    </select>
                </div>


                <!-- أزرار الإجراءات المتقدمة المتبقية مدعومة بأيقونات احترافية -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <button class="action-btn" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'invsee')"><i class="fa-solid fa-box"></i> Inventory</button>
                    <button class="action-btn" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'endersee')"><i class="fa-solid fa-gem"></i> Ender Chest</button>
                    <button class="action-btn" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'lastdeath')"><i class="fa-solid fa-skull"></i> Respawn Death</button>
                    <button class="btn-danger" style="grid-column: span 2;" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'kick')"><i class="fa-solid fa-door-open"></i> طرد (Kick)</button>
                    <button class="btn-danger" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'ban')"><i class="fa-solid fa-ban"></i> حظر (Ban)</button>
                    <button class="btn-danger" onclick="sendPlayerCmd('${activeSelectedPlayer}', 'banip')"><i class="fa-solid fa-fingerprint"></i> حظر IP</button>
                </div>
            </div>
        `;
    return;
  }

  // 3. عرض قائمة جميع اللاعبين المتصلين (الواجهة الافتراضية)
  if (currentPlayersList.length === 0) {
    list.innerHTML = `<p class="placeholder">${translations[currentLang].noPlayers}</p>`;
    return;
  }

  list.innerHTML = '';
  currentPlayersList.forEach(player => {
    list.innerHTML += `
            <div class="player-card" onclick="selectPlayerToManage('${player}')" style="cursor: pointer; transition: 0.2s;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <!-- إظهار صورة وجه اللاعب بجانب اسمه في القائمة العامة -->
                    <img src="https://minotar.net{player}/32" style="border-radius: 4px; background: #000;" alt="${player}">
                    <strong>🎮 ${player}</strong>
                </div>
                <!-- أيقونة سهم أو إشارة تدل على إمكانية الضغط والدخول بالتفاصيل -->
                <span style="color: var(--color-blue); font-size: 13px;"><i class="fa-solid fa-chevron-left"></i> إدارة</span>
            </div>
        `;
  });
}

// دالة يضغط عليها الكرت العام لتحديد لاعب معين ودخول صفحته
function selectPlayerToManage(player) {
  activeSelectedPlayer = player;
  renderPlayersUI();
}

// دالة زر الرجوع للعودة للقائمة الكاملة
function goBackToPlayersList() {
  activeSelectedPlayer = null;
  renderPlayersUI();
}

// مستمع حدث تحديث اللاعبين من السيرفر
socket.on('update_players', (players) => {
  currentPlayersList = players;
  renderPlayersUI(); // إعادة بناء الواجهة بناءً على البيانات الجديدة
});
