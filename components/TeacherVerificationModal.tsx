"use client";

import { useState, useEffect } from "react";
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
    Image as ImageIcon,
    Phone,
    Heart,
    Star,
    BookOpen,
    Video,
    Activity,
    ChevronDown,
    Loader2
} from "lucide-react";
import { updateStatus } from "@/hooks/useFirebaseCollection";
import { ref, get } from "firebase/database";
import { rtdb } from "@/lib/firebase";

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

    // Activity Log & Summary Metrics State (20-by-20 pagination)
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [activityFilter, setActivityFilter] = useState<'all' | 'like' | 'comment' | 'uploads'>('all');
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);
    const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(20);
    const [counts, setCounts] = useState({
        courses: 0,
        videos: 0,
        likes: 0,
        comments: 0,
        reviews: 0
    });

    useEffect(() => {
        if (isOpen && teacher) {
            fetchTeacherActivities();
        }
    }, [isOpen, teacher]);

    const fetchTeacherActivities = async () => {
        if (!teacher) return;
        setIsLoadingActivity(true);

        try {
            const activities: any[] = [];
            let likesCounter = 0;
            let commentsCounter = 0;
            let videoCounter = 0;
            let courseCounter = 0;
            let reviewCounter = 0;

            const idsToMatch = new Set<string>();
            if (teacher.id) idsToMatch.add(String(teacher.id));
            if (teacher.uid) idsToMatch.add(String(teacher.uid));
            if (teacher.email) idsToMatch.add(String(teacher.email).toLowerCase());
            if (teacher.username) idsToMatch.add(String(teacher.username).toLowerCase());

            // Try resolving UID from 'users' node if teacher only has a database key
            try {
                const usersSnap = await get(ref(rtdb, 'users'));
                if (usersSnap.exists()) {
                    const allUsers = usersSnap.val();
                    Object.keys(allUsers).forEach(uKey => {
                        const uVal = allUsers[uKey];
                        if (
                            uKey === teacher.id || 
                            uVal.uid === teacher.id || 
                            (uVal.email && teacher.email && uVal.email.toLowerCase() === teacher.email.toLowerCase())
                        ) {
                            if (uKey) idsToMatch.add(String(uKey));
                            if (uVal.uid) idsToMatch.add(String(uVal.uid));
                            if (uVal.email) idsToMatch.add(String(uVal.email).toLowerCase());
                        }
                    });
                }
            } catch (e) {}

            // 1. Fetch Likes & Comments from social_posts
            const postsSnap = await get(ref(rtdb, 'social_posts'));
            if (postsSnap.exists()) {
                const allPosts = postsSnap.val();
                Object.keys(allPosts).forEach((pId) => {
                    const post = allPosts[pId];
                    
                    // Check Likes
                    let isLiked = false;
                    if (post.likes) {
                        isLiked = Object.keys(post.likes).some(k => idsToMatch.has(String(k)) && post.likes[k]);
                    }
                    if (isLiked) {
                        likesCounter++;
                        activities.push({
                            id: `like_${pId}`,
                            type: 'like',
                            title: `Liked a post by ${post.userName || 'a community member'}`,
                            snippet: post.content ? (post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content) : 'Liked a post/media',
                            timestamp: post.createdAt || Date.now()
                        });
                    }

                    // Check Comments
                    if (post.comments) {
                        Object.keys(post.comments).forEach((cId) => {
                            const comment = post.comments[cId];
                            const cUid = comment.userId || comment.studentId || '';
                            const cEmail = (comment.userEmail || '').toLowerCase();
                            const cName = (comment.userName || '').toLowerCase();

                            if (
                                (cUid && idsToMatch.has(String(cUid))) ||
                                (cEmail && idsToMatch.has(cEmail)) ||
                                (teacher.fullName && cName && cName === teacher.fullName.toLowerCase())
                            ) {
                                commentsCounter++;
                                activities.push({
                                    id: `comment_${cId}`,
                                    type: 'comment',
                                    title: `Commented on ${post.userName || 'a post'}`,
                                    snippet: `"${comment.text || comment.content || ''}"`,
                                    timestamp: comment.createdAt || Date.now()
                                });
                            }
                        });
                    }
                });
            }

            // 2. Fetch Courses & Video Uploads
            const coursesSnap = await get(ref(rtdb, 'courses'));
            if (coursesSnap.exists()) {
                const allCourses = coursesSnap.val();
                Object.keys(allCourses).forEach((cId) => {
                    const course = allCourses[cId];
                    const instId = course.instructorId || course.userId || '';
                    const instEmail = (course.instructorEmail || '').toLowerCase();
                    const teacherName = (course.teacherName || '').toLowerCase();

                    const isMatch = (
                        (instId && idsToMatch.has(String(instId))) ||
                        (instEmail && idsToMatch.has(instEmail)) ||
                        (teacher.fullName && teacherName && teacherName === teacher.fullName.toLowerCase())
                    );

                    if (isMatch) {
                        courseCounter++;
                        if (course.reviews) {
                            reviewCounter += Object.keys(course.reviews).length;
                        }
                        activities.push({
                            id: `course_${cId}`,
                            type: 'course',
                            title: `Published Course: "${course.title}"`,
                            snippet: course.category ? `Category: ${course.category}` : 'Published Course',
                            timestamp: course.createdAt || Date.now()
                        });
                        if (course.modules) {
                            Object.values(course.modules).forEach((mod: any) => {
                                if (mod.lectures) {
                                    Object.values(mod.lectures).forEach((lec: any) => {
                                        if (lec.createdAt || lec.title) {
                                            videoCounter++;
                                            activities.push({
                                                id: `lec_${lec.id || Math.random()}`,
                                                type: 'video',
                                                title: `Uploaded video lecture: "${lec.title || 'Lecture Video'}"`,
                                                snippet: `Course: ${course.title}`,
                                                timestamp: lec.createdAt || Date.now()
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }

            activities.sort((a, b) => b.timestamp - a.timestamp);
            setActivityLog(activities);
            setCounts({
                courses: courseCounter,
                videos: videoCounter,
                likes: likesCounter,
                comments: commentsCounter,
                reviews: reviewCounter
            });
        } catch (err) {
            console.error("Error fetching teacher activities in admin portal:", err);
        } finally {
            setIsLoadingActivity(false);
        }
    };

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

    const filteredActivities = activityLog.filter(act => {
        if (activityFilter === 'like') return act.type === 'like';
        if (activityFilter === 'comment') return act.type === 'comment';
        if (activityFilter === 'uploads') return act.type === 'course' || act.type === 'video';
        return true;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-cyan-500/20 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden relative font-sans">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-zinc-900/80 flex items-center justify-between flex-wrap gap-4">
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

                    <div className="flex items-center gap-3">
                        {(teacher.whatsapp || teacher.whatsappNumber) && (
                            <a
                                href={`https://wa.me/${(teacher.whatsapp || teacher.whatsappNumber).replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(teacher.fullName || 'Teacher')},%20regarding%20your%20Matloverse%20account.`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Phone size={15} /> WhatsApp (+{(teacher.whatsapp || teacher.whatsappNumber).replace(/[^0-9]/g, '')})
                            </a>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl border border-white/5 hover:bg-zinc-800 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
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

                    {/* COMPREHENSIVE SUMMARY METRICS GRID */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Teacher Activity Overview & Stats
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                                <span className="font-black text-cyan-400 text-lg flex items-center justify-center gap-1">
                                    <BookOpen size={16} /> {counts.courses}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Courses</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                                <span className="font-black text-purple-400 text-lg flex items-center justify-center gap-1">
                                    <Video size={16} /> {counts.videos}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Videos</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                                <span className="font-black text-red-400 text-lg flex items-center justify-center gap-1">
                                    <Heart size={16} className="fill-current" /> {counts.likes}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Likes</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                                <span className="font-black text-blue-400 text-lg flex items-center justify-center gap-1">
                                    <MessageSquare size={16} /> {counts.comments}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Comments</span>
                            </div>
                            <div className="bg-zinc-950 p-3 rounded-xl border border-white/5">
                                <span className="font-black text-amber-400 text-lg flex items-center justify-center gap-1">
                                    <Star size={16} className="fill-current" /> {counts.reviews}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reviews</span>
                            </div>
                        </div>
                    </div>

                    {/* BATCHED 20-BY-20 ACTIVITY LOG & TIMELINE */}
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="text-cyan-400" size={18} /> Teacher Interaction Timeline
                                </h3>
                                <p className="text-[11px] text-zinc-500 font-medium">Paginated in batches of 20 items</p>
                            </div>

                            {/* Sub-Filters */}
                            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl text-xs font-bold shrink-0 border border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setActivityFilter('all'); setVisibleActivitiesCount(20); }}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${activityFilter === 'all' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    All ({activityLog.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActivityFilter('like'); setVisibleActivitiesCount(20); }}
                                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activityFilter === 'like' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Likes ({counts.likes})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActivityFilter('comment'); setVisibleActivitiesCount(20); }}
                                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activityFilter === 'comment' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Comments ({counts.comments})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActivityFilter('uploads'); setVisibleActivitiesCount(20); }}
                                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activityFilter === 'uploads' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Uploads ({counts.courses + counts.videos})
                                </button>
                            </div>
                        </div>

                        {isLoadingActivity ? (
                            <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                                <span className="text-xs font-bold">Loading activity timeline in 20-item batches...</span>
                            </div>
                        ) : filteredActivities.length === 0 ? (
                            <div className="p-6 text-center bg-zinc-950/60 rounded-xl text-zinc-500 text-xs font-medium border border-white/5">
                                No matching interactions found for this teacher.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredActivities.slice(0, visibleActivitiesCount).map(act => (
                                    <div 
                                        key={act.id} 
                                        className="p-3.5 rounded-xl bg-zinc-950/70 border border-white/5 flex items-start gap-3 transition-all hover:border-cyan-500/30"
                                    >
                                        <div className="p-2 rounded-lg bg-zinc-900 border border-white/10 shrink-0 mt-0.5">
                                            {act.type === 'like' && <Heart size={14} className="text-red-400 fill-current" />}
                                            {act.type === 'comment' && <MessageSquare size={14} className="text-blue-400" />}
                                            {act.type === 'course' && <BookOpen size={14} className="text-cyan-400" />}
                                            {act.type === 'video' && <Video size={14} className="text-purple-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-zinc-200 truncate">
                                                    {act.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-500 font-mono shrink-0 ml-2">
                                                    {new Date(act.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 line-clamp-2 italic">
                                                {act.snippet}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {visibleActivitiesCount < filteredActivities.length && (
                                    <div className="text-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setVisibleActivitiesCount(prev => prev + 20)}
                                            className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-black uppercase rounded-xl border border-cyan-500/30 transition-all inline-flex items-center gap-1.5"
                                        >
                                            <ChevronDown size={14} /> Load 20 More Activities ({filteredActivities.length - visibleActivitiesCount} remaining)
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
