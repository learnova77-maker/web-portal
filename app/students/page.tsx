"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SupportChatModal from "@/components/SupportChatModal";
import {
    Search,
    MoreVertical,
    GraduationCap,
    Download,
    Filter,
    BookOpen,
    Clock,
    XCircle,
    MessageSquare
} from "lucide-react";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";

export default function StudentsPage() {
    const { data: students, loading, error } = useFirebaseCollection("student");
    const [searchTerm, setSearchTerm] = useState("");

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

    const openChat = (id: string, name: string) => {
        setSelectedUser({ id, name });
        setIsChatOpen(true);
    };

    return (
        <div className="flex h-screen bg-zinc-950 text-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Student Community</h1>
                            <p className="text-zinc-500 mt-1 font-medium italic">Monitor and support user growth across Matoverse.</p>
                        </div>
                        <button className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl font-black uppercase text-sm tracking-widest flex items-center hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                            <Download className="w-5 h-5 mr-2" />
                            Export Records
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent outline-none transition-all text-white placeholder-zinc-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 text-zinc-400 transition-all font-bold text-sm uppercase tracking-widest">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-zinc-950 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Student Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Grade</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-600 uppercase tracking-widest pr-8">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-zinc-500 font-bold italic">
                                            Fetching Students from Database...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <XCircle className="w-12 h-12 text-red-500" />
                                                <p className="text-xl font-black text-white uppercase italic">Connection Error</p>
                                                <p className="text-zinc-500 font-medium italic">{error.message}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Search className="w-8 h-8 text-zinc-600" />
                                                <p className="text-zinc-500 font-bold italic">No students found in database.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.filter(s =>
                                        s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((student) => (
                                        <tr key={student.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    {student.photoUrl ? (
                                                        <img src={student.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover border border-white/5 group-hover:border-cyan-500/30 transition-all" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-cyan-500 font-black border border-white/5 group-hover:border-cyan-500/30 transition-all">
                                                            {student.fullName?.charAt(0) || "S"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-white uppercase tracking-tight">{student.fullName}</p>
                                                        <p className="text-xs text-zinc-500 font-mono tracking-tighter">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-zinc-300 uppercase italic bg-zinc-950 px-3 py-1 rounded-lg border border-white/5">{student.grade || "N/A"}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-zinc-500 font-mono">
                                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openChat(student.id, student.fullName || "Student")}
                                                        className="p-2.5 bg-zinc-800 text-cyan-500 rounded-xl hover:bg-cyan-500 hover:text-black transition-all border border-white/5 hover:border-cyan-500/20 group/chat"
                                                        title="Live Support Chat"
                                                    >
                                                        <MessageSquare className="w-4 h-4 transition-transform group-hover/chat:scale-110" />
                                                    </button>
                                                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-cyan-500 hover:text-black transition-all font-black uppercase text-[10px] tracking-widest border border-white/5">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        Track
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Support Chat Modal */}
            {selectedUser && (
                <SupportChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    chatType="support_chats"
                />
            )}
        </div>

    );
}
