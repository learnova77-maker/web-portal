"use client";

import { useState } from "react";
import { X, AlertTriangle, Send, Loader2 } from "lucide-react";
import { ref, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

interface DeclineReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: { id: string; fullName?: string; email?: string; username?: string } | null;
    onSuccess?: () => void;
}

export default function DeclineReasonModal({
    isOpen,
    onClose,
    teacher,
    onSuccess
}: DeclineReasonModalProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen || !teacher) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError("Please enter a reason for declining the application.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // 1. Immediately delete user node from Realtime Database (Triggers instant WebSocket logout on user device)
            if (rtdb && teacher.id) {
                await set(ref(rtdb, `users/${teacher.id}`), null);
                if (teacher.username) {
                    await set(ref(rtdb, `usernames/${teacher.username.toLowerCase()}`), null);
                }
                await set(ref(rtdb, `approval_chats/${teacher.id}`), null);
                await set(ref(rtdb, `support_chats/${teacher.id}`), null);
            }

            // 2. Call API route to send decline email via Resend
            const res = await fetch("/api/decline-teacher", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: teacher.id,
                    reason: reason.trim(),
                    email: teacher.email,
                    fullName: teacher.fullName,
                    username: teacher.username,
                }),
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || "Failed to decline teacher");
            }

            setReason("");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Decline error:", err);
            setError(err.message || "Error processing decline. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-red-500/20 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Decline Application</h2>
                            <p className="text-xs font-bold text-zinc-400">
                                Declining {teacher.fullName || "Instructor"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-zinc-300 uppercase tracking-wider mb-2">
                            Reason for Declining * (Emailed to applicant)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            placeholder="Provide details on why the application is declined (e.g. Unclear CNIC upload, Degree certificate unverified, etc.)"
                            className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-medium"
                        />
                    </div>

                    {error && (
                        <p className="text-xs font-bold text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <div className="text-[11px] text-zinc-500 font-semibold space-y-1 bg-zinc-950 p-3.5 rounded-xl border border-white/5">
                        <p className="text-red-400 font-bold">⚠️ What happens on Decline:</p>
                        <p>• Reason email will be sent to <strong>{teacher.email || "the applicant"}</strong>.</p>
                        <p>• Teacher's active session will be automatically terminated (logged out).</p>
                        <p>• Teacher profile and credentials will be removed from database.</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-3 rounded-xl text-xs font-black text-zinc-400 hover:bg-white/5 uppercase tracking-wider transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !reason.trim()}
                            className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>Decline & Send Email</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
