import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';
import { Command } from '../../types/command.js';
import { createEmbed } from '../../utils/arabic.js';
import { COLORS } from '../../config/constants.js';

export const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('مساعدة')
    .setDescription('عرض دليل وأوامر البوت المتكاملة وكيفية استخدامها'),

  async execute(interaction: ChatInputCommandInteraction) {
    const mainEmbed = createEmbed({
      title: '📖 دليل أوامر ديسكورد العربي الاحترافي',
      description:
        'مرحباً بك! نظامنا يوفر باقة متكاملة من الأنظمة لإدارة وتطوير مجتمعك.\n\n' +
        'اختر القسم الذي تود استعراض أوامره من **القائمة المنسدلة أدناه** 👇\n\n' +
        '🛡️ **الإدارة والإشراف:** أوامر العقوبات وحماية السيرفر.\n' +
        '⭐ **النقاط والمستويات:** نظام الـ XP، بطاقة الرتبة، والمتصدرين.\n' +
        '🎫 **نظام التذاكر:** لوحة الدعم الفني والرومات الخاصة.\n' +
        '🪙 **الاقتصاد والمتجر:** رصيد المحفظة، التحويلات، والمتجر.\n' +
        '🎉 **المسابقات والاقتراحات:** السحوبات التلقائية وتصويت الأعضاء.',
      color: COLORS.PRIMARY
    })
      .setThumbnail(interaction.client.user?.displayAvatarURL({ size: 128 }) || null)
      .setFooter({ text: 'ديسكورد العرب • اختر القسم لعرض تفاصيل أوامره' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_select_category')
      .setPlaceholder('اختر قسماً لعرض أوامره...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('🛡️ الإدارة والإشراف والتحذيرات')
          .setDescription('أوامر الحظر، الطرد، التايم أوت، التحذيرات، وقفل الرومات')
          .setValue('moderation'),
        new StringSelectMenuOptionBuilder()
          .setLabel('⭐ النقاط والمستويات (XP)')
          .setDescription('أوامر الرتبة، المتصدرين، المكافآت، وإدارة النقاط')
          .setValue('points'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🎫 نظام التذاكر والدعم')
          .setDescription('أوامر نشر لوحة التذاكر وأزرار التحكم')
          .setValue('tickets'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🪙 الاقتصاد والمتجر')
          .setDescription('أوامر الرصيد، التحويل، المتجر، والشراء والحقيبة')
          .setValue('economy'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🎉 المسابقات والاقتراحات')
          .setDescription('أوامر إطلاق السحوبات ونظام الاقتراحات التفاعلي')
          .setValue('utility')
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [row],
      fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000 // 2 minutes
    });

    collector.on('collect', async (menuInt) => {
      if (menuInt.user.id !== interaction.user.id) {
        await menuInt.reply({
          content: 'عذراً، هذه القائمة خاصة بصاحب الأمر فقط!',
          ephemeral: true
        });
        return;
      }

      const selected = menuInt.values[0];

      if (selected === 'moderation') {
        const embed = createEmbed({
          title: '🛡️ أوامر الإدارة والإشراف والتحذيرات (16 أمراً)',
          description:
            '• `/حظر [العضو] [السبب] [حذف-الرسائل]` : حظر عضو نهائياً من السيرفر.\n' +
            '• `/فك-الحظر [المعرف] [السبب]` : إلغاء الحظر عن عضو بالـ ID.\n' +
            '• `/طرد [العضو] [السبب]` : طرد عضو من السيرفر.\n' +
            '• `/تايم-اوت [العضو] [المدة] [السبب]` : عزل عضو مؤقتاً ومنعه من الكتابة.\n' +
            '• `/إزالة-التايم-اوت [العضو] [السبب]` : فك العزل المؤقت عن العضو.\n' +
            '• `/تحذير [العضو] [السبب]` : إصدار تحذير رسمي مع فحص التصعيد التلقائي.\n' +
            '• `/تحذيرات [العضو]` : عرض سجل تحذيرات عضو محدد.\n' +
            '• `/إزالة-تحذير [رقم-التحذير]` : حذف تحذير محدد بواسطة رقمه.\n' +
            '• `/مسح-تحذيرات [العضو]` : تصفير ومسح كافة تحذيرات العضو.\n' +
            '• `/مسح [العدد] [العضو اختياري]` : حذف حتى 100 رسالة دفعة واحدة.\n' +
            '• `/قفل [الروم اختياري] [السبب]` : قفل الروم ومنع الجميع من الكتابة.\n' +
            '• `/فتح [الروم اختياري]` : فتح الروم والسماح بالكتابة مجدداً.\n' +
            '• `/بطء [الثواني]` : ضبط وضع التهدئة (Slowmode) في الروم.\n' +
            '• `/تغيير-الاسم [العضو] [الاسم-الجديد]` : تعديل الاسم المستعار لعضو.\n' +
            '• `/إضافة-رتبة [العضو] [الرتبة]` : منح رتبة لعضو مع فحص تسلسل الرتب.\n' +
            '• `/إزالة-رتبة [العضو] [الرتبة]` : سحب رتبة من عضو في السيرفر.',
          color: COLORS.DANGER
        });
        await menuInt.update({ embeds: [embed] });
      } else if (selected === 'points') {
        const embed = createEmbed({
          title: '⭐ أوامر النقاط والمستويات والـ XP (9 أوامر)',
          description:
            '• `/نقاط [العضو اختياري]` : معرفة رصيد النقاط والمستوى والـ XP الحالي.\n' +
            '• `/رتبتي [العضو اختياري]` : عرض بطاقة الرتبة التفاعلية (SVG Rank Card) مع شريط التقدم.\n' +
            '• `/المتصدرين [النوع]` : عرض أفضل 10 أعضاء حسب النقاط أو المستوى.\n' +
            '• `/يومي` : الحصول على المكافأة اليومية المجانية من النقاط والعملات.\n' +
            '• `/إضافة-نقاط [العضو] [الكمية]` : (إدارة) زيادة نقاط عضو محدد.\n' +
            '• `/خصم-نقاط [العضو] [الكمية]` : (إدارة) خصم نقاط من رصيد عضو.\n' +
            '• `/تعيين-نقاط [العضو] [الكمية]` : (إدارة) ضبط نقاط العضو برقم محدد.\n' +
            '• `/إضافة-xp [العضو] [الكمية]` : (إدارة) زيادة نقاط الخبرة والتحقق من الترقية.\n' +
            '• `/تعيين-مستوى [العضو] [المستوى]` : (إدارة) تغيير مستوى العضو وتصفير الـ XP.',
          color: COLORS.GOLD
        });
        await menuInt.update({ embeds: [embed] });
      } else if (selected === 'tickets') {
        const embed = createEmbed({
          title: '🎫 نظام التذاكر والدعم الفني',
          description:
            '• `/لوحة-التذاكر [الروم] [العنوان] [الوصف]` : إرسال لوحة فتح التذاكر التفاعلية.\n\n' +
            '📌 **الأقسام المدعومة في اللوحة:**\n' +
            '1. 🛠️ الدعم الفني\n' +
            '2. 🛒 المشتريات\n' +
            '3. 💰 الدفع والفوترة\n' +
            '4. 🚨 الإبلاغ والشكاوى\n' +
            '5. 🤝 الشراكات والإعلانات\n' +
            '6. ❓ استفسار آخر\n\n' +
            '⚙️ **الأزرار التفاعلية داخل كل تذكرة:**\n' +
            '• 📌 **استلام التذكرة**: تثبيت الموظف ومنع موظف آخر من الاستلام.\n' +
            '• 🔒 **إغلاق التذكرة**: تأكيد، إنشاء سجل Transcript وحفظه، وحذف الروم بعد 5 ثوانٍ.\n' +
            '• ✏️ **تغيير الاسم**: تعديل اسم روم التذكرة عبر نافذة منبثقة.\n' +
            '• ➕ **إضافة عضو**: منح صلاحية لعضو لدخول التذكرة.\n' +
            '• ➖ **إزالة عضو**: إخراج العضو وسحب صلاحياته.\n' +
            '• 📄 **تحميل Transcript**: توليد ملف HTML فوري بتنسيق Discord Dark.',
          color: COLORS.INFO
        });
        await menuInt.update({ embeds: [embed] });
      } else if (selected === 'economy') {
        const embed = createEmbed({
          title: '🪙 أوامر الاقتصاد والمتجر (6 أوامر)',
          description:
            '• `/رصيدي [العضو اختياري]` : عرض رصيد الكاش والبنك وإجمالي الثروة.\n' +
            '• `/أسبوعي` : الحصول على الراتب والمكافأة الأسبوعية الكبرى.\n' +
            '• `/تحويل [المستلم] [المبلغ]` : تحويل عملات لعضو آخر بأمان.\n' +
            '• `/المتجر` : استعراض المنتجات والرتب الحصرية المعروضة للبيع بالسيرفر.\n' +
            '• `/شراء [رقم-المنتج]` : شراء رتبة أو منتج ومنح الرتبة تلقائياً.\n' +
            '• `/حقيبتي` : استعراض قائمة مقتنياتك ومشترياتك السابقة من المتجر.',
          color: COLORS.SUCCESS
        });
        await menuInt.update({ embeds: [embed] });
      } else if (selected === 'utility') {
        const embed = createEmbed({
          title: '🎉 أوامر المسابقات والاقتراحات',
          description:
            '• `/اقتراح [النص]` : نشر اقتراح جديد في الروم المخصص مع أزرار تصويت تفاعلية (👍/👎).\n' +
            '• `/مسابقة إنشاء [الجائزة] [المدة] [الفائزين] [رتبة] [نقاط]` : بدء سحب ومسابقة جديدة بزر دخول 🎉.\n' +
            '• `/مسابقة إنهاء [معرف-الرسالة]` : إنهاء مسابقة جارية فوراً وسحب الفائزين.\n' +
            '• `/مسابقة إعادة-اختيار [معرف-الرسالة]` : إعادة السحب واختيار فائز بديل.',
          color: COLORS.PURPLE
        });
        await menuInt.update({ embeds: [embed] });
      }
    });

    collector.on('end', async () => {
      row.components[0].setDisabled(true);
      await interaction.editReply({ components: [row] }).catch(() => null);
    });
  }
};
