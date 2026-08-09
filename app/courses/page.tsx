"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
    BookOpen,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Users,
    Clock,
    Star,
    PlayCircle
} from "lucide-react";

const MOCK_COURSES = [
    {
        id: "c1",
        title: "Advanced Mathematics",
        instructor: "Dr. Ahmed Khan",
        students: 124,
        duration: "12 Weeks",
        rating: 4.8,
        status: "Published",
        category: "Science"
    },
    {
        id: "c2",
        title: "Introduction to Biology",
        instructor: "Sarah Malik",
        students: 85,
        duration: "8 Weeks",
        rating: 4.5,
        status: "Draft",
        category: "Science"
    },
    {
        id: "c3",
        title: "English Literature",
        instructor: "John Doe",
        students: 210,
        duration: "10 Weeks",
        rating: 4.9,
        status: "Published",
        category: "Arts"
    },
];

export default function CoursesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans antialiased">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950/80 border-b border-yellow-500/10 px-8 py-7 sticky top-0 z-10 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-yellow-500/10 rounded-[2rem] border border-yellow-500/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                                <BookOpen className="w-9 h-9 text-yellow-500" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Curriculum Hub</h1>
                                <p className="text-zinc-500 font-medium italic tracking-tight">Expand learning horizons on Learnova.</p>
                            </div>
                        </div>
                        <button className="bg-yellow-500 text-black px-8 py-3.5 rounded-[1.5rem] font-black uppercase text-sm tracking-widest flex items-center hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:-translate-y-1 active:scale-95">
                            <Plus className="w-5 h-5 mr-3" />
                            Launch Course
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-600 transition-colors group-focus-within:text-yellow-500" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors or status..."
                                className="w-full pl-14 pr-6 py-4 bg-zinc-900 border border-white/5 rounded-[2rem] focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500/30 outline-none transition-all text-white placeholder-zinc-600 font-medium italic"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-white/5 rounded-[1.5rem] hover:bg-zinc-800 text-zinc-400 transition-all font-black text-xs uppercase tracking-widest">
                                <Filter className="w-4 h-4" />
                                Category
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {MOCK_COURSES.map((course) => (
                            <div key={course.id} className="bg-zinc-900 rounded-[3rem] p-8 border border-white/5 shadow-2xl hover:border-yellow-500/30 transition-all duration-700 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="flex gap-5">
                                        <div className="w-20 h-20 rounded-[2rem] bg-zinc-800 text-yellow-500 flex items-center justify-center font-black border border-white/5 transition-all shadow-inner">
                                            <PlayCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white tracking-tight uppercase italic mb-1">{course.title}</h4>
                                            <p className="text-xs text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                Instructor: <span className="text-yellow-500/80">{course.instructor}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${course.status === 'Published'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                            : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                        }`}>
                                        {course.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                                    <div className="bg-zinc-950 rounded-[1.5rem] p-4 border border-white/5 text-center group-hover:border-yellow-500/20 transition-all">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                                            <Users className="w-3 h-3" /> Students
                                        </p>
                                        <p className="text-lg font-black text-white">{course.students}</p>
                                    </div>
                                    <div className="bg-zinc-950 rounded-[1.5rem] p-4 border border-white/5 text-center group-hover:border-yellow-500/20 transition-all">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                                            <Clock className="w-3 h-3" /> Time
                                        </p>
                                        <p className="text-lg font-black text-white tracking-tighter">{course.duration}</p>
                                    </div>
                                    <div className="bg-zinc-950 rounded-[1.5rem] p-4 border border-white/5 text-center group-hover:border-yellow-500/20 transition-all">
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-500" /> Score
                                        </p>
                                        <p className="text-lg font-black text-yellow-500">{course.rating}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative z-10">
                                    <button className="flex-1 bg-zinc-800 text-zinc-400 font-black py-4 rounded-2xl hover:bg-zinc-700 transition-all uppercase text-[10px] tracking-[0.2em] border border-white/5 group-hover:text-white">
                                        Edit Modules
                                    </button>
                                    <button className="flex-1 bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-xl hover:shadow-yellow-500/20 uppercase text-[10px] tracking-[0.2em]">
                                        Manage Live
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
