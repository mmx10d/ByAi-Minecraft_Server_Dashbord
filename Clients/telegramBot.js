// ========================================================
// 🤖 [بوت تلجرام المحترف والمحدث - الجزء 1 من 2]
// تهيئة النظام، الحماية باليوزر نيم، وتصميم الأزرار التفاعلية
// ========================================================

const { Telegraf, Markup } = require('telegraf');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تأسيس كائن البوت والاتصال الفوري بسوكيت النواة الخلفية للمشروع
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const ws = new WebSocket(process.env.SOCKET_URL);

// متغير مؤقت لتخزين اسم اللاعب المستهدف لتطبيق العقوبات عليه
let selectedPlayerContext = "";

/**
 * دالة حماية صارمة للتحقق من اسم المستخدم (Username) من الـ .env
 */
function isAdmin(ctx) {
  if (!ctx.from || !ctx.from.username) return false;
  return ctx.from.username.toLowerCase() === process.env.TELEGRAM_ADMIN_USERNAME.toLowerCase().replace('@', '');
}

// ==========================================
// 🎨 تصميم القوائم والأزرار التفاعلية (Inline Keyboards)
// ==========================================

// 1. القائمة الرئيسية الشاملة (Main Dashboard)
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('👥 إدارة اللاعبين المتصلين 🎮', 'MENU_PLAYERS')],
  [Markup.button.callback('📊 فحص الموارد والحالة', 'MENU_STATS')],
  [Markup.button.callback('🛠️ صيانة وإدارة السيرفر', 'MENU_MANAGE')],
  [Markup.button.callback('🎮 التحكم بالتشغيل والقدرة', 'MENU_POWER')]
]);

// 2. قائمة التحكم بالقدرة والتشغيل (Power Menu)
const powerKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback('▶️ تشغيل', 'ACT_START'),
    Markup.button.callback('🔄 ريستارت', 'ACT_RESTART'),
    Markup.button.callback('🛑 إيقاف آمن', 'ACT_STOP')
  ],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 3. قائمة الصيانة والأدوات المتقدمة (Management Menu)
const manageKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('💾 إنشاء نسخة احتياطية (Backup)', 'ACT_BACKUP')],
  [Markup.button.callback('🔌 عرض المودات والبلقنز المثبتة', 'ACT_PLUGINS')],
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// 4. زر العودة السريع الموحد للقائمة الرئيسية
const backToMainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]
]);

// ==========================================
// 🚀 أحداث الترحيب والإطلاق الأولي
// ==========================================

bot.start((ctx) => {
  if (!isAdmin(ctx)) {
    console.log(`[Telegram Blocked]: محاولة دخول مرفوضة من @${ctx.from.username}`);
    return ctx.reply('❌ الوصول مرفوض! هذا البوت مؤمن ومخصص لمالك السيرفر المعتمد فقط.');
  }

  ctx.reply(
    '🎮 *مرحباً بك في لوحة الإدارة السحابية الفائقة المحدثة!*\n\n' +
    'اللوحة متزامنة الآن مع محلل اللاعبين الذكي وجاهزة للتحكم الشامل بنظام النقر المباشر.\n' +
    'اختر أحد الأقسام من الأزرار أدناه للبدء:',
    { parse_mode: 'Markdown', ...mainKeyboard }
  );
});

// ========================================================
// 🔄 معالجة التنقل بين القوائم العامة والتشغيل والصيانة
// ========================================================

bot.action('MENU_MAIN', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
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
// ========================================================
// 🤖 [بوت تلجرام المحترف والمحدث - الجزء 2 من 2]
// محرك إدارة اللاعبين الديناميكي الصارم ومعالجة نقرات الأزرار حياً
// ========================================================

// ==========================================
// 👥 محرك إدارة اللاعبين الحية المتزامن (RegEx Matched Dynamic Manager)
// ==========================================

bot.action('MENU_PLAYERS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('👥 جاري استخراج قائمة اللاعبين حياً...');

  // طلب الإحصائيات التي تحمل مصفوفة الأسماء الحقيقية المستخرجة عبر RegEx
  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handlePlayersList = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        // فك الاستماع فوراً لمنع تكرار المعالجة
        ws.off('message', handlePlayersList);

        // جلب المصفوفة الحية للأسماء الصادرة من التحديث الأخير لملف index.js
        const activePlayers = response.data.playersOnline || [];

        if (activePlayers.length === 0) {
          return ctx.reply(
            '👥 *إدارة اللاعبين:*\n\nلا يوجد أي لاعب متصل داخل السيرفر حالياً (السيرفر فارغ تماماً أو في وضع النوم الذكي).',
            { parse_mode: 'Markdown', ...backToMainKeyboard }
          );
        }

        // بناء أزرار تفاعلية ديناميكية: كل لاعب متصل يحصل على زر مخصص باسمه
        const playerButtons = activePlayers.map(player => {
          return [Markup.button.callback(`👤 اللاعب: ${player}`, `TARGET_${player}`)];
        });

        // إضافة زر العودة للقائمة الرئيسية أسفل قائمة اللاعبين
        playerButtons.push([Markup.button.callback('⬅️ العودة للقائمة الرئيسية', 'MENU_MAIN')]);

        ctx.reply(
          '👥 *قائمة اللاعبين المتواجدين في اللعبة حالياً:*\n\nانقر على اسم اللاعب لفتح لوحة العقوبات والتحكم الخاصة به فوراً:',
          { parse_mode: 'Markdown', ...Markup.inlineKeyboard(playerButtons) }
        );
      }
    } catch (e) { }
  };

  ws.on('message', handlePlayersList);
});

// الإنصات الذكي لنقرات أزرار اللاعبين المستهدفين (تبدأ بـ TARGET_)
bot.action(/^TARGET_(.+)$/, (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();

  // استخراج اسم اللاعب بدقة من سياق الزر المكبوس
  const playerName = ctx.match[1];
  selectedPlayerContext = playerName; // تخزين اسم اللاعب المستهدف في الذاكرة المؤقتة للعقوبة

  ctx.answerCbQuery(`🎯 تم تحديد: ${playerName}`);

  // بناء لوحة التحكم المتقدمة الخاصة باللاعب المستهدف
  const playerActionsKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🥾 طرد (Kick)', 'P_ACT_KICK'),
      Markup.button.callback('🚫 حظر (Ban)', 'P_ACT_BAN')
    ],
    [
      Markup.button.callback('👑 ترقية لأدمن (OP)', 'P_ACT_OP'),
      Markup.button.callback('🛡️ سحب الأدمن (DEOP)', 'P_ACT_DEOP')
    ],
    [Markup.button.callback('⬅️ العودة لقائمة اللاعبين', 'MENU_PLAYERS')]
  ]);

  ctx.editMessageText(
    `🛠️ *لوحة التحكم والعقوبات للاعب:* \`${playerName}\`\n\n` +
    `اختر الإجراء المراد تنفيذه فوراً عبر الكونسل الخلفي لماين كرافت:`,
    { parse_mode: 'Markdown', ...playerActionsKeyboard }
  );
});

// تنفيذ العقوبة والإجراءات الصارمة بناءً على اختيار الأدمن
bot.action('P_ACT_KICK', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: `kick ${selectedPlayerContext} طرد تفاعلي سريع عبر تلجرام` }
  }));

  ctx.answerCbQuery(`🥾 تم طرد ${selectedPlayerContext}`);
  ctx.reply(`✅ *[نظام العقوبات]:* تم طرد اللاعب \`${selectedPlayerContext}\` من السيرفر بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_BAN', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: `ban ${selectedPlayerContext} حظر دائم عبر إدارة تلجرام` }
  }));

  ctx.answerCbQuery(`🚫 تم حظر ${selectedPlayerContext}`);
  ctx.reply(`🚨 *[نظام الحماية]:* تم إدخال اللاعب \`${selectedPlayerContext}\` في القائمة السوداء (Ban) وحظر حسابه نهائياً.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_OP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: `op ${selectedPlayerContext}` }
  }));

  ctx.answerCbQuery(`👑 تم ترقية ${selectedPlayerContext}`);
  ctx.reply(`👑 *[نظام الرتب]:* تم منح اللاعب \`${selectedPlayerContext}\` صلاحيات مسؤول الكونسل الكاملة (OP) بنجاح.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('P_ACT_DEOP', (ctx) => {
  if (!isAdmin(ctx) || !selectedPlayerContext) return ctx.answerCbQuery();

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: `deop ${selectedPlayerContext}` }
  }));

  ctx.answerCbQuery(`🛡️ سحب صلاحيات ${selectedPlayerContext}`);
  ctx.reply(`🛡️ *[نظام الرتب]:* تم سحب رتبة الأدمن من اللاعب \`${selectedPlayerContext}\` وإعادته لرتبة لاعب عادي.`, { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// ==========================================
// 🔌 معالجة أزرار التشغيل والصيانة والقدرة العامة
// ==========================================

bot.action('ACT_START', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'START_SERVER' }));
  ctx.answerCbQuery('⚡ جاري تشغيل السيرفر...');
  ctx.reply('🚀 *[نظام القدرة]:* جاري بدء تشغيل وإيقاظ سيرفر ماين كرافت الحقيقي وتوليد عملية الجافا حالياً...', { parse_mode: 'Markdown' });
});

bot.action('ACT_STOP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
  ctx.answerCbQuery('🛑 جاري إرسال أمر الإيقاف...');
  ctx.reply('🛑 *[نظام القدرة]:* تم إرسال أمر الإيقاف الآمن (Stop) للنواة الخلفية للمحافظة على سلامة الخرائط والبيانات.', { parse_mode: 'Markdown' });
});

bot.action('ACT_RESTART', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
  ctx.answerCbQuery('🔄 جاري إرسال أمر إعادة التشغيل...');
  ctx.reply('🔄 *[نظام القدرة]:* تم البدء في عملية إعادة التشغيل الذكية. سيقوم النظام بانتظار إغلاق المنفذ القديم لمنع تداخل البورتات ثم يقلع مجدداً.', { parse_mode: 'Markdown' });
});

bot.action('MENU_STATS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('📊 جاري سحب تقرير الموارد...');

  ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

  const handleStatsResponse = (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStatsResponse);
        const { ram, cpu, status, playersCount } = response.data;
        let emojiStatus = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';

        ctx.reply(
          `📊 *تقرير أداء الخادم وجهاز الاستضافة الحية:*\n\n` +
          `🖥️ *حالة السيرفر:* ${emojiStatus}\n` +
          `📟 *استهلاك المعالج (CPU):* \`${cpu}\`\n` +
          `💾 *استهلاك الرام (RAM):* \`${ram}\`\n` +
          `👥 *اللاعبين المتصلين باللعبة:* \`${playersCount}\` لاعب\n\n` +
          `⏰ _يتم تحديث هذه البيانات تلقائياً عند الطلب._`,
          { parse_mode: 'Markdown', ...backToMainKeyboard }
        );
      }
    } catch (e) { }
  };
  ws.on('message', handleStatsResponse);
});

bot.action('ACT_BACKUP', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('💾 جاري أخذ نسخة احتياطية...');
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: 'save-all' } }));
  ctx.reply('💾 *[نظام الحفظ التلقائي]:* تم إرسال طلب حفظ البيانات لإنشاء نسخة احتياطية (Backup) مضغوطة من مجلد العالم `world` حالياً وحفظها في مجلد التخزين الآمن...', { parse_mode: 'Markdown', ...backToMainKeyboard });
});

bot.action('ACT_PLUGINS', (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery();
  ctx.answerCbQuery('🔌 جاري فحص الإضافات الملحقة...');
  ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: 'plugins' } }));
  ctx.reply('🔌 *[نظام الملفات]:* تم إرسال طلب جلب قائمة المودات والـ Plugins النشطة حالياً. يمكنك مراجعة شاشة كونسل الويب لمشاهدة التفاصيل الملونة.', { parse_mode: 'Markdown', ...backToMainKeyboard });
});

// 5. استقبال الرسائل النصية المكتوبة يدوياً (للطوارئ والأوامر المباشرة المفتوحة)
bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  if (ctx.message.text.startsWith('/')) return;

  ws.send(JSON.stringify({
    action: 'MINECRAFT_COMMAND',
    payload: { command: ctx.message.text.trim() }
  }));
  ctx.reply(`📥 *[الكونسل الفوري]:* تم تمرير الأمر المكتوب حياً إلى السيرفر:\n\`${ctx.message.text.trim()}\``, { parse_mode: 'Markdown' });
});

bot.catch((err) => {
  console.error('[Telegram Bot ERROR]: حدث خطأ في محرك البوت:', err);
});

bot.launch();
console.log('[Telegram Bot]: يعمل بنجاح ومؤمن عبر اسم المستخدم ومربوط بالسوكيت المركزي المحدث.');
