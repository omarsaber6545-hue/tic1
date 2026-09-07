import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import { Server, Users, Ticket, Shield, ArrowLeft, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch guilds from database
  let guilds = await prisma.guild.findMany({
    include: {
      _count: {
        select: {
          members: true,
          tickets: true,
          warnings: true
        }
      }
    }
  });

  if (guilds.length === 0) {
    // Seed default guild so user has instant dashboard access
    const defaultGuild = await prisma.guild.create({
      data: {
        id: '123456789012345678',
        name: 'مجتمع ديسكورد العربي الرئيسي',
        icon: null,
        settings: {
          create: {
            welcomeEnabled: true,
            pointsEnabled: true,
            ticketsEnabled: true,
            autoModEnabled: true
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            tickets: true,
            warnings: true
          }
        }
      }
    });
    guilds = [defaultGuild];
  }

  const totalMembers = await prisma.member.count();
  const totalTickets = await prisma.ticket.count();
  const totalWarnings = await prisma.warning.count();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
            نظام متكامل واحترافي 100% باللغة العربية
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            تحكم بسيرفراتك بكل <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">قوة واحترافية</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
            إدارة كاملة للسيرفر، نظام تذاكر متطور، نقاط ومستويات، حماية تلقائية، وسجلات دقيقة في منصة واحدة وسريعة.
          </p>
        </section>

        {/* Global Statistics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Server className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">السيرفرات المدارة</p>
              <h3 className="text-2xl font-bold text-white mt-1">{guilds.length}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي الأعضاء</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalMembers}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي التذاكر</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalTickets}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">التحذيرات الصادرة</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalWarnings}</h3>
            </div>
          </div>
        </section>

        {/* Guilds List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">السيرفرات المتاحة</h2>
              <p className="text-sm text-slate-400">اختر السيرفر الذي ترغب في ضبط إعداداته وإدارته</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map((guild: any) => (
              <div
                key={guild.id}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-6 border border-slate-800 hover:border-brand-500/50"
              >
                <div className="flex items-start gap-4">
                  {guild.icon ? (
                    <img
                      src={guild.icon}
                      alt={guild.name}
                      className="w-14 h-14 rounded-2xl object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      {guild.name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{guild.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">ID: {guild.id}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span>👥 {guild._count.members} عضو</span>
                      <span>🎫 {guild._count.tickets} تذكرة</span>
                      <span>⚠️ {guild._count.warnings} تحذير</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/manage/${guild.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-600/20"
                >
                  <span>إدارة السيرفر</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        نظام Discord العربي المتكامل • مبني بأحدث تقنيات Next.js و Prisma
      </footer>
    </div>
  );
}
