// ========================================================
// 🤖 [بوت تلجرام المطور الشامل - الجزء 1 من 3]
// استيراد الحزم، دوال الحماية، والتصميم الهندسي للقوائم والأزرار
// ========================================================

const { Telegraf, Markup } = require('telegraf');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تأسيس كائن البوت والاتصال الفوري بسوكيت النواة الخلفية للمشروع (البورت 8080)
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ws = new WebSocket(process.env.SOCKET_URL);

// متغير الذاكرة المؤقتة لحفظ أسماء اللاعبين عند تطبيق عقوبات الطرد والحظر
let selectedPlayerContext = "";

/**
 * دالة حماية صارمة للتأكد من تطابق اسم المستخدم (Username) مع ملف الـ .env
 */
function isAdmin(ctx) {
  if (!ctx.from || !ctx.from.username) return false;
  return ctx.from.username.toLowerCase() === process.env.TELEGRAM_ADMIN_USERNAME.toLowerCase().replace('@', '');
}

// ========================================================
// 🎨 التصميم البصري والشجري للقوائم التفاعلية (Inline Keyboards)
// ========================================================

// 1. القائمة الرئيسية الكبرى الشاملة (Main Dashboard)
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('👥 اللاعبين أونلاين 🎮', 'MENU_PLAYERS')],
  [Markup.button.callback('👑 الأدمنية والمسؤولين (OP)', 'MENU_OPS')],
  [Markup.button.callback('🛡️ القائمة البيضاء (Whitelist)', 'MENU_WL')],
  [Markup.button.callback('🚫 المحظورين (Banned Players)', 'MENU_BANLIST')],
  [Markup.button.callback('📟 الآي بي المحظور (Banned IPs)', 'MENU_IPLIST')],
  [
    Markup.button.callback('📊 فحص الموارد', 'MENU_STATS'),
    Markup.button.callback('🛠️ الصيانة', 'MENU_MANAGE'),
    Markup.button.callback('🎮 القدرة', 'MENU_POWER')
  ]
]);

// 2. قائمة التحكم بالقدرة وتشغيل السيرفر (Power Menu)
const powerKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('▶️ تشغيل', 'ACT_START'),
    Markup.button.callback('🔄 ريستارت', 'ACT_RESTART'),
    Markup.button.callback('🛑 إيقاف آمن', 'ACT_STOP')
  ],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 3. قائمة الصيانة والأدوات المتقدمة والملفات (Management Menu)
const manageKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('💾 إنشاء نسخة احتياطية (Backup)', 'ACT_BACKUP')],
  [Markup.button.callback('🔌 عرض المودات والبلقنز المثبتة', 'ACT_PLUGINS')],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 4. زر العودة السريع الموحد للقائمة الرئيسية (Back to Home)
const backToMainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// ========================================================
// 🚀 أحداث الترحيب والإقلاع الأولي للمستخدم
// ========================================================

bot.start((ctx) => {
  if (!isAdmin(ctx)) {
    console.log(`[Telegram Blocked]: محاولة دخول مرفوضة للبوت من @${ctx.from.username}`);
    return ctx.reply('❌ الوصول مرفوض! هذا البوت مؤمن ومخصص لمالك السيرفر المعتمد فقط.');
  }

  ctx.reply(
    '🎮 *مرحباً بك في غرفة تحكم ماين كرافت السحابية المحدثة!*\n\n' +
    'اللوحة متزامنة بالكامل الآن مع قراءة ملفات السيرفر وجاهزة لإدارة اللاعبين والقوائم الخمس بنظام النقر.\n' +
    'اختر أحد الأقسام من الأزرار أدناه للبدء:',
    { parse_mode: 'Markdown', ...mainKeyboard }
  );
});
// ========================================================
// 🤖 [بوت تلجرام المطور الشامل - الجزء 2 من 3]
// محرك التنقل، إدارة المتصلين وعقوباتهم، وقائمة المسؤولين (OP)
// ========================================================

// ==========================================
// 🔄 محرك التنقل بين القوائم العامة
// ==========================================

bot.action('MENU_MAIN', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('❌ غير مسموح لك.');
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🎮 *لوحة تحكم ماين كرافت السحابية الرئيسية*\n\nاختر القسم المطلوب من الأزرار أدناه للتحكم بالسيرفر:',
    { parse_mode: 'Markdown', ...mainKeyboard }
  );
});

bot.action('MENU_POWER', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  ctx.editMessageText(
    '⚡ *قسم التحكم بالقدرة والتشغيل*\n\nيمكنك التحكم بحالة إقلاع وإغلاق السيرفر الفعلية عبر الأزرار أدناه:',
    { parse_mode: 'Markdown', ...powerKeyboard }
  );
});

bot.action('MENU_MANAGE', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🛠️ *قسم الصيانة والأدوات المتقدمة*\n\nإدارة الملفات والنسخ الاحتياطية للسيرفر بنظام النقر المستقل:',
    { parse_mode: 'Markdown', ...manageKeyboard }
  );
});

// ==========================================
// 👥 1. محرك إدارة اللاعبين المتصلين وعقوباتهم (Online Players)
// ==========================================

bot.action('MENU_PLAYERS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('👥 جاري فحص اللاعبين أونلاين...');
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
        const buttons = list.map(p => [Markup.button.callback(`👤 اللاعب: ${p}`, `TARGET_${p}`)]);
        buttons.push([Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]);
        ctx.reply('👥 *اللاعبين المتصلين حالياً:*\n\nاختر لاعباً لفتح خيارات العقوبات والترقية:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleOnline);
});

bot.action(/^TARGET_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const playerName = ctx.match[1];
  selectedPlayerContext = playerName;
  ctx.answerCbQuery(`🎯 تحديد: ${playerName}`);

  const playerKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🥾 طرد (Kick)', 'P_ACT_KICK'), Markup.button.callback('🚫 حظر (Ban)', 'P_ACT_BAN')],
    [Markup.button.callback('👑 ترقية (OP)', 'P_ACT_OP'), Markup.button.callback('🛡️ سحب رتبة', 'P_ACT_DEOP')],
    [Markup.button.callback('⬅️ العودة للقائمة', 'MENU_PLAYERS')]
  ]);
  ctx.editMessageText(`🛠️ *لوحة التحكم باللاعب:* \`${playerName}\`\n\nاختر العقوبة أو الإجراء لتنفيذه فوراً:`, { parse_mode: 'Markdown', ...playerKeyboard });
});

bot.action('P_ACT_KICK', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `kick ${selectedPlayerContext} طرد سريع عبر تلجرام` } }));
  ctx.answerCbQuery(`🥾 تم طرد ${selectedPlayerContext}`);
  ctx.reply(`✅ *[نظام العقوبات]:* تم طرد اللاعب \`${selectedPlayerContext}\` بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_BAN', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `ban ${selectedPlayerContext} حظر عبر تلجرام` } }));
  ctx.answerCbQuery(`🚫 تم حظر ${selectedPlayerContext}`);
  ctx.reply(`🚨 *[نظام الحماية]:* تم حظر اللاعب \`${selectedPlayerContext}\` نهائياً من دخول الخادم.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_OP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `op ${selectedPlayerContext}` } }));
  ctx.answerCbQuery(`👑 تم ترقية ${selectedPlayerContext}`);
  ctx.reply(`👑 *[نظام الرتب]:* تم منح اللاعب \`${selectedPlayerContext}\` صلاحيات الأدمن (OP).`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_DEOP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${selectedPlayerContext}` } }));
  ctx.answerCbQuery(`🛡️ سحب صلاحيات ${selectedPlayerContext}`);
  ctx.reply(`🛡️ *[نظام الرتب]:* تم سحب رتبة المسؤول (OP) من اللاعب \`${selectedPlayerContext}\` بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 👑 2. إدارة قائمة المسؤولين والأدمنية (OP List)
// ==========================================

bot.action('MENU_OPS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('جاري سحب المسؤولين...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleOps = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleOps);
        const list = response.data.opsList || [];
        if (list.length === 0) return ctx.reply('👑 *قائمة المسؤولين:*\n\nلا يوجد أدمنية معينين في ملف ops.json حالياً.', { parse_mode: 'Markdown', ...backToMainKeyboard });
        const buttons = list.map(p => [Markup.button.callback(`🛡️ سحب OP من: ${p}`, `DEOP_TXT_${p}`)]);
        buttons.push([Markup.button.callback('⬅️ عودة للقائمة الرئيسية', 'MENU_MAIN')]);
        ctx.reply('👑 *المسؤولين الحاليين (OP):*\n\nاضغط على أي لاعب لسحب صلاحياته فورا عبر الكونسل:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleOps);
});

bot.action(/^DEOP_TXT_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const p = ctx.match[1];
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${p}` } }));
  ctx.answerCbQuery(`تم سحب OP من ${p}`);
  ctx.reply(`🛡️ تم سحب رتبة المسؤول من اللاعب \`${p}\` بنجاح من القرص.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});
// ========================================================
// 🤖 [بوت تلجرام المطور الشامل - الجزء 3 من 3]
// إدارة الوايت لست، المحظورين، الآي بي، الموارد، وأزرار القدرة العامة
// ========================================================

// ==========================================
// 🛡️ 3. إدارة القائمة البيضاء (Whitelist Menu)
// ==========================================
bot.action('MENU_WL', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('جاري سحب الوايت لست...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleWl = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleWl);
        const list = response.data.whitelistList || [];
        if (list.length === 0) return ctx.reply('🛡️ *القائمة البيضاء:*\n\nالقائمة فارغة حالياً في ملف whitelist.json.', { parse_mode: 'Markdown', ...backToMainKeyboard });
        const buttons = list.map(p => [Markup.button.callback(`❌ إزالة: ${p}`, `RM_WL_${p}`)]);
        buttons.push([Markup.button.callback('⬅️ عودة', 'MENU_MAIN')]);
        ctx.reply('🛡️ *قائمة اللاعبين المصرح لهم (Whitelist):*\n\nانقر لإزالة أي لاعب ومنعه من الدخول:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleWl);
});

bot.action(/^RM_WL_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const p = ctx.match[1];
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `whitelist remove ${p}` } }));
  ctx.answerCbQuery(`تمت إزالة ${p}`);
  ctx.reply(`✅ تمت إزالة اللاعب \`${p}\` من القائمة البيضاء بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 🚫 4. إدارة اللاعبين المحظورين (Banned Players)
// ==========================================
bot.action('MENU_BANLIST', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('جاري سحب المحظورين...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleBan = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleBan);
        const list = response.data.bannedPlayersList || [];
        if (list.length === 0) return ctx.reply('🚫 *قائمة المحظورين:*\n\nلا يوجد لاعبين محظورين حالياً في السيرفر.', { parse_mode: 'Markdown', ...backToMainKeyboard });
        const buttons = list.map(p => [Markup.button.callback(`🟢 فك حظر: ${p}`, `PARDON_TXT_${p}`)]);
        buttons.push([Markup.button.callback('⬅️ عودة', 'MENU_MAIN')]);
        ctx.reply('🚫 *اللاعبين المحظورين نهائياً (Ban List):*\n\nانقر على اسم اللاعب لفك الحظر عنه تلقائياً:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleBan);
});

bot.action(/^PARDON_TXT_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const p = ctx.match[1];
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon ${p}` } }));
  ctx.answerCbQuery(`تم فك حظر ${p}`);
  ctx.reply(`✅ تم إلغاء حظر اللاعب \`${p}\` ويمكنه الدخول للعب الآن.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 📟 5. إدارة الآي بي المحظور (Banned IPs)
// ==========================================
bot.action('MENU_IPLIST', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('جاري سحب الآي بي المحظور...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleIp = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleIp);
        const list = response.data.bannedIpsList || [];
        if (list.length === 0) return ctx.reply('📟 *عناوين الآي بي المحظورة:*\n\nلا يوجد آي بي محظور حالياً في ملف banned-ips.json.', { parse_mode: 'Markdown', ...backToMainKeyboard });
        const buttons = list.map(ip => [Markup.button.callback(`🟢 فك آي بي: ${ip}`, `PARDONIP_TXT_${ip}`)]);
        buttons.push([Markup.button.callback('⬅️ عودة', 'MENU_MAIN')]);
        ctx.reply('📟 *عناوين الآي بي المحظورة (IP Ban List):*\n\nانقر على العنوان لإلغاء حظره فورا:', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
      }
    } catch (e) { }
  };
  ws.on('message', handleIp);
});

bot.action(/^PARDONIP_TXT_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  const ip = ctx.match[1];
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon-ip ${ip}` } }));
  ctx.answerCbQuery(`تم فك آي بي ${ip}`);
  ctx.reply(`✅ تم إلغاء حظر عنوان الآي بي \`${ip}\` بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 🔌 6. معالجة أزرار التشغيل والموارد والصيانة العامة
// ==========================================
bot.action('ACT_START', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'START_SERVER' }));
  ctx.answerCbQuery('⚡ جاري التشغيل...');
  ctx.reply('🚀 *[نظام القدرة]:* جاري بدء تشغيل وإيقاظ السيرفر وتوليد عملية الجافا التابعة له حالياً...', { parse_mode: 'Markdown' });
});

bot.action('ACT_STOP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
  ctx.answerCbQuery('🛑 جاري الإيقاف...');
  ctx.reply('🛑 *[نظام القدرة]:* تم إرسال أمر الإيقاف الآمن لحفظ ملفات الخريطة وبيانات اللاعبين على القرص.', { parse_mode: 'Markdown' });
});

bot.action('ACT_RESTART', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
  ctx.answerCbQuery('🔄 جاري إعادة التشغيل...');
  ctx.reply('🔄 *[نظام القدرة]:* تم البدء في عملية إعادة التشغيل الذكية والآمنة لتحديث الملفات والمنفذ حالياً.', { parse_mode: 'Markdown' });
});

bot.action('MENU_STATS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('📊 جاري سحب تقرير الموارد...');
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleStats = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        let emojiStatus = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';
        ctx.reply(`📊 *تقرير أداء الخادم وجهاز الاستضافة:*\n\n🖥 *الحالة:* ${emojiStatus}\n📟 *المعالج:* \`${cpu}\`\n💾 *الرام:* \`${ram}\`\n👥 *اللاعبين أونلاين:* \`${playersCount}\``, { parse_mode: 'Markdown', ...backToMainKeyboard });
      }
    } catch (e) { }
  };
  ws.on('message', handleStats);
});

bot.action('ACT_BACKUP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('💾 جاري أخذ نسخة احتياطية...');
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: 'save-all' } }));
  ctx.reply('💾 *[نظام الحفظ]:* تم إرسال طلب حفظ البيانات لإنشاء نسخة احتياطية مضغوطة من المجلد `world` بنجاح.', { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('ACT_PLUGINS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('🔌 جاري فحص الإضافات...');
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: 'plugins' } }));
  ctx.reply('🔌 *[نظام الملفات]:* تم طلب قائمة الـ Plugins النشطة حالياً، متاح مراجعتها بالكامل عبر شاشة كونسل الويب.', { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// استقبال الرسائل النصية المكتوبة كأوامر كونسل مباشرة
bot.on('text', (ctx) => {
  if (!isAdmin(ctx) || ctx.message.text.startsWith('/')) return;
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: ctx.message.text.trim() } }));
  ctx.reply(`📥 *[الكونسل]:* تم تمرير الأمر المكتوب يدوياً للسيرفر الحي:\n\`${ctx.message.text.trim()}\``, { parse_mode: 'Markdown' });
});

bot.catch((err) => console.error('[Telegram Bot ERROR]:', err));

bot.launch();
console.log('[Telegram Bot]: يعمل بنجاح ومؤمن عبر القوائم الخمس الذكية ومربوط بالسوكيت المركزي المحدث وقراءة القرص الحية.');
