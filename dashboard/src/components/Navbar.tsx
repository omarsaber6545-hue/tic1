'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Bot, ExternalLink } from 'lucide-react';

interface NavbarProps {
  guildName?: string;
  guildIcon?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ guildName, guildIcon }) => {
  return (
    <header className="h-16 border-b border-dark-border glass-panel px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Active Guild */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Horizon Services</h1>
            <p className="text-xs text-slate-400">لوحة التحكم السحابية</p>
          </div>
        </Link>

        {guildName && (
          <>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2 bg-dark-card/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              {guildIcon ? (
                <img src={guildIcon} alt={guildName} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                  {guildName.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-slate-200">{guildName}</span>
            </div>
          </>
        )}
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>البوت متصل 24/7</span>
        </div>

        <Link
          href="/"
          className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          تبديل السيرفر
        </Link>
      </div>
    </header>
  );
};
