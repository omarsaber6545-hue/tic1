'use client';

import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Award,
  Ticket,
  Lock,
  UserPlus,
  FileText,
  Coins
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'moderation'
  | 'points'
  | 'tickets'
  | 'automod'
  | 'welcome'
  | 'logs'
  | 'economy';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'moderation',
      label: 'الإدارة والتحذيرات',
      icon: <ShieldAlert className="w-5 h-5" />
    },
    {
      id: 'points',
      label: 'النقاط والمستويات',
      icon: <Award className="w-5 h-5" />,
      badge: 'XP'
    },
    {
      id: 'tickets',
      label: 'نظام التذاكر',
      icon: <Ticket className="w-5 h-5" />
    },
    {
      id: 'automod',
      label: 'الحماية التلقائية',
      icon: <Lock className="w-5 h-5" />
    },
    {
      id: 'welcome',
      label: 'نظام الترحيب',
      icon: <UserPlus className="w-5 h-5" />
    },
    {
      id: 'logs',
      label: 'سجلات السيرفر',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'economy',
      label: 'الاقتصاد والمتجر',
      icon: <Coins className="w-5 h-5" />
    }
  ];

  return (
    <aside className="w-64 border-l border-dark-border glass-panel min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 px-3 pb-2 uppercase tracking-wider">
          إعدادات السيرفر
        </p>

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-800/80">
        <div className="bg-dark-card/40 border border-slate-800 p-3 rounded-xl">
          <p className="text-xs font-semibold text-slate-300">Horizon Services v1.0</p>
          <p className="text-[11px] text-slate-500 mt-0.5">جميع الحقوق محفوظة لسيرفر Horizon</p>
        </div>
      </div>
    </aside>
  );
};
