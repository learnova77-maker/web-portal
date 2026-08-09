"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SupportChatModal from "@/components/SupportChatModal";
import TeacherVerificationModal from "@/components/TeacherVerificationModal";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    ShieldCheck,
    Briefcase,
    MessageSquare,
    Eye,
    FileText,
    GraduationCap,
    BadgeCheck,
    ChevronRight
} from "lucide-react";
import { useFirebaseCollection, updateStatus } from "@/hooks/useFirebaseCollection";

export default function PendingApprovalsPage() {
    const { data: pending, loading, error } = useFirebaseCollection("pending");
    const [searchTerm, setSearchTerm] = useState("");

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

    // Verification Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    const handleAction = async (id: string, status: string) => {
        try {
            await updateStatus(id, status);
        } catch (err) {
            console.error(`Error updating teacher ${id}:`, err);
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

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                                Pending Verifications <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 not-italic font-mono">Teacher Approval</span>
                            </h1>
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">Review submitted CNIC / Passport credentials, degree documents, and manage approval status.</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                            <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
                            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{pending.length} Applications Pending</span>
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
                                placeholder="Search by name, CNIC number, email, or expertise..."
                                className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent outline-none transition-all text-white placeholder-zinc-600 text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-zinc-950 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Applicant Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification Doc & Number</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Field / Degree Title</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Uploaded Files</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-zinc-500 font-bold italic">
                                            Scanning database for pending applications...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <XCircle className="w-12 h-12 text-red-500" />
                                                <p className="text-xl font-black text-white uppercase italic">Connection Error</p>
                                                <p className="text-zinc-500 font-medium italic">{error.message}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : pending.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-emerald-500/10 rounded-full">
                                                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                                </div>
                                                <p className="text-zinc-400 font-bold italic text-sm">All pending teacher applications have been reviewed!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pending.filter(p =>
                                        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.cnicNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((teacher) => {
                                        const docType = (teacher.idType || 'cnic').toUpperCase();
                                        const docNum = teacher.idNumber || teacher.cnicNumber || teacher.passportNumber || 'Not Provided';
                                        const hasFront = !!(teacher.cnicFrontUrl || teacher.idCardUrl || teacher.idDocumentUrl);
                                        const hasBack = !!teacher.cnicBackUrl;
                                        const hasDegree = !!(teacher.degreeUrl || teacher.qualificationDocUrl);

                                        return (
                                            <tr key={teacher.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                                {/* Applicant Info */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        {teacher.photoUrl ? (
                                                            <img src={teacher.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover border border-white/5 group-hover:border-cyan-500/30 transition-all" />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-cyan-400 font-black border border-white/5 group-hover:border-cyan-500/30 transition-all">
                                                                {teacher.fullName?.charAt(0) || "T"}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-black text-white uppercase tracking-tight">{teacher.fullName}</p>
                                                            <p className="text-xs text-zinc-500 font-mono">{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Verification Doc & Number */}
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                            {docType}
                                                        </span>
                                                        <p className="text-xs font-mono font-bold text-white tracking-wider pt-0.5">
                                                            {docNum}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Field / Degree Title */}
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-cyan-400 uppercase tracking-tight">{teacher.expertise || "N/A"}</p>
                                                        <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[180px]">{teacher.qualification || "No Qualification Specified"}</p>
                                                    </div>
                                                </td>

                                                {/* Uploaded Files Status */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${hasFront ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                            {docType === 'PASSPORT' ? 'PASSPORT' : 'FRONT'} {hasFront ? '✓' : '✗'}
                                                        </span>
                                                        {docType === 'CNIC' && (
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${hasBack ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                                BACK {hasBack ? '✓' : '✗'}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${hasDegree ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                            DEGREE {hasDegree ? '✓' : '✗'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => inspectTeacher(teacher)}
                                                            className="px-3.5 py-2 bg-zinc-800 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded-xl transition-all border border-white/5 font-black text-xs uppercase flex items-center gap-1.5 shadow-sm"
                                                            title="Inspect CNIC, Passport & Degree"
                                                        >
                                                            <Eye size={15} /> Review
                                                        </button>
                                                        <button
                                                            onClick={() => openChat(teacher.id, teacher.fullName || "Teacher")}
                                                            className="p-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all border border-white/5"
                                                            title="Live Chat Support"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(teacher.id, 'rejected')}
                                                            className="px-3.5 py-2 bg-zinc-950 text-zinc-400 border border-white/5 rounded-xl hover:bg-red-950 hover:text-red-400 hover:border-red-500/30 transition-all font-black uppercase text-[10px] tracking-widest"
                                                        >
                                                            Decline
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(teacher.id, 'active')}
                                                            className="px-4 py-2 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-cyan-500/10 flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 size={14} /> Verify
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
