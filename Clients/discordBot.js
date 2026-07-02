// ========================================================
// 👾 [بوت ديسكورد المصلح والمفصول - الجزء 1 من 2]
// تهيئة الصلاحيات، الاتصال بالسوكيت، وبث السجلات لروم اللوجز المنفصلة
// ========================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// إعداد صلاحيات الإقلاع الشاملة والمتوافقة مع بوابات ديسكورد الأمنية المحدثة
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// الاتصال الفوري بخادم السوكيت المركزي للنواة الخلفية للمشروع (ws://localhost:8080)
const ws = new WebSocket(process.env.SOCKET_URL);

// متغير الذاكرة المؤقتة لحفظ اسم اللاعب المستهدف عند تطبيق عقوبات اللوحة
let selectedPlayerContext = "";

client.once('ready', () => {
  console.log(`[Discord Bot]: تم فصل الرومات وتحديث النمط! البوت يعمل باسم ${client.user.tag}`);

  // استقبال الـ Logs المتدفقة حياً وبثها حصرياً داخل روم السجلات المنفصلة (LOGS CHANNEL)
  ws.on('message', (message) => {
    try {
      const response = JSON.parse(message.toString());
      if (response.type === 'LOG') {
        // جلب آيدي روم اللوجز المنفصلة حصرياً من الـ .env
        const logChannel = client.channels.cache.get(process.env.DISCORD_LOGS_CHANNEL_ID);
        if (logChannel) {
          // إرسال الـ Log في كتلة برمجية منسقة لعدم تشويه شات اللوحة والتحكم
          logChannel.send(`\`\`\`ansi\n${response.data}\n\`\`\``).catch(() => { });
        }
      }
    } catch (e) {
      // تجاهل حزم الموارد أثناء تدفق السجلات الحية
    }
  });
});

// إنشاء صف الأزرار التفاعلية الأساسي للوحة تحكم ديسكورد الكبرى
function createMainButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_START').setLabel('▶️ تشغيل السيرفر').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('DISC_STOP').setLabel('🛑 إيقاف آمن').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('DISC_RESTART').setLabel('🔄 إعادة تشغيل').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_STATS').setLabel('📊 فحص الموارد').setStyle(ButtonStyle.Secondary)
  );
}

// إنشاء صف أزرار إدارة القوائم المتقدمة (JSON Files)
function createManagementButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('DISC_MENU_PLAYERS').setLabel('👥 اللاعبين أونلاين').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('DISC_MENU_BANLIST').setLabel('🚫 المحظورين (Ban)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('DISC_MENU_OPS').setLabel('👑 المسؤولين (OP)').setStyle(ButtonStyle.Secondary)
  );
}
// ========================================================
// 👾 [بوت ديسكورد المصلح والمفصول - الجزء 2 من 2]
// معالج التفاعلات والأوامر المنفصلة حصرياً داخل روم الأوامر واللوحة
// ========================================================

// الاستماع لكتابة أمر تشغيل اللوحة يدوياً في روم الأوامر المخصصة حصرياً
client.on('messageCreate', async (message) => {
  // 💡 حماية صارمة: منع البوتات والإنصات الحصري فقط لروم الأوامر المحددة في الـ .env
  if (message.author.bot || message.channel.id !== process.env.DISCORD_COMMANDS_CHANNEL_ID) return;

  // عند كتابة كلمة "لوحة" أو "!panel" تظهر اللوحة الرسومية المتطورة
  if (message.content === '!panel' || message.content === 'لوحة') {
    const embed = new EmbedBuilder()
      .setTitle('⚡ لوحة تحكم ماين كرافت السحابية الاحترافية')
      .setDescription('مرحباً بك في غرفة عمليات ديسكورد المنفصلة والمربوطة بالنواة الخلفية حياً.\nاختر أحد الأوامر أو أقسام إدارة اللاعبين من الأزرار أدناه:')
      .setColor('#00b0ff')
      .setTimestamp();

    message.channel.send({ embeds: [embed], components: [createMainButtons(), createManagementButtons()] });
  } else {
    // تمرير أي نص آخر عادي كأمر كونسل مباشر (للحالات السريعة) من روم الأوامر
    ws.send(JSON.stringify({
      action: 'MINECRAFT_COMMAND',
      payload: { command: message.content.trim() }
    }));
  }
});

// معالجة نقرات الأزرار والقوائم المنسدلة (Interaction Handler) لروم التحكم
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // إبلاغ ديسكورد فوراً بأن البوت استلم الأمر وجاري المعالجة لحل مشكلة التأخير
  await interaction.deferReply({ ephemeral: true }).catch(() => { });

  const customId = interaction.customId;

  // 1. معالجة أزرار القدرة العامة (Power Component)
  if (customId === 'DISC_START') {
    ws.send(JSON.stringify({ action: 'START_SERVER' }));
    return interaction.editReply('🚀 *[ديسكورد]:* جاري بدء تشغيل وإيقاظ السيرفر وتوليد عملية الجافا بالخلفية...');
  }
  if (customId === 'DISC_STOP') {
    ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
    return interaction.editReply('🛑 *[ديسكورد]:* تم إرسال أمر الإيقاف الآمن لحفظ ملفات الخريطة وعوالم اللاعبين.');
  }
  if (customId === 'DISC_RESTART') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    return interaction.editReply('🔄 *[ديسكورد]:* تم تفعيل إعادة التشغيل الذكية لإنعاش المنفذ والملفات.');
  }

  // 2. زر فحص الموارد الحية (Resource Monitor)
  if (customId === 'DISC_STATS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleStats = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleStats);
        const { ram, cpu, status, playersCount } = response.data;
        const emoji = status === 'ONLINE' ? '🟢 يعمل حالياً' : '🔴 في وضع النوم';

        const statsEmbed = new EmbedBuilder()
          .setTitle('📊 تقرير أداء جهاز الاستضافة')
          .addFields(
            { name: '🖥️ حالة الخادم:', value: emoji, inline: true },
            { name: '📟 المعالج CPU:', value: `\`${cpu}\``, inline: true },
            { name: '💾 الذاكرة RAM:', value: `\`${ram}\``, inline: true },
            { name: '👥 المتصلين:', value: `\`${playersCount}\` لاعب`, inline: true }
          )
          .setColor('#00e676');
        interaction.editReply({ embeds: [statsEmbed] });
      }
    };
    ws.on('message', handleStats);
    return;
  }

  // 3. تحويل ملفات الـ JSON للاعبين بالأسماء الصافية إلى قوائم اختيار منسدلة (Menus)
  if (customId === 'DISC_MENU_PLAYERS' || customId === 'DISC_MENU_BANLIST' || customId === 'DISC_MENU_OPS') {
    ws.send(JSON.stringify({ action: 'GET_HOST_STATS' }));

    const handleMenuData = (data) => {
      const response = JSON.parse(data.toString());
      if (response.type === 'HOST_STATS') {
        ws.off('message', handleMenuData);

        let targetList = [];
        let selectPlaceholder = "";
        let menuActionId = "";

        if (customId === 'DISC_MENU_PLAYERS') {
          // سحب الحسابات الصافية المستخرجة عبر الـ RegEx الحقيقي
          targetList = response.data.playersOnline || [];
          selectPlaceholder = "👥 اختر لاعباً متصلاً لتطبيق العقوبة عليه...";
          menuActionId = "SELECT_PLAYER_CURE";
        } else if (customId === 'DISC_MENU_BANLIST') {
          targetList = response.data.bannedPlayersList || [];
          selectPlaceholder = "🟢 اختر لاعباً محظوراً لإلغاء البان عنه...";
          menuActionId = "SELECT_PLAYER_PARDON";
        } else if (customId === 'DISC_MENU_OPS') {
          targetList = response.data.opsList || [];
          selectPlaceholder = "🛡️ اختر مسؤولاً لسحب رتبة الـ OP منه...";
          menuActionId = "SELECT_PLAYER_DEOP";
        }

        if (targetList.length === 0) {
          return interaction.editReply('❌ *[نظام الإدارة]:* القائمة المطلوبة فارغة حالياً في ملفات السيرفر حياً.');
        }

        // صياغة خيارات القائمة المنسدلة النظيفة
        const options = targetList.slice(0, 25).map(name => ({ label: `👤 الحساب: ${name}`, value: name }));
        const rowMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId(menuActionId).setPlaceholder(selectPlaceholder).addOptions(options)
        );

        interaction.channel.send({ content: selectPlaceholder, components: [rowMenu] });
        interaction.editReply('🔄 تم توليد القائمة المنسدلة في روم الأوامر بنجاح.');
      }
    };
    ws.on('message', handleMenuData);
    return;
  }

  // 4. تنفيذ الأوامر بالأسماء الصافية تماماً وبدون أرقام مشوهة
  if (customId === 'SELECT_PLAYER_PARDON') {
    const player = interaction.values[0];
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon ${player}` } }));
    return interaction.editReply(`✅ *[العقوبات]:* تم إلغاء حظر اللاعب \`${player}\` بنجاح ويمكنه الدخول.`);
  }

  if (customId === 'SELECT_PLAYER_DEOP') {
    const player = interaction.values[0];
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${player}` } }));
    return interaction.editReply(`🛡️ *[الرتب]:* تم تجريد اللاعب \`${player}\` من صلاحيات الأدمن والمسؤول بنجاح.`);
  }

  // فتح أزرار الإجراءات الفردية الفورية للاعب الأونلاين المختار بدقة وصافياً
  if (customId === 'SELECT_PLAYER_CURE') {
    selectedPlayerContext = interaction.values[0];

    const cureRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('DISC_KICK').setLabel(`🥾 طرد ${selectedPlayerContext}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('DISC_BAN').setLabel(`🚫 بن لـ ${selectedPlayerContext}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('DISC_OP').setLabel(`👑 رتبة OP لـ ${selectedPlayerContext}`).setStyle(ButtonStyle.Success)
    );
    interaction.channel.send({ content: `🛠️ *خيارات التحكم المباشر باللاعب الصافي:* \`${selectedPlayerContext}\``, components: [cureRow] });
    return interaction.editReply('🎯 تم فتح خيارات التحكم الخاصة باللاعب المختار.');
  }

  // 5. ضخ أوامر العقوبات بالاسم الصافي دون تكرار أو التصاق أرقام الـ Entity ID
  if (customId === 'DISC_KICK' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `kick ${selectedPlayerContext} طرد سريع ومؤتمت عبر ديسكورد` } }));
    return interaction.editReply(`✅ تم طرد اللاعب \`${selectedPlayerContext}\` خارج السيرفر بنجاح.`);
  }
  if (customId === 'DISC_BAN' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `ban ${selectedPlayerContext} حظر صارم ومؤتمت عبر ديسكورد` } }));
    return interaction.editReply(`🚨 تم حظر اللاعب \`${selectedPlayerContext}\` نهائياً وإدراجه في ملف الحظر بالقرص.`);
  }
  if (customId === 'DISC_OP' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `op ${selectedPlayerContext}` } }));
    return interaction.editReply(`👑 تم ترفيع اللاعب \`${selectedPlayerContext}\` إلى مرتبة مسؤول الكونسل الكاملة.`);
  }
});

// تسجيل دخول البوت بسلام
client.login(process.env.DISCORD_TOKEN);
