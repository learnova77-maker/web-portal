"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import SupportChatModal from "@/components/SupportChatModal";
import TeacherVerificationModal from "@/components/TeacherVerificationModal";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, remove, get } from "firebase/database";
import {
    MessageSquare,
    Search,
    User,
    Clock,
    CheckCircle2,
    ShieldAlert,
    ChevronRight,
    MessageCircle,
    Trash2,
    Eye,
    ShieldCheck
} from "lucide-react";
import { format } from "date-fns";

interface ChatSummary {
    userId: string;
    userName: string;
    lastMessage: string;
    lastTimestamp: number;
    unreadCount: number;
    type: "support_chats" | "approval_chats";
}

export default function MessagesPage() {
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);

    // Verification Modal Inspection State
    const [inspectTeacher, setInspectTeacher] = useState<any | null>(null);
    const [isInspectOpen, setIsInspectOpen] = useState(false);

    const handleInspectUser = async (e: React.MouseEvent, userId: string, userName: string) => {
        e.stopPropagation();
        try {
            const userSnap = await get(ref(rtdb, `users/${userId}`));
            if (userSnap.exists()) {
                setInspectTeacher({ id: userId, ...userSnap.val() });
            } else {
                setInspectTeacher({ id: userId, fullName: userName });
            }
            setIsInspectOpen(true);
        } catch (err) {
            console.error("Error fetching user details for inspection:", err);
            setInspectTeacher({ id: userId, fullName: userName });
            setIsInspectOpen(true);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chat: ChatSummary) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete the entire conversation with ${chat.userName}?`)) {
            try {
                await remove(ref(rtdb, `${chat.type}/${chat.userId}`));
            } catch (err) {
                console.error("Error deleting chat:", err);
            }
        }
    };

    useEffect(() => {
        const supportRef = ref(rtdb, "support_chats");
        const approvalRef = ref(rtdb, "approval_chats");

        const processChats = (snapshot: any, type: "support_chats" | "approval_chats") => {
            const data = snapshot.val();
            if (!data) return [];

            return Object.entries(data).map(([userId, messages]: [string, any]) => {
                const msgs = Object.values(messages).sort((a: any, b: any) => b.createdAt - a.createdAt);
                const lastMsg: any = msgs[0];
                const unread = msgs.filter((m: any) => m.sender === "user" && !m.read).length;

                return {
                    userId,
                    userName: lastMsg.userName || "Unknown User",
                    lastMessage: lastMsg.text || (lastMsg.mediaType === "image" ? "📷 Image Shared" : ""),
                    lastTimestamp: lastMsg.createdAt || 0,
                    unreadCount: unread,
                    type
                };
            }) as ChatSummary[];
        };

        const unsubSupport = onValue(supportRef, (snap) => {
            const supportChats = processChats(snap, "support_chats");
            setChats(prev => {
                const other = prev.filter(c => c.type !== "support_chats");
                return [...supportChats, ...other].sort((a, b) => b.lastTimestamp - a.lastTimestamp);
            });
            setLoading(false);
        });

        const unsubApproval = onValue(approvalRef, (snap) => {
            const approvalChats = processChats(snap, "approval_chats");
            setChats(prev => {
                const other = prev.filter(c => c.type !== "approval_chats");
                return [...approvalChats, ...other].sort((a, b) => b.lastTimestamp - a.lastTimestamp);
            });
            setLoading(false);
        });

        return () => {
            unsubSupport();
            unsubApproval();
        };
    }, []);

    const openChat = (chat: ChatSummary) => {
        setSelectedChat(chat);
        setIsChatOpen(true);
    };

    const filteredChats = chats.filter(c =>
        c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-zinc-950 text-white">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Live Support Center</h1>
                            <p className="text-zinc-500 mt-1 font-medium italic">Manage active conversations and approval queries.</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                            <MessageCircle className="w-5 h-5 text-cyan-500" />
                            <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">
                                {chats.reduce((acc, c) => acc + c.unreadCount, 0)} New Messages
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    {/* Search & Filters */}
                    <div className="mb-8 max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search conversations by name or message..."
                                className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-white placeholder-zinc-600 font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="grid gap-4">
                        {loading ? (
                            <div className="py-20 text-center text-zinc-500 font-bold italic animate-pulse">
                                Connecting to Realtime Database...
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <div className="py-20 text-center bg-zinc-900 rounded-[2rem] border border-white/5">
                                <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500 font-bold italic uppercase tracking-widest">No conversations found.</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={`${chat.type}-${chat.userId}`}
                                    onClick={() => openChat(chat)}
                                    className="group flex items-center gap-6 p-6 bg-zinc-900 border border-white/5 rounded-[2rem] hover:bg-zinc-800 transition-all text-left relative overflow-hidden"
                                >
                                    {/* Indicator for new messages */}
                                    {chat.unreadCount > 0 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                    )}

                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-black border transition-all ${chat.type === "approval_chats"
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                                        }`}>
                                        {chat.userName.charAt(0)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-white uppercase tracking-tight truncate">{chat.userName}</h3>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${chat.type === "approval_chats"
                                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                                                }`}>
                                                {chat.type === "approval_chats" ? "Verification Query" : "Support"}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 font-medium truncate italic group-hover:text-zinc-300 transition-colors">
                                            {chat.lastMessage}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest font-mono">
                                                    {chat.lastTimestamp ? format(chat.lastTimestamp, "HH:mm") : ""}
                                                </span>
                                                {chat.unreadCount > 0 ? (
                                                    <span className="bg-cyan-500 text-black px-2.5 py-1 rounded-lg text-[10px] font-black shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-bounce">
                                                        {chat.unreadCount} NEW
                                                    </span>
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleInspectUser(e, chat.userId, chat.userName)}
                                            className="p-3 text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all border border-cyan-500/20 flex items-center gap-1.5 text-xs font-bold"
                                            title="View Full User Details & Documents"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden lg:inline uppercase text-[10px] font-black">Details</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteChat(e, chat)}
                                            className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete Conversation"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Chat Modal */}
            {selectedChat && (
                <SupportChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    userId={selectedChat.userId}
                    userName={selectedChat.userName}
                    chatType={selectedChat.type}
                />
            )}

            {/* Teacher Details Inspection Modal */}
            <TeacherVerificationModal
                isOpen={isInspectOpen}
                onClose={() => setIsInspectOpen(false)}
                teacher={inspectTeacher}
            />
        </div>
    );
}
