"use client";
import { useState, useEffect } from "react";
import { ref, onValue, update, orderByKey, query as rtdbQuery } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export function useFirebaseCollection(type: 'teacher' | 'student' | 'pending' | 'users' = 'users', filterStatus?: string) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!rtdb) return;

        // Path to your users node
        const usersRef = ref(rtdb, 'users');
        const q = rtdbQuery(usersRef, orderByKey());

        const unsubscribe = onValue(q, (snapshot) => {
            const val = snapshot.val();
            console.log("RTDB Raw Value:", val);
            if (val) {
                const items = Object.entries(val).map(([id, details]: [string, any]) => ({
                    id,
                    ...details
                }));
                console.log("RTDB Parsed Items:", items);

                // Filter logic based on the requested 'type' and 'role'
                let filtered = items;
                if (type === 'teacher') {
                    // Include both "approved" and "active" status for Teachers Registry
                    filtered = items.filter(u => u.role === 'teacher' && (u.status === 'approved' || u.status === 'active'));
                } else if (type === 'student') {
                    filtered = items.filter(u => u.role === 'student');
                } else if (type === 'pending') {
                    filtered = items.filter(u => u.role === 'teacher' && u.status === 'pending');
                }

                if (filterStatus) {
                    filtered = filtered.filter(u => u.status === filterStatus);
                }

                setData(filtered);
            } else {
                setData([]);
            }
            setLoading(false);
        }, (err) => {
            console.error(`RTDB Error:`, err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [type, filterStatus]);

    return { data, loading, error };
}

export async function updateStatus(id: string, newStatus: string) {
    const userRef = ref(rtdb, `users/${id}`);
    await update(userRef, { status: newStatus });

    // Notify backend API to ensure approval email & chat cleanup triggers reliably
    try {
        await fetch(`https://learnovaserver-production.up.railway.app/api/users/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        });
    } catch (err) {
        console.warn('Could not notify backend of status update:', err);
    }
}
