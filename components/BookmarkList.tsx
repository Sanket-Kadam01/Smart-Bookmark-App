"use client";

import { createClient } from "@/lib/supabaseClient";
import { Bookmark } from "@/lib/types";
import { useState } from "react";

interface BookmarkListProps {
    bookmarks: Bookmark[];
    onBookmarkDeleted?: () => void;
}

export default function BookmarkList({ bookmarks, onBookmarkDeleted }: BookmarkListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [updating, setUpdating] = useState(false);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const supabase = createClient();

        const { error } = await supabase.from("bookmarks").delete().eq("id", id);

        if (!error && onBookmarkDeleted) {
            onBookmarkDeleted();
        }

        setDeletingId(null);
    };

    const startEditing = (bookmark: Bookmark) => {
        setEditingId(bookmark.id);
        setEditTitle(bookmark.title);
        setEditUrl(bookmark.url);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle("");
        setEditUrl("");
    };

    const handleUpdate = async () => {
        if (!editingId || !editTitle.trim() || !editUrl.trim()) return;

        setUpdating(true);
        const supabase = createClient();

        // Basic URL validation
        let formattedUrl = editUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = `https://${formattedUrl}`;
        }

        const { error } = await supabase
            .from("bookmarks")
            .update({ title: editTitle.trim(), url: formattedUrl })
            .eq("id", editingId);

        if (!error) {
            // Optimistic update or wait for realtime? 
            // Since we have realtime, let's just close the edit mode.
            // The parent component will re-fetch automatically via realtime subscription.
            if (onBookmarkDeleted) onBookmarkDeleted(); // Trigger parent fetch as backup
            cancelEditing();
        } else {
            alert("Failed to update bookmark");
        }

        setUpdating(false);
    };

    const timeAgo = (dateStr: string) => {
        const seconds = Math.floor(
            (Date.now() - new Date(dateStr).getTime()) / 1000
        );
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800/50 mb-4">
                    <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-1">
                    No bookmarks yet
                </h3>
                <p className="text-sm text-gray-600">
                    Add your first bookmark using the form above
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {bookmarks.map((bookmark) => (
                <div
                    key={bookmark.id}
                    className="group flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 hover:border-gray-700/50 rounded-xl transition-all duration-200"
                >
                    {editingId === bookmark.id ? (
                        <div className="flex-1 flex gap-2 w-full">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="Title"
                                autoFocus
                            />
                            <input
                                type="text"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="URL"
                            />
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                                title="Save"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg"
                                title="Cancel"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 min-w-0 mr-4">
                                <h3 className="text-white font-medium truncate">
                                    {bookmark.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <a
                                        href={bookmark.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-400 hover:text-indigo-300 truncate transition-colors"
                                    >
                                        {bookmark.url}
                                    </a>
                                    <span className="text-xs text-gray-600 whitespace-nowrap">
                                        · {timeAgo(bookmark.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => startEditing(bookmark)}
                                    className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Edit bookmark"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(bookmark.id)}
                                    disabled={deletingId === bookmark.id}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                                    title="Delete bookmark"
                                >
                                    {deletingId === bookmark.id ? (
                                        <svg
                                            className="animate-spin h-5 w-5"
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
                                    ) : (
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
