"use client";

import { useState } from "react";
import {
    X,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    Eye,
    Briefcase,
    GraduationCap,
    FileText,
    MessageSquare,
    ExternalLink,
    Clock,
    UserCircle,
    Sparkles,
    Image as ImageIcon
} from "lucide-react";
import { updateStatus } from "@/hooks/useFirebaseCollection";

import DeclineReasonModal from "@/components/DeclineReasonModal";

interface TeacherVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: any;
    onOpenChat?: (id: string, name: string) => void;
}

// Helper to safely extract string URL from strings, objects, or nested URIs
function resolveImageUrl(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string' && val.trim().length > 5) return val.trim();
    if (typeof val === 'object') {
        const url = val.uri || val.url || val.downloadURL || val.path || null;
        if (typeof url === 'string' && url.trim().length > 5) return url.trim();
    }
    return null;
}

export default function TeacherVerificationModal({
    isOpen,
    onClose,
    teacher,
    onOpenChat
}: TeacherVerificationModalProps) {
    const [copied, setCopied] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [imgErrors, setImgErrors] = useState<{ [key: string]: boolean }>({});
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

    if (!isOpen || !teacher) return null;

    const docType = (teacher.idType || "cnic").toUpperCase();
    const docNumber = teacher.idNumber || teacher.cnicNumber || teacher.passportNumber || "Not Provided";

    // Resolve URLs exhaustively
    const avatar = resolveImageUrl(
        teacher.photoUrl || teacher.photoURL || teacher.profileImage || teacher.picture || teacher.avatar || teacher.userImage || teacher.photo
    );

    const cnicFront = resolveImageUrl(
        teacher.cnicFrontUrl || teacher.cnicFront || teacher.idCardUrl || teacher.idDocumentUrl || teacher.idCard || teacher.idFrontUrl || teacher.cnic_front || teacher.cnicFrontImage
    );

    const cnicBack = resolveImageUrl(
        teacher.cnicBackUrl || teacher.cnicBack || teacher.cnic_back || teacher.idBackUrl || teacher.cnicBackImage
    );

    const degreeDoc = resolveImageUrl(
        teacher.degreeUrl || teacher.degree || teacher.qualificationDocUrl || teacher.qualificationDoc || teacher.qualification_doc || teacher.degree_url || teacher.qualificationDocImage
    );

    const handleCopyNumber = () => {
        if (docNumber && docNumber !== "Not Provided") {
            navigator.clipboard.writeText(docNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApprove = async () => {
        setIsUpdating(true);
        try {
            await updateStatus(teacher.id, "active");
            onClose();
        } catch (err) {
            console.error("Failed to approve teacher:", err);
            alert("Error approving teacher.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleReject = () => {
        setIsDeclineModalOpen(true);
    };

    const markImgError = (key: string) => {
        setImgErrors(prev => ({ ...prev, [key]: true }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-cyan-500/20 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden relative font-sans">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-zinc-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {avatar && !imgErrors['avatar'] ? (
                            <img 
                                src={avatar} 
                                alt={teacher.fullName || "Teacher Profile"} 
                                onError={() => markImgError('avatar')}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/40 shadow-md" 
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-zinc-800 text-cyan-400 font-black text-xl flex items-center justify-center border border-white/10 shadow-md">
                                {teacher.fullName?.charAt(0) || "T"}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{teacher.fullName}</h2>
                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                    teacher.status === 'active' || teacher.status === 'approved'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                    {teacher.status || 'Pending'}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">@{teacher.username || teacher.email?.split('@')[0]} • {teacher.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-white/5 hover:bg-zinc-800 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Identity Verification Section */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                                <h3 className="font-black text-sm text-white uppercase tracking-wider">Identity Verification ({docType})</h3>
                            </div>

                            {/* Copy Doc Number */}
                            <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/5">
                                <span className="text-[11px] text-zinc-500 font-bold uppercase">{docType} NO:</span>
                                <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">{docNumber}</span>
                                {docNumber !== "Not Provided" && (
                                    <button
                                        onClick={handleCopyNumber}
                                        className="text-zinc-400 hover:text-white p-1 transition-colors"
                                        title="Copy Document Number"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Images Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {/* Front Image */}
                            <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                    <span>{docType === 'PASSPORT' ? 'PASSPORT DOCUMENT' : 'CNIC FRONT SIDE'}</span>
                                    {cnicFront && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setLightboxImage(cnicFront)}
                                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold"
                                            >
                                                <Eye size={12} /> Inspect
                                            </button>
                                            <a
                                                href={cnicFront}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {cnicFront && !imgErrors['front'] ? (
                                    <div
                                        onClick={() => setLightboxImage(cnicFront)}
                                        className="relative aspect-video rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-zinc-900"
                                    >
                                        <img 
                                            src={cnicFront} 
                                            alt="Document Front" 
                                            onError={() => markImgError('front')}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                                            <Eye size={16} /> Click to View Full Resolution
                                        </div>
                                    </div>
                                ) : cnicFront && imgErrors['front'] ? (
                                    <div className="aspect-video rounded-lg bg-zinc-900/80 flex flex-col items-center justify-center p-4 text-center border border-amber-500/20 text-xs gap-2">
                                        <p className="text-amber-400 font-bold">Image load restricted by browser</p>
                                        <a 
                                            href={cnicFront} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-cyan-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-cyan-400"
                                        >
                                            <ExternalLink size={13} /> Open Image Direct Link
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-lg bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/10 text-xs">
                                        <FileText size={24} className="opacity-40 mb-1" />
                                        No Front Image Uploaded
                                    </div>
                                )}
                            </div>

                            {/* Back Image (If CNIC) */}
                            {docType === 'CNIC' && (
                                <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                        <span>CNIC BACK SIDE</span>
                                        {cnicBack && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setLightboxImage(cnicBack)}
                                                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold"
                                                >
                                                    <Eye size={12} /> Inspect
                                                </button>
                                                <a
                                                    href={cnicBack}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                                                    title="Open in new tab"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {cnicBack && !imgErrors['back'] ? (
                                        <div
                                            onClick={() => setLightboxImage(cnicBack)}
                                            className="relative aspect-video rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-zinc-900"
                                        >
                                            <img 
                                                src={cnicBack} 
                                                alt="CNIC Back" 
                                                onError={() => markImgError('back')}
                                                referrerPolicy="no-referrer"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                                                <Eye size={16} /> Click to View Full Resolution
                                            </div>
                                        </div>
                                    ) : cnicBack && imgErrors['back'] ? (
                                        <div className="aspect-video rounded-lg bg-zinc-900/80 flex flex-col items-center justify-center p-4 text-center border border-amber-500/20 text-xs gap-2">
                                            <p className="text-amber-400 font-bold">Image load restricted by browser</p>
                                            <a 
                                                href={cnicBack} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-3 py-1.5 bg-cyan-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-cyan-400"
                                            >
                                                <ExternalLink size={13} /> Open Image Direct Link
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="aspect-video rounded-lg bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/10 text-xs">
                                            <FileText size={24} className="opacity-40 mb-1" />
                                            No Back Image Uploaded
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Academic Qualification & Degree Document */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-amber-400" />
                            <h3 className="font-black text-sm text-white uppercase tracking-wider">Qualification & Degree Document</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-500 font-bold uppercase">Degree / Qualification Title</p>
                                <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-sm font-bold text-white">
                                    {teacher.qualification || "Not Specified"}
                                </div>

                                <p className="text-xs text-zinc-500 font-bold uppercase pt-2">Expertise / Profession</p>
                                <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-sm font-black text-cyan-400">
                                    {teacher.expertise || "Not Specified"}
                                </div>
                            </div>

                            {/* Degree Document Image */}
                            <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                    <span>ATTACHED DEGREE DOCUMENT</span>
                                    {degreeDoc && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setLightboxImage(degreeDoc)}
                                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-bold"
                                            >
                                                <Eye size={12} /> Inspect
                                            </button>
                                            <a
                                                href={degreeDoc}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {degreeDoc && !imgErrors['degree'] ? (
                                    <div
                                        onClick={() => setLightboxImage(degreeDoc)}
                                        className="relative aspect-video rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-zinc-900"
                                    >
                                        <img 
                                            src={degreeDoc} 
                                            alt="Degree Document" 
                                            onError={() => markImgError('degree')}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                                            <Eye size={16} /> Click to Inspect Degree
                                        </div>
                                    </div>
                                ) : degreeDoc && imgErrors['degree'] ? (
                                    <div className="aspect-video rounded-lg bg-zinc-900/80 flex flex-col items-center justify-center p-4 text-center border border-amber-500/20 text-xs gap-2">
                                        <p className="text-amber-400 font-bold">Image load restricted by browser</p>
                                        <a 
                                            href={degreeDoc} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-cyan-500 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 hover:bg-cyan-400"
                                        >
                                            <ExternalLink size={13} /> Open Degree Direct Link
                                        </a>
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-lg bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/10 text-xs">
                                        <GraduationCap size={24} className="opacity-40 mb-1" />
                                        No Degree Document Uploaded
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Experience & Bio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Years Experience</p>
                            <div className="flex items-center gap-2 text-lg font-black text-white">
                                <Briefcase className="w-4 h-4 text-cyan-400" />
                                <span>{teacher.experience || "0"} Years</span>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Biography / About</p>
                            <p className="text-xs text-zinc-300 leading-relaxed italic">
                                {teacher.bio || "No biography provided."}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-white/5 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {onOpenChat ? (
                        <button
                            onClick={() => {
                                onOpenChat(teacher.id, teacher.fullName || "Teacher");
                                onClose();
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-all"
                        >
                            <MessageSquare size={16} /> Live Chat Support
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleReject}
                            disabled={isUpdating}
                            className="flex-1 sm:flex-initial px-5 py-2.5 bg-zinc-950 text-red-400 border border-red-500/20 hover:bg-red-950/40 rounded-xl font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50"
                        >
                            Decline
                        </button>

                        <button
                            onClick={handleApprove}
                            disabled={isUpdating}
                            className="flex-1 sm:flex-initial px-6 py-2.5 bg-cyan-500 text-black hover:bg-cyan-400 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 size={16} /> Approve & Verify
                        </button>
                    </div>
                </div>

            </div>

            {/* High-Res Lightbox Modal */}
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
                        <p className="text-xs text-zinc-400 font-mono">Click anywhere to close full resolution inspect view</p>
                    </div>
                </div>
            )}

            {/* Decline Reason Modal */}
            <DeclineReasonModal
                isOpen={isDeclineModalOpen}
                onClose={() => setIsDeclineModalOpen(false)}
                teacher={teacher}
                onSuccess={onClose}
            />
        </div>
    );
}
