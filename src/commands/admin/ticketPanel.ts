import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createEmbed, createSuccessEmbed, createErrorEmbed } from '../../utils/arabic.js';
import { COLORS, TICKET_CATEGORIES } from '../../config/constants.js';

export const ticketPanelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('لوحة-التذاكر')
    .setDescription('إرسال لوحة فتح التذاكر الاحترافية التفاعلية إلى روم مخصص')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option.setName('الروم').setDescription('الروم المراد إرسال اللوحة إليه (افتراضياً الروم الحالي)').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('العنوان').setDescription('عنوان مخصص للوحة التذاكر').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('الوصف').setDescription('وصف وتعليمات مخصصة داخل اللوحة').setRequired(false)
    )
    .addStringOption((option) =>
      option.setName('الصورة').setDescription('رابط صورة بنر للوحة التذاكر (Banner Image URL)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const channel = (interaction.options.getChannel('الروم') || interaction.channel) as TextChannel;
    const title =
      interaction.options.getString('العنوان') ||
      '🎫 مـركـز الـدعـم والـخـدمـات والـمـسـاعـدة • Support Center';
    const bannerUrl = interaction.options.getString('الصورة');

    const defaultDescription =
      `# ╭━━━━━━━━ ✦ HORIZON SERVICES ✦ ━━━━━━━━╮\n` +
      `### 🌟 مرحباً بك في مركز المساعدة وخدمة الأعضاء الموحد\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `> فريق الدعم الفني والإدارة في سيرفر **${interaction.guild.name}** متواجد لخدمتك والإجابة على كافة استفساراتك بأعلى درجات السرعة والاحترافية.\n\n` +
      `◈ ───────────────── 📂 الأقـسـام الـمـتـاحـة ───────────────── ◈\n\n` +
      `🛠️ **الدعم الفني والتقني:** مساعدة وحل المشاكل التقنية والبرمجية بالسيرفر.\n` +
      `🛒 **المبيعات والمتجر:** طلب الرتب الحصرية، الخدمات المدفوعة، والعروض الخاصة.\n` +
      `💰 **الدفع والفوترة:** تأكيد التحويلات المالية، طرق الدفع وشحن الرصيد.\n` +
      `🚨 **الشكاوى والإبلاغ:** تقديم بلاغات عن مخالفات الأعضاء والشكاوى الإدارية.\n` +
      `🤝 **الشراكات والإعلانات:** طلبات التعاون التجاري، الرعايات والتبادل الإعلاني.\n` +
      `❓ **استفسارات عامة:** أي سؤال أو موضوع غير مصنف في الأقسام أعلاه.\n\n` +
      `◈ ───────────────── 📌 قـواعـد وإرشـادات ───────────────── ◈\n` +
      `▫️ **يرجى عدم فتح تذاكر دون سبب:** فتح التذاكر العبثية قد يعرضك للعقوبة.\n` +
      `▫️ **التفصيل بالرسالة:** يرجى توضيح طلبك أو مشكلتك فور فتح التذكرة.\n` +
      `▫️ **سجل المحادثة (Transcript):** يتم حفظ نسخة موثقة كاملة لكل تذكرة.\n\n` +
      `◈ ──────────────────────────────────────────────────────── ◈\n` +
      `⚡ **لفتح تذكرتك الآن: اختر القسم المناسب لموضوعك من القائمة أدناه:**`;

    const description = interaction.options.getString('الوصف') || defaultDescription;

    if (!channel || !channel.isTextBased()) {
      await interaction.reply({
        embeds: [createErrorEmbed('خطأ', 'يرجى اختيار روم كتابي صالح!')],
        ephemeral: true
      });
      return;
    }

    const embed = createEmbed({
      title,
      description,
      color: COLORS.PRIMARY
    })
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .setFooter({
        text: `${interaction.guild.name} • نظام التذاكر المتكامل | Horizon Services`,
        iconURL: interaction.guild.iconURL() || undefined
      });

    if (bannerUrl && bannerUrl.startsWith('http')) {
      embed.setImage(bannerUrl);
    }

    // Direct Select Menu on the Panel
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select_category')
      .setPlaceholder('🔽 اضغط هنا لاختيار قسم التذكرة والبدء فوراً...')
      .addOptions(
        TICKET_CATEGORIES.map((cat) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.label)
            .setDescription(cat.description)
            .setEmoji(cat.emoji)
            .setValue(cat.id)
        )
      );

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_menu')
        .setLabel('فتح تذكرة سريعة')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    try {
      await channel.send({
        embeds: [embed],
        components: [selectRow, buttonRow]
      });

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            'تم إرسال لوحة التذاكر الفخمة بنجاح! 🚀',
            `تم نشر لوحة التذاكر المطورة في الروم ${channel} مع القائمة التفاعلية وزر الفتح السريع.`
          )
        ],
        ephemeral: true
      });
    } catch (err: any) {
      console.error('Error sending ticket panel:', err);
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            'فشل إرسال لوحة التذاكر',
            `تأكد من امتلاك البوت لصلاحيات (Send Messages / Embed Links) في الروم المحدد.\n\`${err?.message || err}\``
          )
        ],
        ephemeral: true
      });
    }
  }
};
