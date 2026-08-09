"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { rtdb } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
    Star,
    Search,
    BookOpen,
    User,
    Clock,
    Filter,
    MessageSquare,
    ChevronRight,
    Quote
} from "lucide-react";
import { format } from "date-fns";

interface Review {
    reviewId: string;
    courseId: string;
    courseName: string;
    studentName: string;
    rating: number;
    text?: string;
    createdAt: number;
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');

    useEffect(() => {
        const coursesRef = ref(rtdb, "courses");

        const unsubscribe = onValue(coursesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setReviews([]);
                setLoading(false);
                return;
            }

            const allReviews: Review[] = [];

            Object.entries(data).forEach(([courseId, courseData]: [string, any]) => {
                if (courseData.reviews) {
                    Object.entries(courseData.reviews).forEach(([reviewId, reviewData]: [string, any]) => {
                        allReviews.push({
                            reviewId,
                            courseId,
                            courseName: courseData.title || courseData.description || "Untitled Course",
                            studentName: reviewData.studentName || "Anonymous Student",
                            rating: reviewData.rating || 0,
                            text: reviewData.text || reviewData.comment || "No comment provided.",
                            createdAt: reviewData.createdAt || 0
                        });
                    });
                }
            });

            // Sort by latest
            allReviews.sort((a, b) => b.createdAt - a.createdAt);
            setReviews(allReviews);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = r.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.text && r.text.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRating = filterRating === 'all' || r.rating === filterRating;

        return matchesSearch && matchesRating;
    });

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    return (
        <div className="flex h-screen bg-zinc-950 text-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <header className="bg-zinc-950 border-b border-cyan-500/10 px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Student Reviews</h1>
                            <p className="text-zinc-500 mt-1 font-medium italic">Monitor feedback across all Matoverse courses.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Global Average</p>
                                <div className="flex items-center justify-end gap-2">
                                    <Star className="w-5 h-5 text-cyan-500 fill-cyan-500" />
                                    <span className="text-2xl font-black text-white">{averageRating}</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-white/5" />
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Total Reviews</p>
                                <p className="text-2xl font-black text-cyan-500">{reviews.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by course, student or content..."
                                className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-white/5 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-white placeholder-zinc-600 font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={filterRating}
                                onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none min-w-[160px]"
                            >
                                <option value="all">All Ratings</option>
                                <option value="5">5 Stars only</option>
                                <option value="4">4 Stars & up</option>
                                <option value="3">3 Stars & up</option>
                                <option value="2">2 Stars & up</option>
                                <option value="1">1 Star only</option>
                            </select>
                        </div>
                    </div>

                    {/* List View */}
                    {loading ? (
                        <div className="py-20 text-center text-zinc-500 font-bold italic animate-pulse">
                            Loading course testimonials...
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="py-20 text-center bg-zinc-900 rounded-[2rem] border border-white/5">
                            <Quote className="w-12 h-12 text-zinc-700 mx-auto mb-4 opacity-20" />
                            <p className="text-zinc-500 font-bold italic uppercase tracking-widest">No reviews found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-w-5xl mx-auto">
                            {filteredReviews.map((review) => (
                                <div key={review.reviewId} className="group bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-cyan-500/30 transition-all flex items-center gap-6 relative overflow-hidden">
                                    {/* Indicator for high rating */}
                                    {review.rating >= 4 && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50" />
                                    )}

                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 text-sm font-black">
                                            {review.studentName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black text-white uppercase tracking-tight truncate">{review.studentName}</h3>
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-2.5 w-2.5 ${i < review.rating ? 'text-cyan-500 fill-cyan-500' : 'text-zinc-800'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-400 font-medium italic text-xs leading-relaxed truncate group-hover:text-zinc-300 transition-colors">
                                            "{review.text}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6 text-right shrink-0">
                                        <div className="hidden md:flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-950 border border-white/5 rounded-md mb-1">
                                                <BookOpen className="w-2.5 h-2.5 text-zinc-600" />
                                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[120px]">{review.courseName}</span>
                                            </div>
                                            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest font-mono">
                                                {review.createdAt ? format(review.createdAt, "MMM d, yyyy") : ""}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-cyan-500 transition-colors" />
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
