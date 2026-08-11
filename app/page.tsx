"use client";

import Sidebar from "@/components/Sidebar";
import {
  Users,
  GraduationCap,
  Clock,
  TrendingUp,
  Activity,
  UserCheck,
  Zap,
  Star,
  Users2,
} from "lucide-react";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";

export default function Dashboard() {
  const { data: allUsers } = useFirebaseCollection("users");
  const teachers = allUsers.filter(u => u.role === 'teacher' && (u.status === 'approved' || u.status === 'active'));
  const students = allUsers.filter(u => u.role === 'student');
  const pending = allUsers.filter(u => u.role === 'teacher' && u.status === 'pending');

  const stats = [
    { name: "Total Teachers", value: teachers.length.toString(), icon: Users2, color: "indigo", delta: "+12%" },
    { name: "Total Students", value: students.length.toString(), icon: GraduationCap, color: "emerald", delta: "+8%" },
    { name: "Pending Approvals", value: pending.length.toString(), icon: Clock, color: "amber", delta: "Action Required" },
    { name: "Active Sessions", value: "48", icon: Activity, color: "rose", delta: "-3%" },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="bg-zinc-950/80 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
              Matoverse <span className="text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-2xl text-xs font-black uppercase tracking-widest border border-cyan-500/20">Portal v1.0</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 p-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 bg-zinc-800 border border-zinc-700" />
                ))}
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500 text-black flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
                U
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] p-12 text-white border border-cyan-500/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full -mr-48 -mt-48 blur-3xl transition-all duration-700 group-hover:scale-125" />
            <div className="relative z-10 flex-1">
              <h2 className="text-4xl font-black tracking-tighter mb-4 leading-tight">Welcome back, Admin! 👋</h2>
              <p className="text-zinc-400 text-xl font-medium max-w-lg mb-8 leading-relaxed">Everything looks great today. <span className="text-cyan-500">5 teachers</span> are waiting for your approval to start teaching on Matoverse.</p>
              <div className="flex gap-4">
                <button className="bg-cyan-500 text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-cyan-500/20 transition-all hover:-translate-y-1 active:scale-95">
                  Review Pending Approvals
                </button>
                <button className="bg-zinc-800 border border-zinc-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">
                  Send Global Announcement
                </button>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center relative w-1/3">
              <div className="w-56 h-56 bg-cyan-500/10 backdrop-blur-2xl rounded-[3rem] rotate-12 flex items-center justify-center shadow-xl border border-cyan-500/20">
                <Zap className="w-24 h-24 text-cyan-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-zinc-900 rounded-[2.5rem] p-8 border border-white/5 shadow-sm hover:border-cyan-500/30 hover:-translate-y-2 transition-all duration-500 group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-zinc-800 text-cyan-500 border border-white/5 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${stat.delta.startsWith('+') ? 'bg-cyan-500/10 text-cyan-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {stat.delta}
                  </span>
                </div>
                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2 font-mono">{stat.name}</h3>
                <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Bottom Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            <div className="lg:col-span-2 bg-zinc-900 rounded-[3rem] p-10 border border-white/5 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white tracking-tighter">Registration Activity</h3>
                <div className="flex gap-2">
                  <button className="px-5 py-2 bg-cyan-500 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all">Weekly</button>
                  <button className="px-5 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Monthly</button>
                </div>
              </div>
              <div className="h-64 bg-zinc-950 rounded-[2rem] border border-zinc-800 flex items-center justify-center">
                <div className="flex flex-col items-center text-zinc-600">
                  <TrendingUp className="w-12 h-12 mb-4 animate-pulse text-cyan-500/50" />
                  <p className="font-bold text-sm text-zinc-400">Growth Chart Visualization</p>
                  <p className="text-xs uppercase tracking-widest font-black opacity-50 mt-1">Real-time data enabled</p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-500 rounded-[3rem] p-10 text-black shadow-2xl relative overflow-hidden">
              <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-black/10 blur-xl" />
              <h3 className="text-2xl font-black mb-8 relative z-10 tracking-tighter uppercase">Recent Approvals</h3>
              <div className="space-y-4 relative z-10">
                {teachers.filter(t => t.status === 'approved' || t.status === 'active').slice(0, 3).map((app, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-black/5 p-3 rounded-2xl transition-all border border-transparent hover:border-black/10">
                    <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center font-black text-black border border-black/5 transition-all">
                      {app.fullName ? app.fullName.charAt(0) : "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase tracking-tight">{app.fullName}</p>
                      <p className="text-[10px] text-black/60 uppercase tracking-widest font-bold font-mono">{app.expertise || "Expert"}</p>
                    </div>
                    <span className="text-[10px] text-black/40 font-black italic">Recent</span>
                  </div>
                ))}
                {teachers.filter(t => t.status === 'approved' || t.status === 'active').length === 0 && (
                  <p className="text-sm font-bold opacity-60 italic">No approved teachers yet.</p>
                )}
              </div>
              <button className="w-full mt-10 p-5 rounded-2xl bg-black text-cyan-500 font-black text-sm uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95">
                View History
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
