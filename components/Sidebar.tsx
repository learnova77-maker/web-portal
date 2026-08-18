"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";
import SupportChatModal from "@/components/SupportChatModal";
import {
    Users,
    GraduationCap,
    Clock,
    LayoutDashboard,
    LogOut,
    BookOpen,
    Settings,
    MessageSquare,
    Star,
    X,
    BellRing,
    FileText
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Teachers", href: "/teachers", icon: Users },
    { name: "Students", href: "/students", icon: GraduationCap },
    { name: "Pending Approvals", href: "/pending", icon: Clock },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Manage Blogs", href: "/blogs", icon: FileText },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: pending } = useFirebaseCollection("pending");
    const pendingCount = pending?.length || 0;

    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<{
        userId: string;
        userName: string;
        text: string;
        chatType: "support_chats" | "approval_chats";
    } | null>(null);
    const [latestAdminNotification, setLatestAdminNotification] = useState<{
        title: string;
        message: string;
    } | null>(null);
    const [activeChatUser, setActiveChatUser] = useState<{
        userId: string;
        userName: string;
        chatType: "support_chats" | "approval_chats";
    } | null>(null);

    const prevMessageTimestamps = useRef<{ [key: string]: number }>({});
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!rtdb) return;

        const supportRef = ref(rtdb, "support_chats");
        const approvalRef = ref(rtdb, "approval_chats");

        let currentSupportUnread = 0;
        let currentApprovalUnread = 0;

        const processSnapshot = (snapshot: any, type: "support_chats" | "approval_chats") => {
            const data = snapshot.val();
            let unread = 0;
            if (data) {
                Object.entries(data).forEach(([userId, userMsgs]: [string, any]) => {
                    const msgArray = Object.entries(userMsgs).map(([id, m]: [string, any]) => ({ id, ...m }));
                    msgArray.forEach((m: any) => {
                        if (m.sender === "user" && !m.read) {
                            unread++;
                        }
                    });

                    // Sort to find latest message
                    const sorted = msgArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    const latest = sorted[0];
                    if (latest && latest.sender === "user") {
                        const key = `${type}_${userId}`;
                        const prevTime = prevMessageTimestamps.current[key] || 0;
                        const msgTime = Number(latest.createdAt || 0);
                        if (!initialLoadRef.current && msgTime > 0 && prevTime > 0 && msgTime > prevTime && !latest.read) {
                            setLatestNotification({
                                userId,
                                userName: latest.userName || "Teacher / User",
                                text: latest.text || (latest.mediaType === "image" ? "📷 Image Attached" : "Sent a message"),
                                chatType: type
                            });
                        }
                        if (msgTime > 0) {
                            prevMessageTimestamps.current[key] = msgTime;
                        }
                    }
                });
            }
            return unread;
        };

        const unsubSupport = onValue(supportRef, (snap) => {
            currentSupportUnread = processSnapshot(snap, "support_chats");
            setUnreadMessagesCount(currentSupportUnread + currentApprovalUnread);
            initialLoadRef.current = false;
        });

        const unsubApproval = onValue(approvalRef, (snap) => {
            currentApprovalUnread = processSnapshot(snap, "approval_chats");
            setUnreadMessagesCount(currentSupportUnread + currentApprovalUnread);
            initialLoadRef.current = false;
        });

        const adminNotifRef = ref(rtdb, "admin_notifications");
        const unsubAdminNotif = onValue(adminNotifRef, (snapshot) => {
            if (initialLoadRef.current) return; // Prevent toasts on mount
            const data = snapshot.val();
            if (!data) return;
            
            const entries = Object.entries(data) as [string, any][];
            const sorted = entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
            const latest = sorted[0];
            if (latest && latest[1]) {
                const key = `admin_notif`;
                const prevTime = prevMessageTimestamps.current[key] || 0;
                const msgTime = Number(latest[1].timestamp || 0);
                if (msgTime > 0 && prevTime > 0 && msgTime > prevTime && !latest[1].isRead) {
                    setLatestAdminNotification({
                        title: latest[1].title,
                        message: latest[1].message
                    });
                }
                if (msgTime > 0) {
                    prevMessageTimestamps.current[key] = msgTime;
                }
            }
        });

        return () => {
            unsubSupport();
            unsubApproval();
            unsubAdminNotif();
        };
    }, []);

    return (
        <>
            {/* Realtime Toast Notification for incoming teacher messages */}
            {latestNotification && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-zinc-900 border border-cyan-500/40 p-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] max-w-sm flex items-start gap-3 text-white backdrop-blur-md">
                        <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0 mt-0.5 animate-bounce">
                            <BellRing className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-black text-xs text-cyan-400 uppercase tracking-wider truncate">
                                    New Message: {latestNotification.userName}
                                </h4>
                                <button
                                    onClick={() => setLatestNotification(null)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-zinc-300 font-medium truncate mt-1 italic">
                                "{latestNotification.text}"
                            </p>
                            <button
                                onClick={() => {
                                    setActiveChatUser({
                                        userId: latestNotification.userId,
                                        userName: latestNotification.userName,
                                        chatType: latestNotification.chatType
                                    });
                                    setLatestNotification(null);
                                }}
                                className="mt-2 text-[11px] font-black text-cyan-400 hover:underline uppercase tracking-wider flex items-center gap-1"
                            >
                                Open Chat & Details →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Realtime Toast Notification for Admin System Alerts (e.g., Warnings) */}
            {latestAdminNotification && (
                <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-zinc-900 border border-yellow-500/40 p-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] max-w-sm flex items-start gap-3 text-white backdrop-blur-md">
                        <div className="p-2.5 bg-yellow-500/20 text-yellow-500 rounded-xl shrink-0 mt-0.5 animate-pulse">
                            <BellRing className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-black text-xs text-yellow-500 uppercase tracking-wider truncate">
                                    {latestAdminNotification.title}
                                </h4>
                                <button
                                    onClick={() => setLatestAdminNotification(null)}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-zinc-300 font-medium mt-1 italic">
                                "{latestAdminNotification.message}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-full w-64 flex-col bg-zinc-950 text-white border-r border-cyan-500/10">
                <div className="flex h-24 items-center gap-3 px-6 border-b border-cyan-500/10">
                    <img src="/logo.png" alt="Matoverse Logo" className="w-10 h-10 object-contain" />
                    <h1 className="text-xl font-black tracking-tighter text-cyan-400 uppercase italic">
                        MATOVERSE
                    </h1>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${isActive
                                    ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                                    : "text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400"
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-black" : "text-zinc-500 group-hover:text-cyan-400 transition-colors"
                                        }`}
                                />
                                {item.name}
                                {item.name === "Pending Approvals" && pendingCount > 0 && (
                                    <span className={`ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-2 ring-zinc-950 ${isActive ? "bg-black text-cyan-500" : "bg-cyan-500 text-black"
                                        }`}>
                                        {pendingCount}
                                    </span>
                                )}
                                {item.name === "Messages" && unreadMessagesCount > 0 && (
                                    <span className={`ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ring-2 ring-zinc-950 animate-pulse ${isActive ? "bg-black text-cyan-500" : "bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                        }`}>
                                        {unreadMessagesCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-cyan-500/10 p-4 space-y-2">
                    <button className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-bold text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all">
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                    </button>
                    <button className="flex w-full items-center rounded-xl px-3 py-2 text-sm font-bold text-red-500/80 hover:bg-red-500/10 transition-all">
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Support Chat Modal triggered from notification */}
            {activeChatUser && (
                <SupportChatModal
                    isOpen={!!activeChatUser}
                    onClose={() => setActiveChatUser(null)}
                    userId={activeChatUser.userId}
                    userName={activeChatUser.userName}
                    chatType={activeChatUser.chatType}
                />
            )}
        </>
    );
}
