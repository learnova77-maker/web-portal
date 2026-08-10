"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, push, serverTimestamp, update, get } from "firebase/database";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { rtdb, storage } from "@/lib/firebase";
import { X, Send, User, Bot, Check, CheckCheck, Image as ImageIcon, Loader2, Eye, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import TeacherVerificationModal from "@/components/TeacherVerificationModal";

interface Message {
    id: string;
    text: string;
    sender: "user" | "support";
    userName: string;
    createdAt: number;
    read: boolean;
    mediaType?: "image" | "text" | string;
    mediaUri?: string;
}

interface SupportChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    chatType?: "support_chats" | "approval_chats";
}

export default function SupportChatModal({ isOpen, onClose, userId, userName, chatType = "support_chats" }: SupportChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [inspectTeacher, setInspectTeacher] = useState<any | null>(null);
    const [isInspectOpen, setIsInspectOpen] = useState(false);
    const [loadingInspect, setLoadingInspect] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInspectUser = async () => {
        if (!userId) return;
        setLoadingInspect(true);
        try {
            const userSnap = await get(ref(rtdb, `users/${userId}`));
            if (userSnap.exists()) {
                setInspectTeacher({ id: userId, ...userSnap.val() });
            } else {
                setInspectTeacher({ id: userId, fullName: userName });
            }
            setIsInspectOpen(true);
        } catch (err) {
            console.error("Error loading user profile for inspection:", err);
            setInspectTeacher({ id: userId, fullName: userName });
            setIsInspectOpen(true);
        } finally {
            setLoadingInspect(false);
        }
    };

    useEffect(() => {
        if (!isOpen || !userId) return;

        const chatRef = ref(rtdb, `${chatType}/${userId}`);
        const unsubscribe = onValue(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messageList = Object.entries(data).map(([id, msg]: [string, any]) => ({
                    id,
                    ...msg,
                })).sort((a, b) => a.createdAt - b.createdAt);
                setMessages(messageList);

                // Mark all user messages as read when admin opens the chat
                messageList.forEach((msg) => {
                    if (msg.sender === "user" && !msg.read) {
                        update(ref(rtdb, `${chatType}/${userId}/${msg.id}`), { read: true });
                    }
                });
            } else {
                setMessages([]);
            }
        });

        return () => unsubscribe();
    }, [isOpen, userId, chatType]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const chatRef = ref(rtdb, `${chatType}/${userId}`);
        await push(chatRef, {
            text: newMessage,
            sender: "support",
            userName: "Support Team",
            createdAt: serverTimestamp(),
            read: false,
        });

        setNewMessage("");
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `${userId}_${Date.now()}_${file.name}`;
            const sRef = storageRef(storage, `chat_media/${fileName}`);
            const uploadTask = uploadBytesResumable(sRef, file);

            uploadTask.on('state_changed',
                null,
                (error) => {
                    console.error("Upload error:", error);
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    const chatRef = ref(rtdb, `${chatType}/${userId}`);
                    await push(chatRef, {
                        text: "",
                        sender: "support",
                        userName: "Support Team",
                        createdAt: serverTimestamp(),
                        read: false,
                        mediaType: "image",
                        mediaUri: downloadURL
                    });
                    setUploading(false);
                }
            );
        } catch (error) {
            console.error("Error uploading image:", error);
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl h-[80vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div 
                        onClick={handleInspectUser}
                        className="flex items-center gap-4 cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all">
                            <User className="w-6 h-6 text-cyan-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-white uppercase tracking-tight italic group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                Chat with {userName}
                                <Eye className="w-4 h-4 text-cyan-500 opacity-80" />
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Support Session Active • Click to View Full Details</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleInspectUser}
                            disabled={loadingInspect}
                            className="px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-2xl text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2 transition-all"
                        >
                            {loadingInspect ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="w-4 h-4" />
                            )}
                            <span>View Details & Docs</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Messages Space */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                            <Bot className="w-16 h-16 mb-4" />
                            <p className="font-bold italic uppercase tracking-widest text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === "support" ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-3xl ${msg.sender === "support"
                                        ? "bg-cyan-500 text-black rounded-tr-none font-medium"
                                        : "bg-zinc-800 text-white rounded-tl-none border border-white/5"
                                        } ${msg.mediaType === 'image' ? 'p-1.5' : 'p-4'}`}
                                >
                                    {msg.mediaType === "image" && msg.mediaUri ? (
                                        <div className="space-y-2">
                                            <img
                                                src={msg.mediaUri}
                                                alt="Shared media"
                                                className="rounded-2xl w-full h-auto max-h-96 object-cover shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                loading="lazy"
                                                onClick={() => window.open(msg.mediaUri, '_blank')}
                                            />
                                            {msg.text && <p className="text-sm px-3 pb-2 font-black uppercase tracking-tighter">{msg.text}</p>}
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed font-bold">{msg.text}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-2">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter italic">
                                        {msg.createdAt ? format(msg.createdAt, "HH:mm") : "..."}
                                    </span>
                                    {msg.sender === "support" && (
                                        msg.read ? (
                                            <CheckCheck className="w-3 h-3 text-cyan-400" />
                                        ) : (
                                            <Check className="w-3 h-3 text-zinc-600" />
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {uploading && (
                        <div className="flex justify-end">
                            <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-3xl flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                                <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">Uploading Media...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Field */}
                <form onSubmit={handleSendMessage} className="p-6 bg-zinc-950 border-t border-cyan-500/10">
                    <div className="relative flex items-center gap-3">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-cyan-500 rounded-2xl transition-all hover:bg-zinc-800"
                        >
                            <ImageIcon className="w-6 h-6" />
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message or share an image..."
                            className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold tracking-tight"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-black p-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Teacher Details & Verification Inspection Modal */}
            <TeacherVerificationModal
                isOpen={isInspectOpen}
                onClose={() => setIsInspectOpen(false)}
                teacher={inspectTeacher}
            />
        </div>
    );
}
