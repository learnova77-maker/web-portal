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
    ShieldCheck,
    Briefcase,
    MessageSquare,
    Eye,
    FileText,
    GraduationCap,
    BadgeCheck,
    X,
    ExternalLink,
    LayoutGrid,
    List,
    Phone
} from "lucide-react";
import { useFirebaseCollection, updateStatus } from "@/hooks/useFirebaseCollection";
import DeclineReasonModal from "@/components/DeclineReasonModal";

// Helper to safely extract string URL from strings or objects
function resolveImageUrl(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string' && val.trim().length > 5) return val.trim();
    if (typeof val === 'object') {
        const url = val.uri || val.url || val.downloadURL || val.path || null;
        if (typeof url === 'string' && url.trim().length > 5) return url.trim();
    }
    return null;
}

export default function PendingApprovalsPage() {
    const { data: pending, loading, error } = useFirebaseCollection("pending");
    const [searchTerm, setSearchTerm] = useState("");

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

    // Verification Inspection Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    // Decline Reason Modal State
    const [declineTeacher, setDeclineTeacher] = useState<any | null>(null);
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

    // Direct Image Lightbox State
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});

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

    const markImgError = (key: string) => {
        setImgErrors(prev => ({ ...prev, [key]: true }));
    };

    const filteredPending = pending.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.whatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.whatsappNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cnicNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">Review submitted CNIC / Passport credentials, degree documents, and approve or decline applications.</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl shadow-[0_0_15px_rgba(34,211,238,0.15)] flex-shrink-0">
                            <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
                            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{pending.length} Waiting</span>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Controls & View Switcher */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="relative w-full max-w-2xl">
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

                    {/* Main Content Area */}
                    {loading ? (
                        <div className="py-24 text-center text-zinc-500 font-bold italic animate-pulse">
                            Scanning database for pending applications...
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center bg-zinc-900 border border-red-500/20 rounded-3xl p-8">
                            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-xl font-black text-white uppercase italic">Connection Error</p>
                            <p className="text-zinc-500 font-medium italic mt-1">{error.message}</p>
                        </div>
                    ) : filteredPending.length === 0 ? (
                        <div className="py-24 text-center bg-zinc-900 rounded-3xl border border-white/5 p-8">
                            <div className="p-4 bg-emerald-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">No Pending Applications</h3>
                            <p className="text-zinc-500 font-medium italic text-xs mt-1">All teacher verification requests have been thoroughly reviewed!</p>
                        </div>
                    ) : (
                        /* Table View */
                        <div className="bg-zinc-900 rounded-3xl border border-white/5 shadow-2xl w-full overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap min-w-[950px]">
                                <thead className="bg-zinc-950 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Applicant Info</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">WhatsApp Contact</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification Doc</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Field / Degree Title</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Documents</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-zinc-500 uppercase tracking-widest pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredPending.map((teacher) => {
                                        const docType = (teacher.idType || 'cnic').toUpperCase();
                                        const docNum = teacher.idNumber || teacher.cnicNumber || teacher.passportNumber || 'Not Provided';
                                        const whatsappNo = teacher.whatsapp || teacher.whatsappNumber || '';

                                        const avatar = resolveImageUrl(
                                            teacher.photoUrl || teacher.photoURL || teacher.profileImage || teacher.picture || teacher.avatar || teacher.userImage || teacher.photo
                                        );

                                        const frontUrl = resolveImageUrl(
                                            teacher.cnicFrontUrl || teacher.cnicFront || teacher.idCardUrl || teacher.idDocumentUrl || teacher.idCard || teacher.idFrontUrl || teacher.cnic_front || teacher.cnicFrontImage
                                        );

                                        const backUrl = resolveImageUrl(
                                            teacher.cnicBackUrl || teacher.cnicBack || teacher.cnic_back || teacher.idBackUrl || teacher.cnicBackImage
                                        );

                                        const degreeUrl = resolveImageUrl(
                                            teacher.degreeUrl || teacher.degree || teacher.qualificationDocUrl || teacher.qualificationDoc || teacher.qualification_doc || teacher.degree_url || teacher.qualificationDocImage
                                        );

                                        return (
                                            <tr key={teacher.id} className="hover:bg-cyan-500/[0.02] transition-colors group cursor-pointer" onClick={() => inspectTeacher(teacher)}>
                                                {/* Applicant Info */}
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        {avatar && !imgErrors[teacher.id + '_avatar'] ? (
                                                            <img
                                                                src={avatar}
                                                                alt=""
                                                                onError={() => markImgError(teacher.id + '_avatar')}
                                                                referrerPolicy="no-referrer"
                                                                className="h-12 w-12 rounded-xl object-cover border border-white/5 group-hover:border-cyan-500/30 transition-all flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-cyan-400 font-black border border-white/5 group-hover:border-cyan-500/30 transition-all flex-shrink-0">
                                                                {teacher.fullName?.charAt(0) || "T"}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-black text-white uppercase tracking-tight break-words">{teacher.fullName}</p>
                                                            <p className="text-[11px] text-zinc-500 font-mono truncate" title={teacher.email}>{teacher.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* WhatsApp Contact */}
                                                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                                    {whatsappNo ? (
                                                        <a
                                                            href={`https://wa.me/${whatsappNo.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(teacher.fullName || 'Teacher')},%20regarding%20your%20Matloverse%20verification.`}
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

                                                {/* Verification Doc & Number */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">{docType}</span>
                                                        <span className="text-[11px] font-mono font-bold text-zinc-300 break-all">{docNum}</span>
                                                    </div>
                                                </td>

                                                {/* Field / Degree Title */}
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        <span className="text-[11px] font-bold text-white uppercase tracking-tight break-words">{teacher.expertise || "Instructor"}</span>
                                                        <span className="text-[10px] font-medium text-zinc-400 break-words">{teacher.qualificationTitle || "Pending Verification"}</span>
                                                    </div>
                                                </td>

                                                {/* Clickable Documents */}
                                                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        {frontUrl ? (
                                                            <button
                                                                onClick={() => setLightboxImage(frontUrl)}
                                                                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-cyan-500 hover:text-black font-bold text-xs transition-all border border-white/5"
                                                            >
                                                                Front ID
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-zinc-600 font-mono italic">No Front</span>
                                                        )}

                                                        {backUrl ? (
                                                            <button
                                                                onClick={() => setLightboxImage(backUrl)}
                                                                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-cyan-500 hover:text-black font-bold text-xs transition-all border border-white/5"
                                                            >
                                                                Back ID
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-zinc-600 font-mono italic">No Back</span>
                                                        )}

                                                        {degreeUrl ? (
                                                            <button
                                                                onClick={() => setLightboxImage(degreeUrl)}
                                                                className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500 hover:text-black font-bold text-xs transition-all border border-amber-500/20"
                                                            >
                                                                Degree
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-zinc-600 font-mono italic">No Degree</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5 text-right pr-8 align-middle" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => inspectTeacher(teacher)}
                                                            className="px-2.5 py-1.5 bg-zinc-800 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded-lg transition-all border border-white/5 font-black text-[10px] uppercase flex items-center gap-1 shadow-sm flex-shrink-0"
                                                            title="Inspect CNIC, Passport & Degree details"
                                                        >
                                                            <Eye size={12} /> Review
                                                        </button>

                                                        <button
                                                            onClick={() => openChat(teacher.id, teacher.fullName || "Teacher")}
                                                            className="p-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all border border-white/5 flex-shrink-0"
                                                            title="Live Chat Support"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setDeclineTeacher(teacher);
                                                                setIsDeclineModalOpen(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-zinc-950 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-950 hover:text-red-300 transition-all font-black uppercase text-[10px] tracking-widest flex-shrink-0"
                                                        >
                                                            Decline
                                                        </button>

                                                        <button
                                                            onClick={() => handleAction(teacher.id, 'active')}
                                                            className="px-3 py-1.5 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-cyan-500/10 flex items-center gap-1 flex-shrink-0"
                                                        >
                                                            <CheckCircle2 size={12} /> Approve
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Decline Reason Modal */}
            <DeclineReasonModal
                isOpen={isDeclineModalOpen}
                onClose={() => setIsDeclineModalOpen(false)}
                teacher={declineTeacher}
            />

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

            {/* Direct Image Lightbox Preview Modal */}
            {lightboxImage && (
                <div
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in zoom-in-95 duration-200"
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 p-3 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 border border-white/10"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={lightboxImage} 
                        alt="High Res Document" 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
                    />
                    <div className="flex items-center gap-4 mt-4">
                        <a
                            href={lightboxImage}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-cyan-400"
                        >
                            <ExternalLink size={14} /> Open Direct Link in New Tab
                        </a>
                        <p className="text-xs text-zinc-400 font-mono">Click anywhere to close full resolution document preview</p>
                    </div>
                </div>
            )}
        </div>
    );
}
