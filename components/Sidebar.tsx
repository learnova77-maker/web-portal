"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";
import {
    Users,
    GraduationCap,
    Clock,
    LayoutDashboard,
    LogOut,
    BookOpen,
    Settings,
    MessageSquare,
    Star
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Teachers", href: "/teachers", icon: Users },
    { name: "Students", href: "/students", icon: GraduationCap },
    { name: "Pending Approvals", href: "/pending", icon: Clock },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Reviews", href: "/reviews", icon: Star },
    { name: "Courses", href: "/courses", icon: BookOpen },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: pending } = useFirebaseCollection("pending");
    const pendingCount = pending?.length || 0;

    return (
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
    );
}
