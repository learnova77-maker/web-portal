"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ref, update, get, serverTimestamp } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { rtdb, storage } from "@/lib/firebase";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Type, FileText } from "lucide-react";
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [featureImage, setFeatureImage] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const blogRef = ref(rtdb, `blogs/${id}`);
                const snap = await get(blogRef);
                if (snap.exists()) {
                    const data = snap.val();
                    setTitle(data.title || "");
                    setFeatureImage(data.featureImage || "");
                    setContent(data.content || "");
                } else {
                    setError("Blog post not found.");
                }
            } catch (err: any) {
                console.error("Error fetching blog", err);
                setError("Failed to fetch blog data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBlog();
    }, [id]);

    const generateSlug = (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')       // Replace spaces with -
            .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
            .replace(/\-\-+/g, '-');    // Replace multiple - with single -
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError("");
        try {
            const fileRef = storageRef(storage, `blogs/featureImages/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setFeatureImage(url);
        } catch (err: any) {
            console.error("Failed to upload image", err);
            setError("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !content.trim()) {
            setError("Title and Content are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const slug = generateSlug(title);
            
            const updateData = {
                title: title.trim(),
                slug,
                featureImage: featureImage.trim(),
                content,
                updatedAt: serverTimestamp(),
            };

            await update(ref(rtdb, `blogs/${id}`), updateData);
            router.push('/blogs');
        } catch (err: any) {
            console.error("Failed to update blog", err);
            setError(err.message || "Failed to update blog post");
            setIsSubmitting(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/blogs" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                                Edit Blog Post
                            </h1>
                            <p className="text-zinc-500 mt-1 font-medium italic text-xs">Update your existing post.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-black rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </header>

                <div className="p-8 max-w-5xl mx-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-zinc-900 rounded-3xl border border-white/5 p-8 space-y-6">
                                
                                {/* Title */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                        <Type className="w-4 h-4" /> Post Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter an engaging title..."
                                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-bold text-lg"
                                    />
                                </div>

                                {/* Feature Image */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                        <ImageIcon className="w-4 h-4" /> Feature Image URL
                                    </label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="url"
                                                value={featureImage}
                                                onChange={(e) => setFeatureImage(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                    title="Upload Image"
                                                />
                                                <div className="w-full bg-zinc-900 border border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl px-5 py-3 text-center text-sm font-medium text-zinc-400 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2">
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                                    {isUploading ? "Uploading..." : "Click to Upload Image from Computer"}
                                                </div>
                                            </div>
                                        </div>
                                        {featureImage && (
                                            <div className="w-24 h-24 rounded-xl border border-white/10 overflow-hidden shrink-0 bg-zinc-950">
                                                <img src={featureImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                                        <FileText className="w-4 h-4" /> Post Content
                                    </label>
                                    <div className="bg-white rounded-2xl overflow-hidden border border-white/10 text-black">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={content} 
                                            onChange={setContent}
                                            modules={modules}
                                            className="h-[400px] mb-12"
                                        />
                                    </div>
                                    <style jsx global>{`
                                        .ql-container {
                                            font-size: 16px;
                                            font-family: inherit;
                                            height: 400px;
                                        }
                                        .ql-editor {
                                            padding: 24px;
                                        }
                                    `}</style>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
