// ========================================================
// 🤖 [Hardened Telegram Control Hub - Part 1 of 4]
// Global Imports, Authentication Shields, & Master Menu Boards
// ========================================================

const { Telegraf, Markup } = require('telegraf');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// Instantiate the robot shell and hard-wire connection loops to the core socket engine
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ws = new WebSocket(process.env.SOCKET_URL);

// System state caches for active path tracking and victim contexts
let selectedPlayerContext = "";
let currentTelegramRelativePath = "";
let isTgPluginAreaActive = false; // Isolates world files from plugins boundary

/**
 * Ironclad authentication shield verification lookup 
 * Assures absolute zero intrusion by cross-matching message usernames directly against the root .env configuration
 */
function isAdmin(ctx) {
  if (!ctx.from || !ctx.from.username) return false;
  return ctx.from.username.toLowerCase() === process.env.TELEGRAM_ADMIN_USERNAME.toLowerCase().replace('@', '');
}

// ========================================================
// 🎨 Structural Tree Architecture (Inline Keyboards)
// ========================================================

// 1. Central Operational Dashboard Grid Command Map
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('👥 اللاعبين أونلاين 🎮', 'MENU_PLAYERS')],
  [Markup.button.callback('👑 المسؤولين (OP)', 'MENU_OPS'), Markup.button.callback('🛡️ الوايت لست', 'MENU_WL')],
  [Markup.button.callback('🚫 المحظورين (Ban)', 'MENU_BANLIST'), Markup.button.callback('📟 الآي بي المحظور', 'MENU_IPLIST')],
  [Markup.button.callback('📁 مدير ملفات العالم والبلقنز ⚙️', 'TG_CHOOSE_FILE_AREA')],
  [Markup.button.callback('⚙️ لوحة خيارات وإعدادات السيرفر', 'TG_MENU_SETTINGS')],
  [
    Markup.button.callback('📊 فحص الموارد', 'MENU_STATS'),
    Markup.button.callback('💾 تنزيل العالم .zip', 'TG_ACT_ZIP_BACKUP'),
    Markup.button.callback('🎮 القدرة', 'MENU_POWER')
  ]
]);

// 2. Local Capability and Runtime Control Switches
const powerKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('▶️ تشغيل', 'ACT_START'),
    Markup.button.callback('🔄 ريستارت', 'ACT_RESTART'),
    Markup.button.callback('🛑 إيقاف آمن', 'ACT_STOP')
  ],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 3. Directory Boundary Switching Menu Pad
const fileAreaKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🗺️ ملفات العالم (World)', 'TG_GO_WORLD_AREA')],
  [Markup.button.callback('🔌 إضافات السيرفر (Plugins)', 'TG_GO_PLUGINS_AREA')],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 4. Uniform Return Utility Button Row
const backToMainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// ========================================================
// 🚀 Welcome Handshakes and Administrative Interception
// ========================================================

bot.start((ctx) => {
  if (!isAdmin(ctx)) {
    console.log(`[Telegram Blocked]: Unauthorized intrusion block for @${ctx.from.username}`);
    return ctx.reply('❌ الوصول مرفوض! هذا البوت مؤمن ومخصص لمالك السيرفر المعتمد فقط.');
  }

  ctx.reply(
    '🎮 *مرحباً بك في غرفة تحكم سيرفر ماين كرافت السحابية الفائقة!*\n\n' +
    'اللوحة مشحونة بكامل ميزات أترنوس: تصفح العالم، رفع البلقنز، كشف تفاصيل وموارد اللاعبين، وحفظ الـ zip بنظام النقر.\n' +
    'اختر أحد الأقسام من الأزرار أدناه للبدء:',
    { parse_mode: 'Markdown', ...mainKeyboard }
  );
});
// ========================================================
// 🤖 [بوت تلجرام المطور المصلح - الجزء 2 من 4]
// معالج التنقل الشجري، ولوحة خيارات أترنوس بمزامنة الحالة (✅/❌)
// ========================================================

// معالجة الانتقال والقوائم الأساسية الشجرية
bot.action('MENU_MAIN', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  ctx.editMessageText('🎮 *لوحة تحكم سيرفر ماين كرافت السحابية الرئيسية*\n\nاختر القسم المطلوب من الأزرار أدناه للتحكم وبدء النقر:', { parse_mode: 'Markdown', ...mainKeyboard });
});

bot.action('MENU_POWER', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  ctx.editMessageText('⚡ *قسم التحكم بالقدرة والتشغيل الحي:*', { parse_mode: 'Markdown', ...powerKeyboard });
});

// فتح لوحة الإعدادات وقراءتها حياً من القرص لإضافة علامات الحالة الحية
bot.action('TG_MENU_SETTINGS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('⚙️ جاري قفل ومزامنة الإعدادات...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleSettingsData = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleSettingsData);
        const props = response.data.serverProperties || {};

        // فحص الحالات لبناء علامات التفعيل برمجياً (✅ / ❌)
        const crackIcon = props['online-mode'] === 'false' ? '✅ مفعل (مكرك)' : '❌ معطل (أصلي)';
        const wlIcon = props['white-list'] === 'true' ? '✅ مفعلة' : '❌ معطلة';

        const settingsKeyboard = Markup.inlineKeyboard([
          [Markup.button.callback('🎮 وضع اللعب الافتراضي', 'TG_SET_GAMEMODE'), Markup.button.callback('☠️ صعوبة العالم', 'TG_SET_DIFFICULTY')],
          [Markup.button.callback(`🔓 وضع الكراك: ${crackIcon}`, 'TG_TOGGLE_CRACK')],
          [Markup.button.callback(`🛡️ الوايت لست: ${wlIcon}`, 'TG_TOGGLE_WL')],
          [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
        ]);

        ctx.editMessageText(
          `⚙️ *لوحة تعديل إعدادات وخصائص السيرفر الحية:*\n\n` +
          `• وضع اللعب الحالي: \`${props['gamemode'] || 'survival'}\`\n` +
          `• صعوبة العالم الحالية: \`${props['difficulty'] || 'normal'}\`\n` +
          `• الحد الأقصى للاعبين: \`${props['max-players'] || '20'}\` لاعب\n\n` +
          `_انقر على الأزرار لتبديل وتحديث القيم فوراً على القرص:_`,
          { parse_mode: 'Markdown', ...settingsKeyboard }
        );
      }
    } catch (e) { }
  };
  ws.on('message', handleSettingsData);
});

// معالجة أزرار تبديل خيارات الجيم مود والصعوبة
bot.action('TG_SET_GAMEMODE', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  const gmKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Survival (البقاء)', 'TG_GM_survival'), Markup.button.callback('Creative (الإبداعي)', 'TG_GM_creative')],
    [Markup.button.callback('Adventure (المغامرة)', 'TG_GM_adventure'), Markup.button.callback('Spectator (المشاهد)', 'TG_GM_spectator')],
    [Markup.button.callback('⬅️ عودة للإعدادات', 'TG_MENU_SETTINGS')]
  ]);
  ctx.editMessageText('🎮 *اختر وضع اللعب الافتراضي الجديد (Gamemode):*', { parse_mode: 'Markdown', ...gmKeyboard });
});

bot.action(/^TG_GM_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const mode = ctx.match[1];
  ws.send(JSON.stringify({ action: 'SET_GAMEMODE_SETTING', payload: { mode } }));
  ctx.answerCbQuery(`تم تغيير وضع اللعب إلى ${mode}`);
  ctx.reply(`✅ *[إعدادات السيرفر]:* تم تحديث وضع اللعب الافتراضي حياً إلى: \`${mode}\``, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('TG_SET_DIFFICULTY', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  const diffKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Peaceful (سلمي)', 'TG_DF_peaceful'), Markup.button.callback('Easy (سهل)', 'TG_DF_easy')],
    [Markup.button.callback('Normal (عادي)', 'TG_DF_normal'), Markup.button.callback('Hard (صعب)', 'TG_DF_hard')],
    [Markup.button.callback('⬅️ عودة للإعدادات', 'TG_MENU_SETTINGS')]
  ]);
  ctx.editMessageText('☠️ *اختر درجة صعوبة العالم الجديدة (Difficulty):*', { parse_mode: 'Markdown', ...diffKeyboard });
});

bot.action(/^TG_DF_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const difficulty = ctx.match[1];
  ws.send(JSON.stringify({ action: 'SET_DIFFICULTY_SETTING', payload: { difficulty } }));
  ctx.answerCbQuery(`تمت الصعوبة إلى ${difficulty}`);
  ctx.reply(`✅ *[إعدادات السيرفر]:* تم تحديث صعوبة العالم حياً إلى: \`${difficulty}\``, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('TG_TOGGLE_CRACK', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('🔄 جاري التبديل...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleCrack = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleCrack);
        const isCrackAllowed = response.data.serverProperties['online-mode'] === 'false';
        ws.send(JSON.stringify({ action: 'SET_CRACK_TOGGLE', payload: { allowed: !isCrackAllowed } }));
        ctx.reply(`⚙️ *[إعدادات السيرفر]:* تم عكس خيار الدخول المكرك بنجاح إلى: \`${!isCrackAllowed}\` (يتطلب ريستارت للتطبيق).`, { parse_mode: 'Markdown', ...backToMainKeyboard });
      }
    } catch (e) { }
  };
  ws.on('message', handleCrack);
});

bot.action('TG_TOGGLE_WL', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('🔄 جاري التبديل...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleWlToggle = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleWlToggle);
        const isWlEnabled = response.data.serverProperties['white-list'] === 'true';
        ws.send(JSON.stringify({ action: 'SET_WHITELIST_TOGGLE', payload: { enable: !isWlEnabled } }));
        ctx.reply(`⚙️ *[إعدادات السيرفر]:* تم تبديل حالة القائمة البيضاء حياً إلى: \`${!isWlEnabled}\``, { parse_mode: 'Markdown', ...backToMainKeyboard });
      }
    } catch (e) { }
  };
  ws.on('message', handleWlToggle);
});
// ========================================================
// 🤖 [بوت تلجرام المطور المصلح - الجزء 3 من 4]
// متصفح ملفات الساند بوكس المعزول، ومحرك إرسال ملف الباك أب الـ zip للهاتف
// ========================================================

// ==========================================
// 📁 3. محرك متصفح ومدير ملفات السيرفر المعزول حديدياً (Aternos Sandbox)
// ==========================================

bot.action('TG_CHOOSE_FILE_AREA', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  ctx.editMessageText('📁 *اختر مجلد العمل الإداري المعزول للتصفح والرفع والحذف:*', { parse_mode: 'Markdown', ...fileAreaKeyboard });
});

bot.action('TG_GO_WORLD_AREA', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  isTgPluginAreaActive = false;
  currentTelegramRelativePath = "";
  requestTelegramBrowseFolder(ctx, "");
});

bot.action('TG_GO_PLUGINS_AREA', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  isTgPluginAreaActive = true;
  currentTelegramRelativePath = "";
  requestTelegramBrowseFolder(ctx, "");
});

function requestTelegramBrowseFolder(ctx, relativePath) {
  currentTelegramRelativePath = relativePath;
  ws.send(JSON.stringify({
    action: 'BROWSE_SERVER_DIRECTORY',
    payload: { relativePath, isPluginArea: isTgPluginAreaActive }
  }));

  const handleFiles = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'DIRECTORY_ITEMS_DATA' && response.currentPath === relativePath) {
        ws.off('message', handleFiles);
        const items = response.items || [];
        const prefix = isTgPluginAreaActive ? "/plugins" : "/world";

        if (items.length === 0) {
          return ctx.reply(`📁 *متصفح الملفات:*\n\nالمجلد الحالي [\`${prefix}/${relativePath}\`] فارغ تماماً.`,
            Markup.inlineKeyboard([[Markup.button.callback('🏠 تصفح المجلدات', 'TG_CHOOSE_FILE_AREA'), Markup.button.callback('⬅️ عودة', 'MENU_MAIN')]])
          );
        }

        // بناء الأزرار التفاعلية للملفات والمجلدات (الحد الأقصى 20 ملف منعاً لتجاوز حجم رسائل تلجرام)
        const fileButtons = items.slice(0, 20).map(item => {
          const icon = item.isDirectory ? "📁" : "📄";
          const callbackId = item.isDirectory ? `TG_DIR_${item.relativePath.slice(0, 30)}` : `TG_DELF_${item.relativePath.slice(0, 30)}`;
          return [Markup.button.callback(`${icon} ${item.name} (${item.size})`, callbackId)];
        });

        const navRow = [];
        if (relativePath !== "") navRow.push(Markup.button.callback('🏠 الرئيسي', isTgPluginAreaActive ? 'TG_GO_PLUGINS_AREA' : 'TG_GO_WORLD_AREA'));
        navRow.push(Markup.button.callback('⬅️ القائمة الرئيسية', 'MENU_MAIN'));
        fileButtons.push(navRow);

        ctx.reply(`📁 *متصفح ملفات السيرفر حياً:*\n\n📂 المسار الحالي: \`${prefix}/${relativePath}\`\n\n_انقر على المجلدات للتصفح تكرارياً، أو انقر على الملفات لحذفها من القرص:_`, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(fileButtons)
        });
      }
    } catch (e) { }
  };
  ws.on('message', handleFiles);
}

bot.action(/^TG_DIR_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const folderPath = ctx.match[1];
  ctx.answerCbQuery(`فتح المجلد: ${folderPath}`);
  requestTelegramBrowseFolder(ctx, folderPath);
});

bot.action(/^TG_DELF_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const filePath = ctx.match[1];
  ctx.answerCbQuery();

  const confirmKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⚠️ نعم، احذفه نهائياً', `TG_CONF_DEL_${filePath}`)],
    [Markup.button.callback('❌ إلغاء والتراجع', 'TG_CHOOSE_FILE_AREA')]
  ]);
  ctx.reply(`🗑️ *تأكيد الحذف الصارم:*\n\nهل أنت متأكد تماماً من حذف المكون: \`/${filePath}\` من قرص السيرفر الحقيقي؟`, { parse_mode: 'Markdown', ...confirmKeyboard });
});

bot.action(/^TG_CONF_DEL_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const filePath = ctx.match[1];
  ws.send(JSON.stringify({ action: 'DELETE_FILE_OR_FOLDER', payload: { relativePath: filePath, isPluginArea: isTgPluginAreaActive } }));
  ctx.answerCbQuery(`تم حذف المكون`);
  ctx.reply(`✅ *[مدير الملفات]:* تم تدمير وحذف المكون \`/${filePath}\` من القرص بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 💾 4. محرك إنتاج وإرسال ملف الباك أب الـ zip للهاتف مباشرة
// ==========================================

bot.action('TG_ACT_ZIP_BACKUP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('⏳ جاري ضغط السيرفر...');
  ctx.reply('💾 *[نظام النسخ الاحتياطي]:* جاري ضغط مجلد العالم وتوليد ملف `.zip` حقيقي حالياً... يرجى الانتظار لحين إرساله.');

  ws.send(JSON.stringify({ action: 'CREATE_ZIP_BACKUP' }));

  const handleZipIncoming = async (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'BACKUP_ZIP_DOWNLOAD') {
        ws.off('message', handleZipIncoming);

        const { fileName, fileData } = response;
        const fileBuffer = Buffer.from(fileData, 'base64');

        ctx.reply('📥 *[نظام النسخ الاحتياطي]:* تم ضغط السيرفر بنجاح! جاري رفع وإرسال الملف المضغوط لشاتك الآن...');

        await ctx.replyWithDocument({
          source: fileBuffer,
          filename: fileName
        }, {
          caption: `💾 **ملف نسخة احتياطية (.zip) كاملة لعالمك حياً**\n\n📅 التاريخ: \`${new Date().toLocaleString('ar-EG')}\`\n🗜️ الصيغة: Zip Archive`,
          parse_mode: 'Markdown'
        });
      }
    } catch (error) {
      console.error('[Telegram Backup Error]:', error);
    }
  };
  ws.on('message', handleZipIncoming);
});
// ========================================================
// 🤖 [بوت تلجرام المطور الفائق - الجزء 4 من 5]
// لوحة اللاعبين أونلاين، ونافذة تفاصيل وموارد الحساب المدمجة (E)
// ========================================================

// 5. إدارة اللاعبين وكشف تفاصيل الحساب والموارد المدمجة (E-View)
bot.action('MENU_PLAYERS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('👥 جاري فحص اللاعبين...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleOnline = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleOnline);
        const list = response.data.playersOnline || [];
        if (list.length === 0) {
          return ctx.reply('👥 *إدارة اللاعبين:*\n\nلا يوجد لاعبين متصلين حالياً داخل السيرفر.', { parse_mode: 'Markdown', ...backToMainKeyboard });
        }
        const buttons = list.map(p => [
          Markup.button.callback(`👤 الإجراءات: ${p}`, `TARGET_${p}`),
          Markup.button.callback('🧰 التفاصيل والموارد (E)', `TG_INV_${p}`)
        ]);
        buttons.push([Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]);
        ctx.reply('👥 *اللاعبين المتصلين حالياً:*\n\nانقر على زر 🧰 لكشف موارد اللاعب أولاً وتفاصيله، أو انقر على اسمه لتطبيق العقوبات:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleOnline);
});

// ميزة حصرية: استقبال طلب كشف الموارد أولاً ثم تفاصيل الحساب المتقدمة (Inventory View)
bot.action(/^TG_INV_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const playerName = ctx.match[1];
  ctx.answerCbQuery('🧰 جاري سحب تقرير الموارد والتفاصيل...');

  ws.send(JSON.stringify({ action: 'GET_PLAYER_ADVANCED_DATA', payload: { playerName } }));

  const handleInvData = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'PLAYER_ADVANCED_DATA' && response.data.name === playerName) {
        ws.off('message', handleInvData);
        const p = response.data;

        ctx.reply(
          `🧰 *#نافذة تفاصيل وموارد اللاعب:* \`${p.name}\`\n\n` +
          `🎒 *الموارد والإحصائيات التي بحوزته حالياً:*\n` +
          `• ⚔️ قتلى اللاعبين: \`${p.playerKills}\` لاعب\n` +
          `• 🏹 قتلى الوحوش (Mob Kills): \`${p.mobKills}\` وحش\n` +
          `• 🦘 إجمالي القفزات (Jumps): \`${p.jumps}\` قفزة\n` +
          `• 🏆 الإنجازات المفتوحة (Advancements): \`${p.advancementsCount}\` إنجاز\n\n` +
          `ℹ️ *معلومات الحساب والاتصال بالخادم:*\n` +
          `• 🆔 المعرف الفريد UUID الرقمي: \`${p.uuid}\`\n` +
          `• ⏱️ إجمالي وقت اللعب بالسيرفر: \`${p.playTime}\`\n` +
          `• 💀 عدد مرات الموت الإجمالية: \`${p.deaths}\` ميتة\n` +
          `━━━━━━━━━━━━━━━━━━`,
          { parse_mode: 'Markdown', ...backToMainKeyboard }
        );
      }
    } catch (e) { }
  };
  ws.on('message', handleInvData);
});

// لوحة العقوبات الفرعية السريعة عند النقر على خيارات لاعب متصل
bot.action(/^TARGET_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const playerName = ctx.match[1];
  selectedPlayerContext = playerName;
  ctx.answerCbQuery(`تحديد: ${playerName}`);

  const playerKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🥾 طرد (Kick)', 'P_ACT_KICK'), Markup.button.callback('🚫 حظر (Ban)', 'P_ACT_BAN')],
    [Markup.button.callback('👑 ترقية Ad-OP', 'P_ACT_OP'), Markup.button.callback('🛡️ سحب رتبة OP', 'P_ACT_DEOP')],
    [Markup.button.callback('👥 قائمة اللاعبين', 'MENU_PLAYERS')]
  ]);
  ctx.editMessageText(`🛠️ *لوحة التحكم باللاعب الصافي:* \`${playerName}\`\n\nاختر العقوبة المراد تنفيذها فوراً عبر السوكيت:`, { parse_mode: 'Markdown', ...playerKeyboard });
});
// ========================================================
// 🤖 [بوت تلجرام المطور المصلح - الجزء 5 من 5]
// تنفيذ العقوبات، أزرار القدرة والموارد، والتحكم بالقوائم الأربعة الحية
// ========================================================

bot.action('P_ACT_KICK', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `kick ${selectedPlayerContext} طرد سريع عبر تلجرام` } }));
  ctx.answerCbQuery();
  ctx.reply(`✅ *[نظام العقوبات]:* تم طرد اللاعب \`${selectedPlayerContext}\` بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_BAN', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `ban ${selectedPlayerContext} حظر عبر تلجرام` } }));
  ctx.answerCbQuery();
  ctx.reply(`🚨 *[نظام الحماية]:* تم حظر الحساب \`${selectedPlayerContext}\` نهائياً من دخول السيرفر.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_OP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `op ${selectedPlayerContext}` } }));
  ctx.answerCbQuery();
  ctx.reply(`👑 *[نظام الرتب]:* تم منح اللاعب \`${selectedPlayerContext}\` صلاحيات المسؤول الكاملة (OP).`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_DEOP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${selectedPlayerContext}` } }));
  ctx.answerCbQuery();
  ctx.reply(`🛡️ *[نظام الرتب]:* تم تجريد اللاعب \`${selectedPlayerContext}\` من صلاحيات الأدمن والمسؤول.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// أوامر الإغلاق والتشغيل والريستارت للملف المساعد
bot.action('ACT_START', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'START_SERVER' }));
  ctx.answerCbQuery();
  ctx.reply('🚀 *[نظام القدرة]:* جاري بدء تشغيل السيرفر وتوليد عملية الجافا التابعة له حالياً...');
});

bot.action('ACT_STOP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
  ctx.answerCbQuery();
  ctx.reply('🛑 *[نظام القدرة]:* تم إرسال أمر الإيقاف الآمن (Stop) لحفظ ملفات الخريطة بسلام.');
});

bot.action('ACT_RESTART', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
  ctx.answerCbQuery();
  ctx.reply('🔄 *[نظام القدرة]:* تم البدء في عملية إعادة التشغيل الذكية لإنعاش السيرفر والمنفذ حالياً.');
});

bot.action('MENU_STATS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('📊 جاري سحب الموارد...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleStats = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        let emojiStatus = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';
        ctx.reply(`📊 *تقرير أداء السيرفر وجهاز الاستضافة الفوري المصلح:*\n\n🖥️ *الحالة:* ${emojiStatus}\n📟 *المعالج CPU الحقيقي:* \`${cpu}\`\n💾 *الرام RAM الحرة:* \`${ram}\`\n👥 *اللاعبين أونلاين:* \`${playersCount}\` لاعب`, { parse_mode: 'Markdown', ...backToMainKeyboard });
      }
    } catch (e) { }
  };
  ws.on('message', handleStats);
});

// الجداويل الأربعة الحية (OP, Whitelist, BanList, IPs) تلقائياً بنظام النقر والقراءة من القرص حياً حياً
const simpleMenusConfigs = {
  'MENU_OPS': { prop: 'opsList', cmd: 'deop', prefix: 'DEOP_TXT_', txt: '👑 المسؤولين الحاليين (OP)', btnTxt: '🛡️ سحب OP من' },
  'MENU_WL': { prop: 'whitelistList', cmd: 'whitelist remove', prefix: 'RM_WL_', txt: '🛡️ القائمة البيضاء (Whitelist)', btnTxt: '❌ إزالة' },
  'MENU_BANLIST': { prop: 'bannedPlayersList', cmd: 'pardon', prefix: 'PARDON_TXT_', txt: '🚫 اللاعبين المحظورين (Ban List)', btnTxt: '🟢 فك حظر' },
  'MENU_IPLIST': { prop: 'bannedIpsList', cmd: 'pardon-ip', prefix: 'PARDONIP_TXT_', txt: '📟 الآي بي المحظور (IP Ban List)', btnTxt: '🟢 فك آي بي' }
};

Object.keys(simpleMenusConfigs).forEach(menuId => {
  bot.action(menuId, (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery();
    ctx.answerCbQuery();
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleSimple = (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.type === 'HOST_STATS') {
          ws.off('message', handleSimple);
          const list = response.data[simpleMenusConfigs[menuId].prop] || [];
          if (list.length === 0) return ctx.reply(`📝 *${simpleMenusConfigs[menuId].txt}:*\n\nهذه القائمة فارغة حالياً بالقرص.`, { parse_mode: 'Markdown', ...backToMainKeyboard });

          const buttons = list.map(p => [Markup.button.callback(`${simpleMenusConfigs[menuId].btnTxt}: ${p}`, `${simpleMenusConfigs[menuId].prefix}${p}`)]);
          buttons.push([Markup.button.callback('⬅️ عودة لقائمة التحكم', 'MENU_MAIN')]);
          ctx.reply(`${simpleMenusConfigs[menuId].txt}:\n\nانقر لتنفيذ الإجراء الفوري حياً:`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
        }
      } catch (e) { }
    };
    ws.on('message', handleSimple);
  });
});

bot.action(/^(DEOP_TXT_|RM_WL_|PARDON_TXT_|PARDONIP_TXT_)(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const actionType = ctx.match[1];
  const target = ctx.match[2];
  ctx.answerCbQuery();

  let cmdPrefix = "";
  if (actionType === 'DEOP_TXT_') cmdPrefix = "deop";
  else if (actionType === 'RM_WL_') cmdPrefix = "whitelist remove";
  else if (actionType === 'PARDON_TXT_') cmdPrefix = "pardon";
  else if (actionType === 'PARDONIP_TXT_') cmdPrefix = "pardon-ip";

  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `${cmdPrefix} ${target}` } }));
  ctx.reply(`✅ *[نظام الإدارة]:* تم تنفيذ الإجراء بنجاح لـ \`${target}\` على القرص المضيف.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// استقبال الرسائل النصية المفتوحة وتمريرها كأمر كونسل مباشر من الهاتف
bot.on('text', (ctx) => {
  if (!isAdmin(ctx) || ctx.message.text.startsWith('/')) return;
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: ctx.message.text.trim() } }));
  ctx.reply(`📥 *[الكونسل الفوري]:* تم تمرير الأمر يدوياً للسيرفر الحي:\n\`${ctx.message.text.trim()}\``, { parse_mode: 'Markdown' });
});

bot.catch((err) => console.error('[Telegram Bot ERROR]: حدث خطأ غير متوقع:', err));

bot.launch();
console.log('[Telegram Bot]: تم تفعيل التحديث وإصلاح المعالج والـ Inventory بنجاح باهر وجاهز للإنتاج المستقر!');
