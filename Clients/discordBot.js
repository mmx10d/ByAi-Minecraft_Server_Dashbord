// ========================================================
// 👾 [بوت ديسكورد المحترف المحدث - الجزء 1 من 2]
// تهيئة المكتبات، الاتصال بالسوكيت، وبناء الأزرار العامة والقوائم
// ========================================================

const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');
require('dotenv').config({ path: '../.env' });

// تأسيس كائن بوت ديسكورد مع تفعيل الصلاحيات اللازمة لقراءة الشات
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// الاتصال الفوري بخادم السوكيت المركزي للنواة الخلفية للمشروع
const ws = new WebSocket(process.env.SOCKET_URL);

// متغير الذاكرة المؤقتة لحفظ اسم اللاعب المستهدف عند تطبيق إجراءات لوحة ديسكورد
let selectedPlayerContext = "";

client.once('ready', () => {
  console.log(`[Discord Bot]: يعمل بنجاح ومسجل باسم ${client.user.tag}`);

  // استقبال الـ Logs المتدفقة حياً وبثها داخل روم الديسكورد المحددة في الـ .env
  ws.on('message', (message) => {
    try {
      const response = JSON.parse(message.toString());
      if (response.type === 'LOG') {
        const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        if (channel) {
          // إرسال الـ Log في كتلة برمجية ليكون منسقاً وقابلاً للقراءة
          channel.send(`\`\`\`ansi\n${response.data}\n\`\`\``).catch(() => { });
        }
      }
    } catch (e) {
      // تجاهل الحزم الأخرى كالموارد أثناء تدفق السجلات
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
// 👾 [بوت ديسكورد المحترف المحدث - الجزء 2 من 2]
// معالج تفاعلات الأزرار والقوائم المنسدلة (Interaction Handler)
// ========================================================

// الاستماع لكتابة أمر تشغيل اللوحة يدوياً في الشات المخصص
client.on('messageCreate', async (message) => {
  if (message.author.bot || message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

  // عند كتابة كلمة "لوحة" أو "!panel" تظهر اللوحة الرسومية المتطورة
  if (message.content === '!panel' || message.content === 'لوحة') {
    const embed = new EmbedBuilder()
      .setTitle('⚡ لوحة تحكم ماين كرافت السحابية الاحترافية')
      .setDescription('مرحباً بك في غرفة عمليات ديسكورد المتصلة بالنواة الخلفية حياً.\nاختر أحد الأوامر أو أقسام إدارة اللاعبين من الأزرار التفاعلية أدناه:')
      .setColor('#00b0ff')
      .setTimestamp();

    message.channel.send({ embeds: [embed], components: [createMainButtons(), createManagementButtons()] });
  } else {
    // تمرير أي نص آخر عادي كأمر كونسل مباشر (للحالات السريعة)
    ws.send(JSON.stringify({
      action: 'MINECRAFT_COMMAND',
      payload: { command: message.content.trim() }
    }));
  }
});

// معالجة نقرات الأزرار والقوائم المنسدلة (Interaction Handler)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // تمديد الوقت لمعالجة الطلبات القادمة من السوكيت بأمان
  await interaction.deferUpdate().catch(() => { });

  const customId = interaction.customId;

  // 1. معالجة أزرار القدرة العامة (Power Component)
  if (customId === 'DISC_START') {
    ws.send(JSON.stringify({ action: 'START_SERVER' }));
    return interaction.channel.send('🚀 *[ديسكورد]:* جاري بدء تشغيل وإيقاظ السيرفر وتوليد عملية الجافا بالخلفية...');
  }
  if (customId === 'DISC_STOP') {
    ws.send(JSON.stringify({ action: 'STOP_SERVER' }));
    return interaction.channel.send('🛑 *[ديسكورد]:* تم إرسال أمر الإيقاف الآمن لحفظ ملفات الخريطة وعوالم اللاعبين.');
  }
  if (customId === 'DISC_RESTART') {
    ws.send(JSON.stringify({ action: 'RESTART_SERVER' }));
    return interaction.channel.send('🔄 *[ديسكورد]:* تم تفعيل إعادة التشغيل الذكية لإنعاش المنفذ والملفات.');
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
        interaction.channel.send({ embeds: [statsEmbed] });
      }
    };
    ws.on('message', handleStats);
    return;
  }

  // 3. محرك جافا سكريبت الذكي لتحويل ملفات الـ JSON للاعبين إلى قوائم اختيار منسدلة (Menus)
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
          return interaction.channel.send('❌ *[نظام الإدارة]:* القائمة المطلوبة فارغة حالياً في ملفات السيرفر.');
        }

        // صياغة خيارات القائمة المنسدلة من مصفوفة الأسماء الحقيقية
        const options = targetList.slice(0, 25).map(name => ({ label: `👤 الحساب: ${name}`, value: name }));
        const rowMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId(menuActionId).setPlaceholder(selectPlaceholder).addOptions(options)
        );
        interaction.channel.send({ components: [rowMenu] });
      }
    };
    ws.on('message', handleMenuData);
    return;
  }

  // 4. تنفيذ العقوبات الفورية بناءً على خيار القائمة المنسدلة المكبوسة
  if (customId === 'SELECT_PLAYER_PARDON') {
    const player = interaction.values[0];
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `pardon ${player}` } }));
    return interaction.channel.send(`✅ *[العقوبات]:* تم إلغاء حظر اللاعب \`${player}\` بنجاح وعاد للوايت لست.`);
  }

  if (customId === 'SELECT_PLAYER_DEOP') {
    const player = interaction.values[0];
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `deop ${player}` } }));
    return interaction.channel.send(`🛡️ *[الرتب]:* تم تجريد اللاعب \`${player}\` من صلاحيات الأدمن والكونسل.`);
  }

  // عند اختيار لاعب أونلاين، نفتح له أزرار الإجراءات الفردية الفورية
  if (customId === 'SELECT_PLAYER_CURE') {
    selectedPlayerContext = interaction.values[0];

    const cureRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('DISC_KICK').setLabel(`🥾 طرد ${selectedPlayerContext}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('DISC_BAN').setLabel(`🚫 بن لـ ${selectedPlayerContext}`).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('DISC_OP').setLabel(`👑 رتبة OP لـ ${selectedPlayerContext}`).setStyle(ButtonStyle.Success)
    );
    interaction.channel.send({ content: `🛠️ *خيارات التحكم المباشر باللاعب:* \`${selectedPlayerContext}\``, components: [cureRow] });
    return;
  }

  // 5. ضخ أوامر العقوبات الفردية للسيرفر عبر السوكيت
  if (customId === 'DISC_KICK' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `kick ${selectedPlayerContext} طرد سريع عبر ديسكورد` } }));
    return interaction.channel.send(`✅ تم طرد اللاعب \`${selectedPlayerContext}\` خارج خادم اللعبة.`);
  }
  if (customId === 'DISC_BAN' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `ban ${selectedPlayerContext} حظر صارم عبر ديسكورد` } }));
    return interaction.channel.send(`🚨 تم حظر اللاعب \`${selectedPlayerContext}\` نهائياً وإدراجه في البان ليست.`);
  }
  if (customId === 'DISC_OP' && selectedPlayerContext) {
    ws.send(JSON.stringify({ action: 'MINECRAFT_COMMAND', payload: { command: `op ${selectedPlayerContext}` } }));
    return interaction.channel.send(`👑 تم ترفيع اللاعب \`${selectedPlayerContext}\` إلى مرتبة مسؤول الكونسل.`);
  }
});

// تسجيل دخول البوت بسلام
client.login(process.env.DISCORD_TOKEN);
