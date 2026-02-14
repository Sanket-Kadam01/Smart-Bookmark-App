"use client";

import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavbarProps {
    userEmail: string;
}

export default function Navbar({ userEmail }: NavbarProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <nav className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                </div>
                <span className="text-lg font-semibold text-white tracking-tight">
                    Smart Bookmark
                </span>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 hidden sm:block">
                    {userEmail}
                </span>
                <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? "Signing out..." : "Sign Out"}
                </button>
            </div>
        </nav>
    );
}
