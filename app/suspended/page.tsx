"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
    Search,
    ShieldOff,
    ShieldCheck,
    AlertTriangle,
    Calendar,
    RefreshCcw,
    User,
    Mail
} from "lucide-react";
import { useFirebaseCollection, updateStatus } from "@/hooks/useFirebaseCollection";
import { ref, update, get, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export default function SuspendedPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { data: suspendedUsers, loading } = useFirebaseCollection("suspended");
    const [unsuspending, setUnsuspending] = useState<string | null>(null);

    const handleUnsuspend = async (userId: string) => {
        if (!confirm("Are you sure you want to unsuspend this user? Their reschedule count will be reset to 0.")) return;
        
        setUnsuspending(userId);
        try {
            // 1. Update user status
            const userRef = ref(rtdb, `users/${userId}`);
            await update(userRef, {
                status: 'active',
                suspendedAt: null,
                suspensionReason: null,
                rescheduleCount: 0
            });

            // 2. Remove any active/paused live sessions for this teacher
            const sessionsRef = ref(rtdb, 'live_sessions');
            const snapshot = await get(sessionsRef);
            if (snapshot.exists()) {
                const promises = [];
                snapshot.forEach((childSnap) => {
                    const session = childSnap.val();
                    if (session.teacherId === userId && (session.status === 'live' || session.status === 'paused')) {
                        promises.push(remove(ref(rtdb, `live_sessions/${childSnap.key}`)));
                    }
                });
                await Promise.all(promises);
            }
        } catch (err) {
            console.error("Failed to unsuspend user:", err);
            alert("Failed to unsuspend user.");
        } finally {
            setUnsuspending(null);
        }
    };

    const filtered = suspendedUsers.filter(u =>
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-orange-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                Suspended Profiles
                            </h1>
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">
                                View and manage all suspended accounts on the platform.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Search */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search suspended users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-xl border border-white/5 bg-zinc-900 py-3 pl-12 pr-4 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-orange-500/10">
                                    <ShieldOff className="h-5 w-5 text-orange-500" />
                                </div>
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Total Suspended</span>
                            </div>
                            <p className="text-3xl font-black text-white">{suspendedUsers.length}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-red-500/10">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Auto-Suspended</span>
                            </div>
                            <p className="text-3xl font-black text-white">
                                {suspendedUsers.filter(u => u.suspensionReason?.includes('Auto')).length}
                            </p>
                        </div>
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <RefreshCcw className="h-5 w-5 text-purple-500" />
                                </div>
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Avg Reschedules</span>
                            </div>
                            <p className="text-3xl font-black text-white">
                                {suspendedUsers.length > 0
                                    ? Math.round(suspendedUsers.reduce((sum, u) => sum + (u.rescheduleCount || 0), 0) / suspendedUsers.length)
                                    : 0
                                }
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <ShieldCheck className="mx-auto h-16 w-16 text-zinc-700 mb-4" />
                            <h2 className="text-xl font-black text-white mb-2">No Suspended Profiles</h2>
                            <p className="text-zinc-500 text-sm font-medium">
                                {searchTerm ? "No results match your search." : "All users are in good standing."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-zinc-900 rounded-2xl p-6 border border-white/5 hover:border-orange-500/20 transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                {user.avatar || user.profileImage ? (
                                                    <img
                                                        src={user.avatar || user.profileImage}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-6 w-6 text-zinc-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white text-lg tracking-tight">{user.name || "Unknown"}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="h-3 w-3 text-zinc-500" />
                                                    <span className="text-zinc-400 text-xs font-medium">{user.email || "No email"}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                                        {user.role || "teacher"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex flex-col sm:items-end gap-2 text-xs">
                                            {user.suspendedAt && (
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <Calendar className="h-3 w-3" />
                                                    <span className="font-semibold">
                                                        Suspended: {new Date(user.suspendedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <RefreshCcw className="h-3 w-3" />
                                                <span className="font-semibold">
                                                    Reschedules: {user.rescheduleCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {user.suspensionReason && (
                                        <div className="mt-4 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-semibold text-red-400">{user.suspensionReason}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Unsuspend Button */}
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => handleUnsuspend(user.id)}
                                            disabled={unsuspending === user.id}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs rounded-xl border border-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            <ShieldCheck className="h-4 w-4" />
                                            {unsuspending === user.id ? "Unsuspending..." : "Unsuspend Account"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
