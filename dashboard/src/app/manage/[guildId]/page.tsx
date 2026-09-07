'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar, TabType } from '@/components/Sidebar';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Ticket,
  Shield,
  Award,
  Trash2,
  Plus,
  Eye,
  X
} from 'lucide-react';

export default function GuildManagePage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [guildData, setGuildData] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  // Shop item form state
  const [newShopItem, setNewShopItem] = useState({
    name: '',
    description: '',
    price: 100,
    roleId: '',
    stock: -1
  });

  // Transcript viewer modal state
  const [viewTranscript, setViewTranscript] = useState<string | null>(null);

  useEffect(() => {
    fetchGuild();
  }, [guildId]);

  const fetchGuild = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/guilds/${guildId}`);
      const data = await res.json();
      if (data.success) {
        setGuildData(data.guild);
        setSettings(data.guild.settings || {});
      } else {
        setErrorMsg(data.message || 'تعذر تحميل بيانات السيرفر');
      }
    } catch (err: any) {
      setErrorMsg('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (overrideData?: any) => {
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const payload = overrideData || settings;
      const res = await fetch(`/api/guilds/${guildId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSuccessMsg('تم حفظ وتحديث الإعدادات بنجاح! 🚀');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.message || 'فشل حفظ الإعدادات');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء محاولة الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field: string) => {
    const newVal = !settings[field];
    const updated = { ...settings, [field]: newVal };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleDeleteWarning = async (warnId: number) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف التحذير رقم #${warnId}؟`)) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/warnings?warnId=${warnId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setGuildData((prev: any) => ({
          ...prev,
          warnings: prev.warnings.filter((w: any) => w.id !== warnId)
        }));
        setSuccessMsg('تم حذف التحذير بنجاح.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('فشل حذف التحذير');
    }
  };

  const handleAddShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopItem.name || !newShopItem.price) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShopItem)
      });
      const data = await res.json();
      if (data.success) {
        setGuildData((prev: any) => ({
          ...prev,
          shopItems: [...(prev.shopItems || []), data.item]
        }));
        setNewShopItem({ name: '', description: '', price: 100, roleId: '', stock: -1 });
        setSuccessMsg('تمت إضافة المنتج للمتجر بنجاح!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('تعذر إضافة المنتج للمتجر');
    }
  };

  const handleDeleteShopItem = async (itemId: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المنتج من المتجر؟')) return;
    try {
      const res = await fetch(`/api/guilds/${guildId}/shop?itemId=${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setGuildData((prev: any) => ({
          ...prev,
          shopItems: prev.shopItems.filter((i: any) => i.id !== itemId)
        }));
        setSuccessMsg('تم حذف المنتج بنجاح.');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      setErrorMsg('تعذر حذف المنتج');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-slate-300">جاري تحميل إعدادات السيرفر...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark-base text-gray-100">
      <Navbar guildName={guildData?.name} guildIcon={guildData?.icon} />

      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* Top Feedback Alerts */}
          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl shadow-lg">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظرة عامة على السيرفر</h2>
                <p className="text-sm text-slate-400">إحصائيات فورية ومفاتيح التحكم السريعة للأنظمة</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">الأعضاء المتفاعلون</p>
                    <h4 className="text-xl font-bold text-white mt-0.5">{guildData?.members?.length || 0}</h4>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">التذاكر المسجلة</p>
                    <h4 className="text-xl font-bold text-white mt-0.5">{guildData?.tickets?.length || 0}</h4>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">التحذيرات النشطة</p>
                    <h4 className="text-xl font-bold text-white mt-0.5">{guildData?.warnings?.length || 0}</h4>
                  </div>
                </div>
              </div>

              {/* Quick Module Toggles */}
              <div className="glass-card p-6 rounded-2xl space-y-6">
                <h3 className="font-bold text-lg text-white">التحكم السريع في الأنظمة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'welcomeEnabled', label: 'نظام الترحيب والأعضاء الجدد', desc: 'إرسال رسائل ترحيب ورتب تلقائية' },
                    { key: 'pointsEnabled', label: 'نظام النقاط والمستويات (XP)', desc: 'احتساب نقاط وخبرة للمتفاعلين' },
                    { key: 'ticketsEnabled', label: 'نظام التذاكر والدعم الفني', desc: 'السماح للأعضاء بفتح تذاكر خاصة' },
                    { key: 'autoModEnabled', label: 'نظام الحماية التلقائية (AutoMod)', desc: 'مكافحة السبام والدعوات والروابط' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/80"
                    >
                      <div>
                        <h5 className="font-semibold text-sm text-slate-200">{item.label}</h5>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                          settings[item.key] ? 'bg-brand-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings[item.key] ? '-translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODERATION */}
          {activeTab === 'moderation' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">الإشراف وقواعد التصعيد التلقائي</h2>
                <p className="text-sm text-slate-400">تحديد عقوبات تراكم التحذيرات ومراجعة سجل المخالفات</p>
              </div>

              {/* Warn Escalation Settings */}
              <div className="glass-card p-6 rounded-2xl space-y-6">
                <h3 className="font-bold text-lg text-white">قواعد التصعيد التلقائي للتحذيرات</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      عقوبة 3 تحذيرات
                    </label>
                    <select
                      value={settings.warnEscalation3 || 'TIMEOUT'}
                      onChange={(e) => handleSettingChange('warnEscalation3', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-brand-500"
                    >
                      <option value="TIMEOUT">عزل مؤقت (Timeout ساعة)</option>
                      <option value="KICK">طرد (Kick)</option>
                      <option value="BAN">حظر نهائي (Ban)</option>
                      <option value="NONE">لا شيء</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      عقوبة 5 تحذيرات
                    </label>
                    <select
                      value={settings.warnEscalation5 || 'KICK'}
                      onChange={(e) => handleSettingChange('warnEscalation5', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-brand-500"
                    >
                      <option value="TIMEOUT">عزل مؤقت (Timeout)</option>
                      <option value="KICK">طرد (Kick)</option>
                      <option value="BAN">حظر نهائي (Ban)</option>
                      <option value="NONE">لا شيء</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      عقوبة 7 تحذيرات
                    </label>
                    <select
                      value={settings.warnEscalation7 || 'BAN'}
                      onChange={(e) => handleSettingChange('warnEscalation7', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-brand-500"
                    >
                      <option value="BAN">حظر نهائي (Ban)</option>
                      <option value="KICK">طرد (Kick)</option>
                      <option value="TIMEOUT">عزل مؤقت (Timeout)</option>
                      <option value="NONE">لا شيء</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ قواعد التصعيد'}</span>
                  </button>
                </div>
              </div>

              {/* Recent Warnings Table */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">سجل التحذيرات الصادرة مؤخراً</h3>
                {guildData?.warnings?.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">لا توجد تحذيرات مسجلة في هذا السيرفر بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="text-xs text-slate-400 bg-slate-900/60 border-b border-slate-800">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">معرف العضو</th>
                          <th className="p-3">سبب التحذير</th>
                          <th className="p-3">المشرف</th>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {guildData?.warnings?.map((w: any) => (
                          <tr key={w.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-mono text-slate-400">#{w.id}</td>
                            <td className="p-3 font-mono text-slate-300">{w.userId}</td>
                            <td className="p-3 text-slate-200">{w.reason}</td>
                            <td className="p-3 font-mono text-xs text-slate-400">{w.moderatorId}</td>
                            <td className="p-3 text-xs text-slate-400">
                              {new Date(w.createdAt).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteWarning(w.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition"
                                title="مسح التحذير"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: POINTS & LEVELS */}
          {activeTab === 'points' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام النقاط والمستويات (XP)</h2>
                <p className="text-sm text-slate-400">تعديل معدلات كسب الخبرة والجوائز اليومية والمتصدرين</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معدل الـ XP لكل رسالة
                    </label>
                    <input
                      type="number"
                      value={settings.xpRate || 15}
                      onChange={(e) => handleSettingChange('xpRate', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      وقت الانتظار بين كسب الـ XP (بالثواني)
                    </label>
                    <input
                      type="number"
                      value={settings.xpCooldown || 60}
                      onChange={(e) => handleSettingChange('xpCooldown', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      النقاط المكتسبة لكل رسالة
                    </label>
                    <input
                      type="number"
                      value={settings.pointsPerMsg || 5}
                      onChange={(e) => handleSettingChange('pointsPerMsg', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف روم إعلانات الترقية (Level Up Channel ID)
                    </label>
                    <input
                      type="text"
                      placeholder="اتركه فارغاً للإرسال في نفس الروم"
                      value={settings.levelUpChannelId || ''}
                      onChange={(e) => handleSettingChange('levelUpChannelId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      مكافأة اليومي المجانية (/يومي)
                    </label>
                    <input
                      type="number"
                      value={settings.dailyReward || 100}
                      onChange={(e) => handleSettingChange('dailyReward', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      مكافأة الأسبوعي (/أسبوعي)
                    </label>
                    <input
                      type="number"
                      value={settings.weeklyReward || 500}
                      onChange={(e) => handleSettingChange('weeklyReward', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    نص رسالة الترقية (المتغيرات: {'{user}'}, {'{level}'}, {'{server}'})
                  </label>
                  <textarea
                    rows={2}
                    value={settings.levelUpMessage || ''}
                    onChange={(e) => handleSettingChange('levelUpMessage', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات النقاط'}</span>
                  </button>
                </div>
              </div>

              {/* Leaderboard preview */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">قائمة المتصدرين في السيرفر</h3>
                {guildData?.members?.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">لا توجد بيانات تفاعل للأعضاء بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="text-xs text-slate-400 bg-slate-900/60 border-b border-slate-800">
                        <tr>
                          <th className="p-3">الترتيب</th>
                          <th className="p-3">معرف العضو</th>
                          <th className="p-3">المستوى</th>
                          <th className="p-3">نقاط الخبرة (XP)</th>
                          <th className="p-3">النقاط</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {guildData?.members?.map((m: any, index: number) => (
                          <tr key={m.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-brand-400">#{index + 1}</td>
                            <td className="p-3 font-mono text-slate-300">{m.userId}</td>
                            <td className="p-3 font-bold text-purple-400">المستوى {m.level}</td>
                            <td className="p-3 text-slate-300">{m.xp} XP</td>
                            <td className="p-3 font-semibold text-amber-400">{m.points} نقطة</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام التذاكر والدعم الفني</h2>
                <p className="text-sm text-slate-400">إعداد فئات التذاكر، رتب الدعم، وسجلات الـ Transcripts</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف فئة التذاكر (Ticket Category ID)
                    </label>
                    <input
                      type="text"
                      placeholder="Category Channel ID"
                      value={settings.ticketCategoryId || ''}
                      onChange={(e) => handleSettingChange('ticketCategoryId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف رتبة الدعم الفني (Support Role ID)
                    </label>
                    <input
                      type="text"
                      placeholder="Support Role ID"
                      value={settings.supportRoleId || ''}
                      onChange={(e) => handleSettingChange('supportRoleId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف روم سجلات التذاكر (Logs Channel ID)
                    </label>
                    <input
                      type="text"
                      placeholder="Logs Channel ID"
                      value={settings.ticketLogChannelId || ''}
                      onChange={(e) => handleSettingChange('ticketLogChannelId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    الرسالة الترحيبية داخل التذكرة
                  </label>
                  <textarea
                    rows={3}
                    value={settings.ticketMessage || ''}
                    onChange={(e) => handleSettingChange('ticketMessage', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات التذاكر'}</span>
                  </button>
                </div>
              </div>

              {/* Tickets Table */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">سجل التذاكر المنفذة</h3>
                {guildData?.tickets?.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">لا توجد تذاكر مسجلة بعد.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="text-xs text-slate-400 bg-slate-900/60 border-b border-slate-800">
                        <tr>
                          <th className="p-3">رقم التذكرة</th>
                          <th className="p-3">القسم</th>
                          <th className="p-3">صاحب التذكرة</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">Transcript</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {guildData?.tickets?.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-indigo-400">#{t.ticketNumber}</td>
                            <td className="p-3 text-slate-200">{t.category}</td>
                            <td className="p-3 font-mono text-slate-300">{t.creatorId}</td>
                            <td className="p-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                  t.status === 'OPEN'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : t.status === 'CLAIMED'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {t.status === 'OPEN'
                                  ? 'مفتوحة'
                                  : t.status === 'CLAIMED'
                                  ? 'مستلمة'
                                  : 'مغلقة'}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-slate-400">
                              {new Date(t.createdAt).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="p-3">
                              {t.transcript ? (
                                <button
                                  onClick={() => setViewTranscript(t.transcript)}
                                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold bg-brand-500/10 px-2.5 py-1 rounded-lg transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>عرض السجل</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500">غير متوفر</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AUTOMOD */}
          {activeTab === 'automod' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام الحماية التلقائية (AutoMod)</h2>
                <p className="text-sm text-slate-400">تخصيص فلاتر الحماية من السبام، الروابط، والكلمات الممنوعة</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'antiSpam', label: 'مكافحة السبام (Anti-Spam)', desc: 'منع إرسال الرسائل بسرعة فائقة' },
                    { key: 'antiInvite', label: 'مكافحة روابط ديسكورد (Anti-Invite)', desc: 'منع نشر روابط سيرفرات أخرى' },
                    { key: 'antiLinks', label: 'مكافحة الروابط الخارجية (Anti-Links)', desc: 'منع نشر أي روابط إلكترونية' },
                    { key: 'antiFlood', label: 'مكافحة التكرار والفلود (Anti-Flood)', desc: 'منع تكرار الحروف والنصوص الطويلة' },
                    { key: 'antiDuplicate', label: 'منع تكرار الرسائل المتطابقة', desc: 'منع تكرار نفس الرسالة عدة مرات' },
                    { key: 'antiMentionSpam', label: 'مكافحة المنشن الجماعي والمكثف', desc: 'منع إزعاج الأعضاء والرتب بالمنشن' }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/80"
                    >
                      <div>
                        <h5 className="font-semibold text-sm text-slate-200">{item.label}</h5>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                          settings[item.key] ? 'bg-brand-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            settings[item.key] ? '-translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      العقوبة التلقائية عند المخالفة
                    </label>
                    <select
                      value={settings.autoModAction || 'WARN'}
                      onChange={(e) => handleSettingChange('autoModAction', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    >
                      <option value="DELETE">حذف الرسالة فقط</option>
                      <option value="WARN">تحذير العضو وحذف الرسالة</option>
                      <option value="TIMEOUT">عزل مؤقت (Timeout 10 دقائق)</option>
                      <option value="KICK">طرد من السيرفر (Kick)</option>
                      <option value="BAN">حظر نهائي (Ban)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      الحد الأقصى للرسائل (Anti-Spam Threshold)
                    </label>
                    <input
                      type="number"
                      value={settings.spamThreshold || 5}
                      onChange={(e) => handleSettingChange('spamThreshold', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      الحد الأقصى للمنشن بالرسالة
                    </label>
                    <input
                      type="number"
                      value={settings.mentionThreshold || 5}
                      onChange={(e) => handleSettingChange('mentionThreshold', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    قائمة الكلمات الممنوعة (اكتب الكلمات مفصولة بفاصلة)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="مثال: سبام, إعلان, كلمة1, كلمة2"
                    value={
                      (() => {
                        try {
                          const parsed = JSON.parse(settings.badWords || '[]');
                          return Array.isArray(parsed) ? parsed.join(', ') : settings.badWords;
                        } catch {
                          return settings.badWords || '';
                        }
                      })()
                    }
                    onChange={(e) => {
                      const words = e.target.value
                        .split(',')
                        .map((w) => w.trim())
                        .filter(Boolean);
                      handleSettingChange('badWords', JSON.stringify(words));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الحماية'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WELCOME */}
          {activeTab === 'welcome' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام الترحيب والرتب التلقائية</h2>
                <p className="text-sm text-slate-400">تخصيص رسالة دخول الأعضاء الجدد والرتبة الفورية</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف روم الترحيب (Welcome Channel ID)
                    </label>
                    <input
                      type="text"
                      placeholder="Channel ID"
                      value={settings.welcomeChannelId || ''}
                      onChange={(e) => handleSettingChange('welcomeChannelId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      معرف الرتبة التلقائية (Auto-Role ID)
                    </label>
                    <input
                      type="text"
                      placeholder="Role ID يُعطى للعضو فور انضمامه"
                      value={settings.autoRoleId || ''}
                      onChange={(e) => handleSettingChange('autoRoleId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    نص رسالة الترحيب في الروم (المتغيرات: {'{user}'}, {'{server}'}, {'{count}'})
                  </label>
                  <textarea
                    rows={3}
                    value={settings.welcomeMessage || ''}
                    onChange={(e) => handleSettingChange('welcomeMessage', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-sm text-slate-200">إرسال رسالة ترحيبية في الخاص (DM)</h5>
                      <p className="text-xs text-slate-500">إرسال رسالة ترحيب خاصة في المحادثة المباشرة للعضو</p>
                    </div>
                    <button
                      onClick={() => handleToggle('welcomeDmEnabled')}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        settings.welcomeDmEnabled ? 'bg-brand-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.welcomeDmEnabled ? '-translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.welcomeDmEnabled && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        نص رسالة الخاص (DM Message)
                      </label>
                      <textarea
                        rows={2}
                        value={settings.welcomeDmMessage || ''}
                        onChange={(e) => handleSettingChange('welcomeDmMessage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الترحيب'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام سجلات السيرفر (Audit Logs)</h2>
                <p className="text-sm text-slate-400">تخصيص رومات السجلات لكل حدث أو استخدام روم عام</p>
              </div>

              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    معرف روم السجلات العام (افتراضي لكافة الأحداث)
                  </label>
                  <input
                    type="text"
                    placeholder="General Log Channel ID"
                    value={settings.logChannelId || ''}
                    onChange={(e) => handleSettingChange('logChannelId', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  {[
                    { key: 'logModeration', label: 'سجلات الإشراف (حظر، طرد، تحذير)' },
                    { key: 'logTickets', label: 'سجلات التذاكر والـ Transcripts' },
                    { key: 'logJoinLeave', label: 'سجلات دخول وخروج الأعضاء' },
                    { key: 'logMessages', label: 'سجلات حذف وتعديل الرسائل' },
                    { key: 'logRoles', label: 'سجلات إضافة وسحب الرتب' },
                    { key: 'logChannels', label: 'سجلات إنشاء وحذف القنوات' },
                    { key: 'logServer', label: 'سجلات تغييرات إعدادات السيرفر والأسماء' }
                  ].map((logItem) => (
                    <div key={logItem.key}>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        {logItem.label}
                      </label>
                      <input
                        type="text"
                        placeholder="Channel ID (اختياري)"
                        value={settings[logItem.key] || ''}
                        onChange={(e) => handleSettingChange(logItem.key, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات السجلات'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ECONOMY */}
          {activeTab === 'economy' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">نظام الاقتصاد ومتجر السيرفر</h2>
                <p className="text-sm text-slate-400">تحديد العملة وإدارة المنتجات والرتب المعروضة للبيع</p>
              </div>

              {/* Currency settings */}
              <div className="glass-card p-6 rounded-2xl space-y-6">
                <h3 className="font-bold text-lg text-white">إعدادات العملة والمكافآت</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      اسم العملة (مثل: دينار، نقطة، درهم)
                    </label>
                    <input
                      type="text"
                      value={settings.currencyName || 'دينار'}
                      onChange={(e) => handleSettingChange('currencyName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      رمز العملة (الإيموجي)
                    </label>
                    <input
                      type="text"
                      value={settings.currencySymbol || '🪙'}
                      onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات العملة'}</span>
                  </button>
                </div>
              </div>

              {/* Add New Product Form */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">إضافة منتج جديد للمتجر</h3>
                <form onSubmit={handleAddShopItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المنتج</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رتبة VIP"
                      value={newShopItem.name}
                      onChange={(e) => setNewShopItem({ ...newShopItem, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">السعر</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="100"
                      value={newShopItem.price}
                      onChange={(e) => setNewShopItem({ ...newShopItem, price: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">معرف الرتبة المرتبطة (Role ID اختياري)</label>
                    <input
                      type="text"
                      placeholder="يُمنح العضو الرتبة تلقائياً عند الشراء"
                      value={newShopItem.roleId}
                      onChange={(e) => setNewShopItem({ ...newShopItem, roleId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">الكمية المتوفرة (-1 لغير محدود)</label>
                    <input
                      type="number"
                      placeholder="-1"
                      value={newShopItem.stock}
                      onChange={(e) => setNewShopItem({ ...newShopItem, stock: parseInt(e.target.value, 10) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">وصف المنتج</label>
                    <textarea
                      rows={2}
                      placeholder="وصف الامتيازات والمميزات التي يحصل عليها المشتري"
                      value={newShopItem.description}
                      onChange={(e) => setNewShopItem({ ...newShopItem, description: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة المنتج للمتجر</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Shop Items Table */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">المنتجات المعروضة حالياً بالمتجر</h3>
                {guildData?.shopItems?.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">المتجر فارغ حالياً.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="text-xs text-slate-400 bg-slate-900/60 border-b border-slate-800">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">اسم المنتج</th>
                          <th className="p-3">السعر</th>
                          <th className="p-3">الرتبة</th>
                          <th className="p-3">الكمية</th>
                          <th className="p-3">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {guildData?.shopItems?.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-mono text-slate-400">#{item.id}</td>
                            <td className="p-3 font-semibold text-white">{item.name}</td>
                            <td className="p-3 text-amber-400 font-bold">
                              {item.price} {settings.currencySymbol || '🪙'}
                            </td>
                            <td className="p-3 font-mono text-xs text-slate-400">
                              {item.roleId ? `@&${item.roleId}` : 'بدون رتبة'}
                            </td>
                            <td className="p-3 text-xs text-slate-300">
                              {item.stock === -1 ? 'غير محدود' : item.stock}
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => handleDeleteShopItem(item.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 transition"
                                title="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Transcript HTML Modal Viewer */}
      {viewTranscript && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-slate-700 w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-white">معاينة سجل التذكرة (Transcript Viewer)</h4>
              <button
                onClick={() => setViewTranscript(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={viewTranscript}
                className="w-full h-full border-none"
                title="Transcript Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
