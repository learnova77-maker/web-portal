"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
    Trash2,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Mail,
    User,
    AlertTriangle,
    ShieldAlert
} from "lucide-react";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";

export default function DeleteRequestsPage() {
    const { data: requests, loading, error } = useFirebaseCollection("deleteRequests");
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const filteredRequests = requests.filter((r: any) =>
        (r.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleApprove = async (uid: string) => {
        if (!confirm("Are you sure you want to permanently delete this teacher's account? This cannot be undone.")) return;
        setActionLoading(uid);
        try {
            await fetch(`https://learnovaserver-production.up.railway.app/api/users/delete-request/approve/${uid}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Error approving delete request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (uid: string) => {
        if (!confirm("Reject this delete request? The teacher's account will remain active.")) return;
        setActionLoading(uid);
        try {
            await fetch(`https://learnovaserver-production.up.railway.app/api/users/delete-request/reject/${uid}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Error rejecting delete request:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (ts: number) => {
        if (!ts) return "Unknown";
        return new Date(ts).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="flex h-screen bg-zinc-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-xl border-b border-red-500/10 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-2xl">
                                <ShieldAlert className="w-7 h-7 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">
                                    DELETE <span className="text-red-500">REQUESTS</span>
                                </h1>
                                <p className="text-xs text-zinc-500 font-bold tracking-wider mt-1">
                                    TEACHER ACCOUNT DELETION REQUESTS
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                                <span className="text-red-500 font-black text-sm">{filteredRequests.length}</span>
                                <span className="text-zinc-500 font-bold text-xs ml-2">PENDING</span>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mt-5 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/40 transition-colors font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-zinc-500 text-xs font-bold mt-4 tracking-wider">LOADING REQUESTS...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-400 font-bold">Error loading delete requests</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-black text-white mb-2">ALL CLEAR</h3>
                            <p className="text-zinc-500 text-sm font-medium">No pending delete requests at the moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map((req: any) => (
                                <div
                                    key={req.id}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/20 transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Avatar */}
                                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/20">
                                                <User className="w-6 h-6 text-red-500" />
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-black text-base tracking-tight">
                                                    {req.fullName || "Unknown Teacher"}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-zinc-400 text-xs font-medium">{req.email || "No email"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                                    <span className="text-zinc-500 text-xs font-medium">
                                                        Requested: {formatDate(req.requestedAt)}
                                                    </span>
                                                </div>

                                                {/* Reason */}
                                                <div className="mt-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                                                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">REASON</p>
                                                    <p className="text-zinc-300 text-sm font-medium">{req.reason || "No reason provided"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4 shrink-0">
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-300 text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                REJECT
                                            </button>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                APPROVE DELETE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
