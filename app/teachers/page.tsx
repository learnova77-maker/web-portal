"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SupportChatModal from "@/components/SupportChatModal";
import TeacherVerificationModal from "@/components/TeacherVerificationModal";
import {
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Download,
    UserPlus,
    Database,
    MessageSquare,
    Eye,
    Phone
} from "lucide-react";
import { seedSampleData } from "@/lib/seedData";
import { useFirebaseCollection, updateStatus } from "@/hooks/useFirebaseCollection";

export default function TeachersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [showRescheduledOnly, setShowRescheduledOnly] = useState(false);
    const { data: teachers, loading, error } = useFirebaseCollection("teacher");

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

    // Verification Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    const handleApprove = async (id: string) => {
        try {
            await updateStatus(id, "active");
        } catch (err) {
            console.error("Error approving teacher:", err);
        }
    };

    const openChat = (id: string, name: string) => {
        setSelectedUser({ id, name });
        setIsChatOpen(true);
    };

    const inspectTeacher = (teacher: any) => {
        setSelectedTeacher(teacher);
        setIsVerificationModalOpen(true);
    };

    const handleSeed = async () => {
        if (confirm("Do you want to seed sample teachers and students data?")) {
            try {
                await seedSampleData();
                alert("Data seeded successfully! It might take a moment to appear.");
            } catch (err: any) {
                alert("Seeding failed: " + err.message);
            }
        }
    };

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Teachers Registry</h1>
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">Manage and monitor all verified and active educators on Matloverse.</p>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by name, CNIC number, email, or subject..."
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent outline-none transition-all text-white placeholder-zinc-600 text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowRescheduledOnly(!showRescheduledOnly)}
                                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${showRescheduledOnly ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/10 hover:text-white'}`}
                            >
                                <Filter className="w-4 h-4" />
                                {showRescheduledOnly ? "Rescheduled Teachers" : "All Teachers"}
                            </button>
                        </div>
                    </div>

                    {/* Table Container with Overflow X Auto */}
                    <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-x-auto shadow-2xl min-w-full">
                        <table className="w-full text-left whitespace-nowrap min-w-[950px]">
                            <thead className="bg-zinc-950 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Teacher Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">WhatsApp Contact</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">CNIC / ID Number</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subject / Expertise</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-zinc-500 font-bold italic">
                                            Fetching Teachers...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <XCircle className="w-12 h-12 text-red-500" />
                                                <p className="text-xl font-black text-white uppercase italic">Connection Error</p>
                                                <p className="text-zinc-500 font-medium italic">{error.message}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : teachers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-zinc-800 rounded-full mb-2">
                                                    <Search className="w-8 h-8 text-zinc-600" />
                                                </div>
                                                <p className="text-zinc-500 font-bold italic">No teachers found in database.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    teachers.filter(t => {
                                        if (showRescheduledOnly && !t.hasRescheduledLives) return false;
                                        
                                        return t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.whatsappNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.cnicNumber?.toLowerCase().includes(searchTerm.toLowerCase());
                                    }).map((teacher) => {
                                        const docType = (teacher.idType || 'cnic').toUpperCase();
                                        const docNum = teacher.idNumber || teacher.cnicNumber || teacher.passportNumber || 'N/A';
                                        const whatsappNo = teacher.whatsapp || teacher.whatsappNumber || '';

                                        return (
                                            <tr key={teacher.id} className="hover:bg-cyan-500/[0.02] transition-colors group cursor-pointer" onClick={() => inspectTeacher(teacher)}>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        {teacher.photoUrl ? (
                                                            <img src={teacher.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover border border-white/5 group-hover:border-cyan-500/30 transition-all flex-shrink-0" />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-cyan-400 font-black border border-white/5 group-hover:border-cyan-500/30 transition-all flex-shrink-0">
                                                                {teacher.fullName?.charAt(0) || "?"}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-black text-white uppercase tracking-tight">{teacher.fullName}</p>
                                                            <p className="text-xs text-zinc-500 font-mono tracking-tighter">{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                                    {whatsappNo ? (
                                                        <a
                                                            href={`https://wa.me/${whatsappNo.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(teacher.fullName || 'Teacher')},%20regarding%20your%20Matloverse%20account.`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all shadow-sm"
                                                        >
                                                            <Phone size={13} /> {whatsappNo}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-zinc-600 font-mono">Not Provided</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mr-2">
                                                        {docType}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-zinc-300">{docNum}</span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-cyan-400 uppercase italic">{teacher.expertise || "N/A"}</span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${(teacher.status === 'approved' || teacher.status === 'active')
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                                            }`}>
                                                            {(teacher.status === 'approved' || teacher.status === 'active') ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3" />}
                                                            {teacher.status}
                                                        </span>
                                                        {teacher.hasRescheduledLives && (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                                Rescheduled ({teacher.rescheduleCount || 1}x)
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2 pr-2">
                                                        <button
                                                            onClick={() => inspectTeacher(teacher)}
                                                            className="px-3.5 py-2 bg-zinc-800 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded-xl transition-all border border-white/5 font-black text-xs uppercase flex items-center gap-1.5 shadow-sm flex-shrink-0"
                                                            title="Inspect Credentials, Documents & Activity Log"
                                                        >
                                                            <Eye size={15} /> Inspect & Activities
                                                        </button>
                                                        <button
                                                            onClick={() => openChat(teacher.id, teacher.fullName || "Teacher")}
                                                            className="p-2 text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all border border-white/5 flex-shrink-0"
                                                            title="Live Support Chat"
                                                        >
                                                            <MessageSquare className="w-5 h-5 text-cyan-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Inspection Modal */}
            {selectedTeacher && (
                <TeacherVerificationModal
                    isOpen={isVerificationModalOpen}
                    onClose={() => setIsVerificationModalOpen(false)}
                    teacher={selectedTeacher}
                    onOpenChat={openChat}
                />
            )}

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
