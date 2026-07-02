// ========================================================
// 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 1 من 3]
// استيراد أدوات التسجيل، وتصميم الأزرار الرسومية الشجرية الموحدة
// ========================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تهيئة البوت بالصلاحيات الأمنية الكاملة المتوافقة مع السلاش كوماند
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// الاتصال المباشر بخادم السوكيت المركزي للنواة الخلفية (ws://localhost:8080)
const ws = new WebSocket(process.env.SOCKET_URL);

// متغير الذاكرة المؤقتة لحفظ أسماء اللاعبين المستهدفين للعقوبات
let selectedPlayerContext = "";

// ========================================================
// 🎨 تصميم وتوليد صفوف الأزرار التفاعلية الموحدة (Components)
// ========================================================

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
    new ButtonBuilder().setCustomId('DISC_NAV_IPLIST').setLabel('📟 الآي بي المحظور').setStyle(ButtonStyle.Primary)
  );
}

function createMainRow3() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_STATS').setLabel('📊 فحص الموارد').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_NAV_MANAGE').setLabel('🛠️ قسم الصيانة').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('DISC_NAV_POWER').setLabel('🎮 قسم القدرة').setStyle(ButtonStyle.Secondary)
  );
}

function createPowerRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_ACT_START').setLabel('▶️ تشغيل السيرفر').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_ACT_RESTART').setLabel('🔄 إعادة تشغيل').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_ACT_STOP').setLabel('🛑 إيقاف آمن').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ القائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}

function createManageRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_ACT_BACKUP').setLabel('💾 إنشاء نسخة احتياطية').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_ACT_PLUGINS').setLabel('🔌 عرض البلقنز').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ القائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}

function createBackToMainRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_NAV_MAIN').setLabel('⬅️ العودة للقائمة الرئيسية').setStyle(ButtonStyle.Secondary)
  );
}
// ========================================================
// 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 2 من 3]
// تسجيل الأوامر المائلة برمجياً، بث اللوجز، ومستمع الكوماند /panel
// ========================================================

// 1. تعريف الكوماند المائل المدمج مع الشرح التوضيحي المكتوب للمستخدم
const commands = [
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('🛠️ فتح لوحة التحكم التفاعلية الكبرى لإدارة خادم ماين كرافت واللاعبين')
].map(command => command.toJSON());

// 2. محرك التسجيل الآلي للأوامر عند إقلاع البوت والاتصال بـ Discord REST API
client.once('ready', async () => {
  console.log(`[Discord Bot]: تم تسجيل الدخول بسلام باسم ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('[Discord API]: جاري تسجيل السلاش كوماند (/panel) تلقائياً في خوادم ديسكورد...');

    // تسجيل الأمر بشكل عالمي (Global Command) لكي يظهر فورا في كافة السيرفرات
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('✅ [Discord API]: تم تفعيل وتسجيل السلاش كوماند بنجاح! اكتب / في السيرفر لتشاهده.');
  } catch (error) {
    console.error('[Discord API ERROR]: وفشل تسجيل الأوامر المائلة:', error);
  }

  // بث السجلات الحية القادمة من السوكيت إلى روم اللوجز المنفصلة حصرياً
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
      .setTitle('⚡ لوحة تحكم ماين كرافت السحابية الموحدة')
      .setDescription('مرحباً بك في غرفة عمليات ديسكورد بالأزرار الشجرية الكاملة المدعومة بالسلاش كوماند.\nاختر أحد الأقسام من الأزرار أدناه لبدء التحكم بالنقر:')
      .setColor('#00b0ff')
      .setTimestamp();

    // إرسال اللوحة مع الأزرار الشجرية الثلاثة المتناسقة
    await interaction.reply({
      embeds: [embed],
      components: [createMainRow1(), createMainRow2(), createMainRow3()]
    });
  }
});
// ========================================================
// 👾 [بوت ديسكورد المطور بالسلاش كوماند - الجزء 3 من 3]
// محرك تفاعلات الأزرار الشجرية، وتوليد أوامر وعقوبات اللاعبين نقرياً
// ========================================================

// الاستماع لنقرات الأزرار التفاعلية القادمة من اللوحة
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // إبلاغ ديسكورد فوراً باستلام الطلب لمنع كراش عدم الاستجابة (Disallowed Timeout)
  await interaction.deferReply({ ephemeral: true }).catch(() => { });

  const customId = interaction.customId;

  // أ) محرك التنقل الشجري التفاعلي بين القوائم لتحديث الشاشة
  if (customId === 'DISC_NAV_MAIN') {
    return interaction.editReply({ content: '🎮 تم الانتقال للقائمة الرئيسية العظمى حياً:', components: [createMainRow1(), createMainRow2(), createMainRow3()] });
  }
  if (customId === 'DISC_NAV_POWER') {
    return interaction.editReply({ content: '⚡ *قسم التحكم بالقدرة والتشغيل الحي:*', components: [createPowerRow()] });
  }
  if (customId === 'DISC_NAV_MANAGE') {
    return interaction.editReply({ content: '🛠️ *قسم الصيانة والأدوات المتقدمة والنسخ:*', components: [createManageRow()] });
  }

  // ب) معالجة أزرار القدرة العامة للسيرفر الخلفي (Power Actions)
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

  // ج) معالجة زر فحص الموارد الحية (Resource Monitor)
  if (customId === 'DISC_NAV_STATS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleStats = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        const emoji = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم / مطفأ';

        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 تقرير أداء خادم الاستضافة الفوري')
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

  // د) محرك سحب الحزم الحية وبناء أزرار سريعة ومستقلة لكل لاعب (مثل خيارات تلجرام)
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
          return interaction.editReply({ content: `❌ *[نظام الملفات]:* قسم \`${titleText}\` فارغ حالياً في سجلات ماين كرافت.`, components: [createBackToMainRow()] });
        }

        const dynamicRows = [];
        let currentRow = new ActionRowBuilder();

        activeList.slice(0, 20).forEach((name, index) => {
          if (index > 0 && index % 4 === 0) {
            dynamicRows.push(currentRow);
            currentRow = new ActionRowBuilder();
          }
          currentRow.addComponents(new ButtonBuilder().setCustomId(`${actionPrefix}${name.slice(0, 30)}`).setLabel(`👤 ${name}`).setStyle(ButtonStyle.Secondary));
        });
        dynamicRows.push(currentRow);
        dynamicRows.push(createBackToMainRow());

        interaction.editReply({ content: `⚙️ **لوحة القسم الموحد:** \`${titleText}\`\n\nانقر على اسم الحساب المستهدف مباشرة لتطبيق الإجراء التلقائي له:`, components: dynamicRows });
      }
    };
    ws.on('message', handleListRequest);
    return;
  }

  // هـ) محرك استقبال العقوبات وإلغاء الحظر الصادر من الأزرار الديناميكية السريعة وضخها للسوكيت
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

// تسجيل دخول البوت بسلام بملف الـ .env
client.login(process.env.DISCORD_TOKEN);
