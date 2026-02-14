"use client";

import { createClient } from "@/lib/supabaseClient";
import { Bookmark } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import { User } from "@supabase/supabase-js";

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch bookmarks from Supabase
    const fetchBookmarks = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setBookmarks(data as Bookmark[]);
        }
    }, []);

    useEffect(() => {
        const supabase = createClient();

        // Get current user session
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);
            setLoading(false);
        };

        getUser();
    }, [router]);

    // Fetch bookmarks & set up realtime once user is available
    useEffect(() => {
        if (!user) return;

        fetchBookmarks();

        const supabase = createClient();

        // Subscribe to realtime changes for this user's bookmarks
        const channel = supabase
            .channel(`bookmarks-${user.id}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookmarks",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log("Realtime event received:", payload);
                    fetchBookmarks();
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("Subscribed to bookmarks realtime");
                } else if (status === "CLOSED") {
                    console.log("Subscription closed");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchBookmarks]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="animate-spin h-8 w-8 text-indigo-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <p className="text-gray-500 text-sm">Loading your bookmarks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950">
            <Navbar userEmail={user?.email || ""} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">My Bookmarks</h1>
                    <p className="text-gray-500 mt-1">
                        {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""} saved
                    </p>
                </div>

                {/* Add Bookmark Form */}
                <div className="mb-8">
                    <BookmarkForm userId={user!.id} onBookmarkAdded={fetchBookmarks} />
                </div>

                {/* Bookmark List */}
                <BookmarkList bookmarks={bookmarks} onBookmarkDeleted={fetchBookmarks} />
            </main>
        </div>
    );
}
