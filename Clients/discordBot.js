// ========================================================
// 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 1 من 4]
// تهيئة الصلاحيات المقبولة، اتصال السوكيت، وتصميم مجموعات الأزرار الشجرية
// ========================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تهيئة البوت بالصلاحيات الأمنية الكاملة المتوافقة مع السلاش كوماند وبوابات ديسكورد
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

// متغير الذاكرة المؤقتة لحفظ أسماء اللاعبين ومسارات الملفات المستهدفة للعقوبات
let selectedPlayerContext = "";
let currentDiscordRelativePath = "";

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
    new ButtonBuilder().setCustomId('DISC_NAV_FILES').setLabel('📁 مدير ملفات العالم').setStyle(ButtonStyle.Primary)
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

// 3. أزرار لوحة خيارات وإعدادات السيرفر القياسية الشبيهة بأترنوس
function createSettingsRow1() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_OPT_GM_SURVIVAL').setLabel('🎮 Survival (بقاء)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_OPT_GM_CREATIVE').setLabel('🎮 Creative (إبداعي)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_OPT_DF_NORMAL').setLabel('☠️ الصعوبة: عادي').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('DISC_OPT_DF_HARD').setLabel('☠️ الصعوبة: صعب').setStyle(ButtonStyle.Secondary)
  );
}

function createSettingsRow2() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_OPT_TOGGLE_CRACK').setLabel('🔓 تبديل وضع الكراك').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_OPT_TOGGLE_WL').setLabel('🛡️ تبديل الوايت لست').setStyle(ButtonStyle.Danger),
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
// 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 2 من 4]
// تسجيل الأوامر، بث اللوجز المنفصلة، ومعالجة أزرار إعدادات السيرفر حياً
// ========================================================

// 1. تعريف الكوماند المائل المدمج مع الشرح التوضيحي المكتوب للمستخدم
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('🛠️ فتح لوحة التحكم التفاعلية الكبرى لإدارة سيرفر ماين كرافت واللاعبين والملفات')
].map(command => command.toJSON());

// 2. محرك التسجيل الآلي للأوامر وبث السجلات للروم المنفصلة
client.once('ready', async () => {
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

  // بث السجلات الحية القادمة من السوكيت إلى روم اللوجز المنفصلة حصرياً (LOGS CHANNEL)
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

// 3. الاستماع لـتنفيذ السلاش كوماند وإطلاق اللوحة الرسومية الفاخرة بالـ Embed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'panel') {
    // حماية الغرفة: التأكد من أن المستخدم يكتب الأمر داخل روم الأوامر المحددة فقط
    if (interaction.channelId !== process.env.DISCORD_COMMANDS_CHANNEL_ID) {
      return interaction.reply({
        content: `❌ يرجى استخدام هذا الأمر داخل روم التحكم والأوامر المخصصة فقط: <#${process.env.DISCORD_COMMANDS_CHANNEL_ID}>`,
        ephemeral: true
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

// 4. معالجة نقرات الأزرار التفاعلية للتنقل وإعدادات خيارات السيرفر (Aternos Panel Settings)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // تمديد الوقت لمنع خطأ عدم الاستجابة (The application did not respond)
  if (customId.startsWith('DISC_')) {
    await interaction.deferReply({ ephemeral: true }).catch(() => { });
  }

  // أ) محرك التنقل الشجري بين القوائم وتحديث رسالة التفاعل
  if (customId === 'DISC_NAV_MAIN') {
    return interaction.editReply({ content: '🎮 تم الانتقال للقائمة الرئيسية العظمى حياً:', components: [createMainRow1(), createMainRow2(), createMainRow3()] });
  }
  if (customId === 'DISC_NAV_POWER') {
    return interaction.editReply({ content: '⚡ *قسم التحكم بالقدرة والتشغيل الحي:*', components: [createPowerRow()] });
  }
  if (customId === 'DISC_NAV_SETTINGS') {
    return interaction.editReply({ content: '⚙️ *لوحة تعديل خيارات السيرفر الشاملة (أترنوس):*\nاختر الإعدادات المراد تطبيقها فوراً بالنقرات السريعة:', components: [createSettingsRow1(), createSettingsRow2()] });
  }

  // ب) معالجة أزرار تعديل الجيم مود والصعوبة (Settings Configuration)
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

  // ج) معالجة أزرار تبديل الكراك والوايت لست (Toggle Actions)
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
  // ========================================================
  // 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 3 of 4]
  // أزرار القدرة، مراقبة الموارد، وتوليد أزرار تصفح ملفات السيرفر
  // ========================================================

  // د) معالجة أزرار القدرة والتشغيل الحية (Power Menu Actions)
  if (customId === 'DISC_ACT_START') {
    ws.send(JSON.stringify({ action: 'START_SERVER' }));
    return interaction.editReply('🚀 *[نظام القدرة]:* جاري بدء تشغيل وإيقاظ السيرفر وتوليد عملية الجافا بالخلفية...');
  }
  if (customId === 'DISC_ACT_STOP') {
    ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
    return interaction.editReply('🛑 *[نظام القدرة]:* تم إرسال أمر الإيقاف الآمن (Stop) للمحافظة على سلامة عوالم اللاعبين والخرائط.');
  }
  if (customId === 'DISC_ACT_RESTART') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    return interaction.editReply('🔄 *[نظام القدرة]:* تم البدء في عملية إعادة التشغيل الذكية لإنعاش ملفات المنفذ.');
  }

  // هـ) زر فحص الموارد الحية (Resource Monitor JSON Response)
  if (customId === 'DISC_NAV_STATS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleStats = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        const emoji = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';

        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 تقرير أداء جهاز الاستضافة الفوري')
          .addFields(
            { name: '🖥️ حالة السيرفر:', value: emoji, inline: true },
            { name: '📟 المعالج CPU:', value: `\`${cpu}\``, inline: true },
            { name: '💾 الذاكرة RAM:', value: `\`${ram}\``, inline: true },
            { name: '👥 المتصلين باللعبة:', value: `\`${playersCount}\` لاعب`, inline: true }
          )
          .setColor('#00e676');
        interaction.editReply({ embeds: [statsEmbed] });
      }
    };
    ws.on('message', handleStats);
    return;
  }

  // و) محرك سحب الحزم الحية وبناء أزرار سريعة لكل لاعب (المتصلين، البان، الأدمن، إلخ)
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

  // ز) ميزة تصفح ملفات ومجلدات السيرفر والعالم برمجياً بالنقر الشجري (File Manager Menu)
  if (customId === 'DISC_NAV_FILES' || customId.startsWith('D_OPEN_DIR_')) {
    const targetPath = customId === 'DISC_NAV_FILES' ? "" : customId.replace('D_OPEN_DIR_', '');
    currentDiscordRelativePath = targetPath;

    ws.send(JSON.stringify({ action: 'BROWSE_SERVER_DIRECTORY', payload: { relativePath: targetPath } }));

    const handleFilesRequest = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'DIRECTORY_ITEMS_DATA' && response.currentPath === targetPath) {
        ws.off('message', handleFilesRequest);
        const items = response.items || [];

        if (items.length === 0) return interaction.editReply({ content: `📁 *مدير الملفات:* المجلد [\`${targetPath || 'الرئيسي'}\`] فارغ تماماً.`, components: [createBackToMainRow()] });

        const dynamicRows = [];
        let currentRow = new ActionRowBuilder();

        // عرض أول 16 عنصر فقط في ديسكورد لحماية الواجهة من تجاوز عدد أزرار الرسالة
        items.slice(0, 16).forEach((item, index) => {
          if (index > 0 && index % 4 === 0) { dynamicRows.push(currentRow); currentRow = new ActionRowBuilder(); }

          const icon = item.isDirectory ? "📁" : "📄";
          // إذا كان مجلداً نعطي خيار الفتح، وإذا كان ملفاً نعطي خيار الحذف الصارم
          const cid = item.isDirectory ? `D_OPEN_DIR_${item.relativePath.slice(0, 30)}` : `D_DELETE_FILE_${item.relativePath.slice(0, 30)}`;
          currentRow.addComponents(new ButtonBuilder().setCustomId(cid).setLabel(`${icon} ${item.name.slice(0, 15)}`).setStyle(item.isDirectory ? ButtonStyle.Primary : ButtonStyle.Secondary));
        });
        dynamicRows.push(currentRow);
        dynamicRows.push(createBackToMainRow());

        interaction.editReply({ content: `📁 **متصفح ملفات السيرفر حياً:**\n📂 المسار الحالي: \`/${targetPath}\`\n\n_انقر على المجلدات الزرقاء للتصفح، أو انقر على الملفات الرمادية لحذفها من القرص:_`, components: dynamicRows });
      }
    };
    ws.on('message', handleFilesRequest);
    return;
  }
  // ========================================================
  // 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 4 من 4]
  // معالجة حذف ملفات السيرفر، لوحة اللاعب الفرعية، ومحرك إرسال الـ zip للديسكورد
  // ========================================================

  // ح) معالجة حذف ملف من القرص بناءً على نقرة الزر
  if (customId.startsWith('D_DELETE_FILE_')) {
    const fileToDelete = customId.replace('D_DELETE_FILE_', '');
    ws.send(JSON.stringify({ action: 'DELETE_FILE_OR_FOLDER', payload: { relativePath: fileToDelete } }));
    return interaction.editReply(`🗑️ *[مدير الملفات]:* تم حذف وتدمير الملف \`/${fileToDelete}\` بنجاح من قرص السيرفر.`);
  }

  // ط) ميزة صناعة باك أب مضغوط .zip وضخه كملف حقيقي ممرر داخل شات ديسكورد فوراً
  if (customId === 'TG_ACT_ZIP_BACKUP' || customId === 'DISC_ACT_BACKUP') {
    ws.send(JSON.stringify({ action: 'CREATE_ZIP_BACKUP' }));
    interaction.editReply('⏳ *[النسخ الاحتياطي]:* جاري معالجة وضغط مجلد العالم بصيغة zip بالكامل حالياً... يرجى الانتظار لحين إنتاجه وإرساله كملف هنا.');

    const handleZipIncoming = async (data) => {
      try {
        const response = JSON.parse(data.toString());
        if (response.type === 'BACKUP_ZIP_DOWNLOAD') {
          ws.off('message', handleZipIncoming);

          const { fileName, fileData } = response;
          const fileBuffer = Buffer.from(fileData, 'base64');

          // إرسال ملف الـ zip المضغوط كملف مرفق مستند حقيقي داخل شات ديسكورد لحفظه بجهازك
          await interaction.channel.send({
            content: `💾 **تم إنشاء وتنزيل النسخة الاحتياطية (.zip) بنجاح!**\n📅 التاريخ: \`${new Date().toLocaleString('ar-EG')}\`\n_يمكنك تحميل الملف المرفق أدناه لحفظ العالم بجهازك الشخصي بسلام._`,
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

  // ك) تنفيذ إجراءات عقوبات اللاعبين الفرعية التابعة للأزرار الديناميكية
  const buttonClickId = interaction.customId;

  if (buttonClickId.startsWith('D_UNBAN_')) {
    const player = buttonClickId.replace('D_UNBAN_', '');
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon ${player}` } }));
    return interaction.editReply(`✅ *[العقوبات]:* تم إلغاء حظر الحساب \`${player}\` وعاد للوايت لست بنجاح.`);
  }
  if (buttonClickId.startsWith('D_DEOP_')) {
    const player = buttonClickId.replace('D_DEOP_', '');
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${player}` } }));
    return interaction.editReply(`🛡️ *[الرتب]:* تم تجريد اللاعب \`${player}\` من صلاحيات مسؤول كونسل اللعبة (OP).`);
  }
  if (buttonClickId.startsWith('D_RMWL_')) {
    const player = buttonClickId.replace('D_RMWL_', '');
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `whitelist remove ${player}` } }));
    return interaction.editReply(`❌ *[الملفات]:* تمت إزالة اللاعب \`${player}\` من القائمة البيضاء بنجاح.`);
  }
  if (buttonClickId.startsWith('D_UNIP_')) {
    const ip = buttonClickId.replace('D_UNIP_', '');
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon-ip ${ip}` } }));
    return interaction.editReply(`✅ *[الحماية]:* تم فك حظر عنوان الآي بي الرقمي \`${ip}\` من القرص بسلام.`);
  }

  // لوحة العقوبات الفرعية السريعة عند النقر على لاعب متصل حياً بالاسم الصافي النظيف
  if (buttonClickId.startsWith('D_PL_')) {
    selectedPlayerContext = buttonClickId.replace('D_PL_', '');

    const individualRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('D_EXEC_KICK').setLabel(`🥾 طرد ${selectedPlayerContext}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('D_EXEC_BAN').setLabel(`🚫 حظر دائم`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('D_EXEC_OP').setLabel(`👑 رتبة OP`).setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('DISC_NAV_PLAYERS').setLabel('⬅️ قائمة اللاعبين').setStyle(ButtonStyle.Secondary)
    );
    return interaction.editReply({ content: `🛠️ *لوحة الإجراءات المباشرة للاعب أونلاين الصافي:* \`${selectedPlayerContext}\``, components: [individualRow] });
  }

  // و) ضخ الأوامر النهائية للسيرفر عبر السوكيت للاعبين المتصلين حياً حياً
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

// صيانة الأخطاء العامة للبوت وتسجيل الدخول بسلام
client.on('error', (err) => console.error('[Discord Client ERROR]:', err));
client.login(process.env.DISCORD_TOKEN);
