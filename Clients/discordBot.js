// ========================================================
// 👾 [بوت ديسكورد المطور المصلح - الجزء 1 من 5]
// استيراد الحزم الحديثة، تأمين الصلاحيات، وتصميم صفوف الأزرار الشجرية
// ========================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder, MessageFlags } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تهيئة البوت بالصلاحيات الأمنية الكاملة المتوافقة مع السلاش كوماند وبوابات ديسكورد الحديثة
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// الاتصال المباشر بخادم السوكيت المركزي للنواة الخلفية للمشروع (ws://localhost:8080)
const ws = new WebSocket(process.env.SOCKET_URL);

// متغيرات الذاكرة المؤقتة لحفظ مسارات التصفح الحالية وأسماء اللاعبين المستهدفين للعقوبات
let selectedPlayerContext = "";
let currentDiscordRelativePath = "";
let isDiscPluginAreaActive = false; // فحص هل يتصفح مجلد العالم أم مجلد الإضافات

// ========================================================
// 🎨 تصميم وتوليد صفوف الأزرار التفاعلية الموحدة (Components)
// ========================================================

// 1. الأزرار العلوية للقائمة الرئيسية الكبرى الشاملة
function createMainRow1() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_PLAYERS').setLabel('👥 اللاعبين أونلاين').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_OPS').setLabel('👑 الأدمنية (OP)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_WL').setLabel('🛡️ الوايت لست').setStyle(ButtonStyle.Primary)
  );
}

function createMainRow2() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_BANLIST').setLabel('🚫 المحظورين').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_IPLIST').setLabel('📟 الآي بي المحظور').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_CHOOSE_FILES').setLabel('📁 مدير ملفات السيرفر').setStyle(ButtonStyle.Primary)
  );
}

function createMainRow3() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_STATS').setLabel('📊 فحص الموارد').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_NAV_SETTINGS').setLabel('⚙️ خيارات السيرفر').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('DISC_NAV_POWER').setLabel('🎮 قسم القدرة').setStyle(ButtonStyle.Secondary)
  );
}

// 2. أزرار لوحة التحكم بالقدرة والتشغيل
function createPowerRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_ACT_START').setLabel('▶️ تشغيل السيرفر').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_ACT_RESTART').setLabel('🔄 إعادة تشغيل').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_ACT_STOP').setLabel('🛑 إيقاف آمن').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ القائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}

// 3. تبويب الاختيار المعزول حديدياً لإدارة المجلدات (world أو plugins حصراً)
function createChooseFileAreaRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_GO_WORLD_AREA').setLabel('🗺️ ملفات العالم (World)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_GO_PLUGINS_AREA').setLabel('🔌 إضافات السيرفر (Plugins)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ القائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}

// 4. زر العودة الموحد الذكي للقائمة الرئيسية
function createBackToMainRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ العودة للقائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}
// ========================================================
// 👾 [Hardened Discord Bot Shell - Part 2 of 5]
// REST Command Registry, Live Channel Logging, & Slashing
// ========================================================

// 1. Definition template array for the master deployment slash command
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('🛠️ فتح لوحة التحكم التفاعلية الكبرى لإدارة سيرفر ماين كرافت واللاعبين والملفات')
].map(command => command.toJSON());

// 2. Hardened automated REST payload injection using the updated event hook
client.once('clientReady', async () => {
  console.log(`[Discord Bot]: تم تسجيل الدخول بسلام باسم ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('[Discord API]: جاري تسجيل السلاش كوماند (/panel) تلقائياً في خوادم ديسكورد...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ [Discord API]: تم تفعيل وتسجيل السلاش كوماند بنجاح!');
  } catch (error) {
    console.error('[Discord API ERROR]: فشل تسجيل الأوامر المائلة:', error);
  }

  // Direct live streaming pipeline pumping backend strings into the dedicated log channel
  ws.on('message', (message) => {
    try {
      const response = JSON.parse(message.toString());
      if (response.type === 'LOG') {
        const logChannel = client.channels.cache.get(process.env.DISCORD_LOGS_CHANNEL_ID);
        if (logChannel) {
          logChannel.send(`\`\`\`ansi\n${response.data}\n\`\`\``).catch(() => { });
        }
      }
    } catch (e) { }
  });
});

// 3. Command deployment interceptor utilizing modern ephemeral flagging rules
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'panel') {
    // Enforcing room isolation so control blocks never spam public general lobbies
    if (interaction.channelId !== process.env.DISCORD_COMMANDS_CHANNEL_ID) {
      return interaction.reply({
        content: `❌ يرجى استخدام هذا الأمر داخل روم التحكم والأوامر المخصصة فقط: <#${process.env.DISCORD_COMMANDS_CHANNEL_ID}>`,
        flags: [MessageFlags.Ephemeral]
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('⚡ لوحة تحكم سيرفر ماين كرافت السحابية الموحدة')
      .setDescription('مرحباً بك في غرفة عمليات ديسكورد المحدثة بكافة خيارات أترنوس.\nاختر أحد الأقسام من الأزرار أدناه لبدء التحكم بالنقر:')
      .setColor('#00b0ff')
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [createMainRow1(), createMainRow2(), createMainRow3()]
    });
  }
});

// 4. Global configurations view renderer dynamically loading setting properties
function renderSettingsRows(props) {
  const crackIcon = props['online-mode'] === 'false' ? '✅ مفعل (مكرك)' : '❌ معطل (أصلي)';
  const wlIcon = props['white-list'] === 'true' ? '✅ مفعلة' : '❌ معطلة';

  const settingsRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_OPT_GM_SURVIVAL').setLabel('Survival (بقاء)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_OPT_GM_CREATIVE').setLabel('Creative (إبداعي)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_OPT_DF_NORMAL').setLabel('الصعوبة: عادي').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('DISC_OPT_DF_HARD').setLabel('الصعوبة: صعب').setStyle(ButtonStyle.Secondary)
  );

  const settingsRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_OPT_TOGGLE_CRACK').setLabel(`وضع الكراك: ${crackIcon}`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_OPT_TOGGLE_WL').setLabel(`الوايت لست: ${wlIcon}`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ القائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );

  return [settingsRow1, settingsRow2];
}
// ========================================================
// 👾 [Hardened Discord Bot Shell - Part 3 of 5]
// Core Interaction Receivers, Power Management & Live Analytics
// ========================================================

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // Immediately trigger conversational buffering to stop timeout error states
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => { });

  // A) Master Tree structural navigation routing triggers
  if (customId === 'DISC_NAV_MAIN') {
    return interaction.editReply({ content: '🎮 تم الانتقال للقائمة الرئيسية العظمى حياً:', components: [createMainRow1(), createMainRow2(), createMainRow3()] });
  }
  if (customId === 'DISC_NAV_POWER') {
    return interaction.editReply({ content: '⚡ *قسم التحكم بالقدرة والتشغيل الحي الخارجي:*', components: [createPowerRow()] });
  }
  if (customId === 'DISC_NAV_SETTINGS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleSettingsView = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleSettingsView);
        const props = response.data.serverProperties || {};
        interaction.editReply({ content: '⚙️ *لوحة تعديل خيارات السيرفر الشاملة (أترنوس) بمزامنة الحالة الحية:*', components: renderSettingsRows(props) });
      }
    };
    ws.on('message', handleSettingsView);
    return;
  }

  // B) Real-time Property modifiers (Gamemode and Difficulty adjustments)
  if (customId.startsWith('DISC_OPT_GM_')) {
    const mode = customId.replace('DISC_OPT_GM_', '').toLowerCase();
    ws.send(JSON.stringify({ action: 'SET_GAMEMODE_SETTING', payload: { mode } }));
    return interaction.editReply(`✅ *[إعدادات السيرفر]:* تم تحديث وضع اللعب الافتراضي حياً إلى: \`${mode}\``);
  }
  if (customId.startsWith('DISC_OPT_DF_')) {
    const difficulty = customId.replace('DISC_OPT_DF_', '').toLowerCase();
    ws.send(JSON.stringify({ action: 'SET_DIFFICULTY_SETTING', payload: { difficulty } }));
    return interaction.editReply(`✅ *[إعدادات السيرفر]:* تم تحديث صعوبة العالم حياً إلى: \`${difficulty}\``);
  }

  // C) Interactive Switch toggles handling Online-Mode (Crack) and Whitelist values
  if (customId === 'DISC_OPT_TOGGLE_CRACK' || customId === 'DISC_OPT_TOGGLE_WL') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleToggles = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleToggles);
        if (customId === 'DISC_OPT_TOGGLE_CRACK') {
          const isCrack = response.data.serverProperties['online-mode'] === 'false';
          ws.send(JSON.stringify({ action: 'SET_CRACK_TOGGLE', payload: { allowed: !isCrack } }));
          interaction.editReply(`⚙️ *[إعدادات السيرفر]:* تم عكس خيار الدخول المكرك إلى: \`${!isCrack}\` (يتطلب ريستارت للتطبيق).`);
        } else {
          const isWl = response.data.serverProperties['white-list'] === 'true';
          ws.send(JSON.stringify({ action: 'SET_WHITELIST_TOGGLE', payload: { enable: !isWl } }));
          interaction.editReply(`⚙️ *[إعدادات السيرفر]:* تم تبديل حالة القائمة البيضاء حياً إلى: \`${!isWl}\``);
        }
      }
    };
    ws.on('message', handleToggles);
    return;
  }

  // D) Absolute execution signals managing Java runtime state configurations
  if (customId === 'DISC_ACT_START') {
    ws.send(JSON.stringify({ action: 'START_SERVER' }));
    return interaction.editReply('🚀 *[نظام القدرة]:* جاري بدء تشغيل وإيقاظ السيرفر وتوليد عملية الجافا بالخلفية...');
  }
  if (customId === 'DISC_ACT_STOP') {
    ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
    return interaction.editReply('🛑 *[نظام القدرة]:* تم إرسال أمر الإيقاف الآمن (Stop) للمحافظة على سلامة الخرائط والبيانات.');
  }
  if (customId === 'DISC_ACT_RESTART') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    return interaction.editReply('🔄 *[نظام القدرة]:* تم البدء في عملية إعادة التشغيل الذكية لإنعاش ملفات المنفذ.');
  }

  // E) High-grade diagnostic polling retrieving fixed real-time computational data
  if (customId === 'DISC_NAV_STATS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleStats = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        const emoji = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';

        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 تقرير أداء جهاز الاستضافة الفوري المصلح')
          .addFields(
            { name: '🖥️ حالة السيرفر:', value: emoji, inline: true },
            { name: '📟 المعالج CPU الحقيقي الحكيم:', value: `\`${cpu}\``, inline: true },
            { name: '💾 الذاكرة RAM المستهلكة:', value: `\`${ram}\``, inline: true },
            { name: '👥 المتصلين باللعبة:', value: `\`${playersCount}\` لاعب`, inline: true }
          )
          .setColor('#00e676');
        interaction.editReply({ embeds: [statsEmbed] });
      }
    };
    ws.on('message', handleStats);
    return;
  }
  // ========================================================
  // 👾 [Hardened Discord Bot Shell - Part 4 of 5]
  // Sandboxed File Explorer Sheets & Binary Action Anchors
  // ========================================================

  // F) Building live list buttons for simple database sets (OP, Whitelist, Bans)
  if (customId === 'DISC_NAV_PLAYERS' || customId === 'DISC_NAV_BANLIST' || customId === 'DISC_NAV_OPS' || customId === 'DISC_NAV_WL' || customId === 'DISC_NAV_IPLIST') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleListRequest = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleListRequest);

        let activeList = [];
        let actionPrefix = "";
        let titleText = "";

        if (customId === 'DISC_NAV_PLAYERS') { activeList = response.data.playersOnline || []; actionPrefix = 'D_PL_'; titleText = '👥 إدارة المتصلين حالياً'; }
        else if (customId === 'DISC_NAV_BANLIST') { activeList = response.data.bannedPlayersList || []; actionPrefix = 'D_UNBAN_'; titleText = '🚫 إدارة المحظورين (Pardon)'; }
        else if (customId === 'DISC_NAV_OPS') { activeList = response.data.opsList || []; actionPrefix = 'D_DEOP_'; titleText = '👑 إدارة المسؤولين (De-OP)'; }
        else if (customId === 'DISC_NAV_WL') { activeList = response.data.whitelistList || []; actionPrefix = 'D_RMWL_'; titleText = '🛡️ إدارة القائمة البيضاء'; }
        else if (customId === 'DISC_NAV_IPLIST') { activeList = response.data.bannedIpsList || []; actionPrefix = 'D_UNIP_'; titleText = '📟 إدارة الآي بي المحظور'; }

        if (activeList.length === 0) {
          return interaction.editReply({ content: `❌ *[نظام الملفات]:* قسم \`${titleText}\` فارغ حالياً في سجلات السيرفر.`, components: [createBackToMainRow()] });
        }

        const dynamicRows = [];
        let currentRow = new ActionRowBuilder();

        activeList.slice(0, 20).forEach((name, index) => {
          if (index > 0 && index % 4 === 0) { dynamicRows.push(currentRow); currentRow = new ActionRowBuilder(); }
          currentRow.addComponents(new ButtonBuilder().setCustomId(`${actionPrefix}${name.slice(0, 30)}`).setLabel(`👤 ${name}`).setStyle(ButtonStyle.Secondary));
        });
        dynamicRows.push(currentRow);
        dynamicRows.push(createBackToMainRow());

        interaction.editReply({ content: `⚙️ **لوحة القسم الموحد:** \`${titleText}\`\n\nانقر على اسم الحساب المستهدف مباشرة لتطبيق الإجراء التلقائي:`, components: dynamicRows });
      }
    };
    ws.on('message', handleListRequest);
    return;
  }

  // G) Traveral routes controlling explicit sandbox zone separation
  if (customId === 'DISC_NAV_CHOOSE_FILES') {
    return interaction.editReply({ content: '📁 **مدير ملفات السيرفر المعزول حديدياً:**\nاختر مجلد العمل المصرح بلمسه للتصفح والرفع والحذف بأمان:', components: [createChooseFileAreaRow()] });
  }

  if (customId === 'DISC_GO_WORLD_AREA') { isDiscPluginAreaActive = false; currentDiscordRelativePath = ""; return requestDiscordBrowseFolder(interaction, ""); }
  if (customId === 'DISC_GO_PLUGINS_AREA') { isDiscPluginAreaActive = true; currentDiscordRelativePath = ""; return requestDiscordBrowseFolder(interaction, ""); }

  if (customId.startsWith('D_OPEN_DIR_')) {
    const targetPath = customId.replace('D_OPEN_DIR_', '');
    return requestDiscordBrowseFolder(interaction, targetPath);
  }

  // Programmatic file browser injector pulling live node trees over websocket
  function requestDiscordBrowseFolder(inter, targetPath) {
    currentDiscordRelativePath = targetPath;
    ws.send(JSON.stringify({ action: 'BROWSE_SERVER_DIRECTORY', payload: { relativePath: targetPath, isPluginArea: isDiscPluginAreaActive } }));

    const handleFilesRequest = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'DIRECTORY_ITEMS_DATA' && response.currentPath === targetPath) {
        ws.off('message', handleFilesRequest);
        const items = response.items || [];
        const prefix = isDiscPluginAreaActive ? "/plugins" : "/world";

        if (items.length === 0) return inter.editReply({ content: `📁 *مدير الملفات:* المجلد [\`${prefix}/${targetPath}\`] فارغ تماماً.`, components: [createBackToMainRow()] });

        const dynamicRows = [];
        let currentRow = new ActionRowBuilder();

        items.slice(0, 16).forEach((item, index) => {
          if (index > 0 && index % 4 === 0) { dynamicRows.push(currentRow); currentRow = new ActionRowBuilder(); }

          const icon = item.isDirectory ? "📁" : "📄";
          const cid = item.isDirectory ? `D_OPEN_DIR_${item.relativePath.slice(0, 30)}` : `D_FILE_MENU_${item.relativePath.slice(0, 30)}`;
          currentRow.addComponents(new ButtonBuilder().setCustomId(cid).setLabel(`${icon} ${item.name.slice(0, 15)}`).setStyle(item.isDirectory ? ButtonStyle.Primary : ButtonStyle.Secondary));
        });
        dynamicRows.push(currentRow);
        dynamicRows.push(createBackToMainRow());

        inter.editReply({ content: `📁 **متصفح ملفات السيرفر حياً:**\n📂 المسار الحالي: \`${prefix}/${targetPath}\`\n\n_انقر على المجلدات الزرقاء للتصفح، أو الملفات الرمادية لفتح قائمة التحكم بها:_`, components: dynamicRows });
      }
    };
    ws.on('message', handleFilesRequest);
  }

  // H) Individual targeted file utility controls (Binary fetches & permanent deletions)
  if (buttonClickId.startsWith('D_FILE_MENU_')) {
    const filePath = buttonClickId.replace('D_FILE_MENU_', '');
    const fileRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`D_DOWN_SINGLE_${filePath}`).setLabel('📥 تحميل الملف').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`D_DELETE_FILE_${filePath}`).setLabel('🗑️ حذف نهائي').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('DISC_NAV_CHOOSE_FILES').setLabel('⬅️ قائمة الملفات').setStyle(ButtonStyle.Secondary)
    );
    return interaction.editReply({ content: `📄 **قائمة التحكم بالملف المعزول:** \`/${filePath}\`\nاختر الإجراء المطلوب لتنفيذه تلقائياً فوراً:`, components: [fileRow] });
  }
  // ========================================================
  // 👾 [بوت ديسكورد المطور المصلح - الجزء 5 من 5]
  // تحميل الملفات، تفاصيل وموارد اللاعب (E)، وإرسال الـ zip المباشر
  // ========================================================

  // تحميل ملف منفرد باينري وإرساله كمستند حقيقي داخل الديسكورد
  if (buttonClickId.startsWith('D_DOWN_SINGLE_')) {
    const filePath = buttonClickId.replace('D_DOWN_SINGLE_', '');
    ws.send(JSON.stringify({ action: 'DOWNLOAD_SINGLE_FILE', payload: { relativePath: filePath, isPluginArea: isDiscPluginAreaActive } }));

    const handleSingleFile = async (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'SINGLE_FILE_DOWNLOAD_DATA') {
        ws.off('message', handleSingleFile);
        const fileBuffer = Buffer.from(response.fileData, 'base64');
        await interaction.channel.send({
          content: `📥 **تم سحب وتحميل الملف بنجاح من السيرفر:** \`/${filePath}\``,
          files: [{ attachment: fileBuffer, name: response.fileName }]
        });
      }
    };
    ws.on('message', handleSingleFile);
    return;
  }

  if (buttonClickId.startsWith('D_DELETE_FILE_')) {
    const fileToDelete = buttonClickId.replace('D_DELETE_FILE_', '');
    ws.send(JSON.stringify({ action: 'DELETE_FILE_OR_FOLDER', payload: { relativePath: fileToDelete, isPluginArea: isDiscPluginAreaActive } }));
    return interaction.editReply(`🗑️ *[مدير الملفات]:* تم حذف وتدمير المكون \`/${fileToDelete}\` بنجاح من قرص الساند بوكس.`);
  }

  // ط) ميزة صناعة باك أب مضغوط .zip وضخه كملف حقيقي ممرر داخل شات ديسكورد فوراً
  if (customId === 'TG_ACT_ZIP_BACKUP' || customId === 'DISC_ACT_BACKUP') {
    ws.send(JSON.stringify({ action: 'CREATE_ZIP_BACKUP' }));
    interaction.editReply('⏳ *[النسخ الاحتياطي]:* جاري معالجة وضغط مجلد العالم بصيغة zip بالكامل حالياً... يرجى الانتظار لحين إرساله.');

    const handleZipIncoming = async (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.type === 'BACKUP_ZIP_DOWNLOAD') {
          ws.off('message', handleZipIncoming);
          const { fileName, fileData } = response;
          const fileBuffer = Buffer.from(fileData, 'base64');
          await interaction.channel.send({
            content: `💾 **تم إنشاء وتنزيل النسخة الاحتياطية (.zip) بنجاح!**\n📅 التاريخ: \`${new Date().toLocaleString('ar-EG')}\`\n_يمكنك تحميل الملف المرفق أدناه لحفظ العالم بجهازك بسلام._`,
            files: [{ attachment: fileBuffer, name: fileName }]
          });
        }
      } catch (error) {
        console.error('[Discord Backup Error]:', error);
      }
    };
    ws.on('message', handleZipIncoming);
    return;
  }

  // ك) فتح لوحة الإجراءات المباشرة للاعب متصل مع دمج (الموارد أولاً تليها معلومات الحساب)
  if (buttonClickId.startsWith('D_PL_')) {
    selectedPlayerContext = buttonClickId.replace('D_PL_', '');
    ws.send(JSON.stringify({ action: 'GET_PLAYER_ADVANCED_DATA', payload: { playerName: selectedPlayerContext } }));

    const handleAdvancedDetails = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'PLAYER_ADVANCED_DATA' && response.data.name === selectedPlayerContext) {
        ws.off('message', handleAdvancedDetails);
        const p = response.data;

        const individualRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('D_EXEC_KICK').setLabel(`🥾 طرد اللاعب`).setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('D_EXEC_BAN').setLabel(`🚫 حظر دائم`).setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('D_EXEC_OP').setLabel(`👑 رتبة OP`).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('DISC_NAV_PLAYERS').setLabel('⬅️ قائمة اللاعبين').setStyle(ButtonStyle.Secondary)
        );

        const detailsEmbed = new EmbedBuilder()
          .setTitle(`🧰 تفاصيل وموارد اللاعب: ${p.name}`)
          .setDescription(`🎒 **الموارد والإحصائيات التي بحوزته حالياً:**\n• قتلى اللاعبين: \`${p.playerKills}\`\n• قتلى الوحوش: \`${p.mobKills}\`\n• إجمالي القفزات: \`${p.jumps}\`\n• الإنجازات المفتوحة (Advancements): \`${p.advancementsCount}\`\n\nℹ️ **معلومات الحساب والاتصال بالخادم:**\n• الـ UUID الرقمي: \`${p.uuid}\`\n• وقت اللعب بالسيرفر: \`${p.playTime}\`\n• عدد مرات الموت الإجمالية: \`${p.deaths}\``)
          .setColor('#00b0ff')
          .setTimestamp();

        interaction.channel.send({ embeds: [detailsEmbed], components: [individualRow] });
        interaction.editReply('🎯 تم فتح ملف تفاصيل اللاعب بنجاح.');
      }
    };
    ws.on('message', handleAdvancedDetails);
    return;
  }

  // ل) ضخ الأوامر النهائية لكونسل ماين كرافت بعد النقر على أزرار لوحة اللاعب الفرعية
  if (customId === 'D_EXEC_KICK' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `kick ${selectedPlayerContext} طرد سريع بالنقرة عبر ديسكورد` } }));
    return interaction.editReply(`✅ تم طرد اللاعب \`${selectedPlayerContext}\` خارج خادم اللعبة بنجاح.`);
  }
  if (customId === 'D_EXEC_BAN' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `ban ${selectedPlayerContext} حظر صارم بالنقرة عبر ديسكورد` } }));
    return interaction.editReply(`🚨 تم حظر الحساب \`${selectedPlayerContext}\` نهائياً وإدراجه في ملف الحظر بالقرص.`);
  }
  if (customId === 'D_EXEC_OP' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `op ${selectedPlayerContext}` } }));
    return interaction.editReply(`👑 تم ترفيع اللاعب \`${selectedPlayerContext}\` إلى مرتبة مسؤول الكونسل الكاملة (OP).`);
  }
});

// تسجيل دخول البوت بسلام عبر التوكن
client.login(process.env.DISCORD_TOKEN);
