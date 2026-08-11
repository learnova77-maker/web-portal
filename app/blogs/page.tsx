"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { useFirebaseCollection } from "@/hooks/useFirebaseCollection";
import { ref, remove } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import Link from "next/link";
import { Plus, Search, FileText, Trash2, Edit } from "lucide-react";

export default function BlogsPage() {
    const { data: blogs, loading, error } = useFirebaseCollection("blogs");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredBlogs = blogs.filter(b =>
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this blog post? This cannot be undone.")) {
            try {
                await remove(ref(rtdb, `blogs/${id}`));
            } catch (err) {
                console.error("Failed to delete blog", err);
                alert("Failed to delete blog. Please try again.");
            }
        }
    };

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                                Manage Blogs <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 not-italic font-mono">Content</span>
                            </h1>
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">Create, edit, and publish blog posts to Matloverse.</p>
                        </div>
                        <Link
                            href="/blogs/create"
                            className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:-translate-y-1"
                        >
                            <Plus size={16} /> Create New Blog
                        </Link>
                    </div>
                </header>

                <div className="p-8">
                    <div className="mb-8 relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search blogs by title or slug..."
                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-white placeholder-zinc-600 text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="py-24 text-center text-zinc-500 font-bold italic animate-pulse">
                            Loading blog posts...
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center bg-zinc-900 border border-red-500/20 rounded-3xl p-8">
                            <p className="text-xl font-black text-white uppercase italic">Connection Error</p>
                            <p className="text-zinc-500 font-medium italic mt-1">{error.message}</p>
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="py-24 text-center bg-zinc-900 rounded-3xl border border-white/5 p-8">
                            <div className="p-4 bg-cyan-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-cyan-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">No Blogs Found</h3>
                            <p className="text-zinc-500 font-medium italic text-xs mt-1">Get started by creating your first blog post!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredBlogs.map(blog => (
                                <div key={blog.id} className="bg-zinc-900 rounded-[2rem] border border-white/5 hover:border-cyan-500/30 transition-all p-5 flex flex-col group relative overflow-hidden">
                                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-zinc-800 mb-4 border border-white/5 shrink-0">
                                        {blog.featureImage ? (
                                            <img src={blog.featureImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                <FileText className="w-12 h-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <h3 className="text-lg font-black text-white uppercase italic leading-tight line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors">{blog.title}</h3>
                                        <p className="text-xs text-zinc-500 font-mono mb-4 truncate">/{blog.slug}</p>
                                        
                                        <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5">
                                            <button 
                                                onClick={() => handleDelete(blog.id)}
                                                className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-black transition-all border border-red-500/20"
                                                title="Delete Blog"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <Link
                                                href={`/blogs/edit/${blog.id}`}
                                                className="flex-1 py-2.5 bg-zinc-800 text-cyan-400 hover:bg-cyan-500 hover:text-black rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-white/5 flex items-center justify-center gap-2"
                                            >
                                                <Edit size={14} /> Edit Post
                                            </Link>
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
