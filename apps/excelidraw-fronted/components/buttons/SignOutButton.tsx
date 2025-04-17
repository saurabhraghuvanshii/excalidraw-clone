"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SignOutButton() {
    const router = useRouter();
    const [isSignedIn, setIsSignedIn] = useState(false);

    useEffect(() => {
        setIsSignedIn(!!localStorage.getItem("token"));
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem("token");
        setIsSignedIn(false);
        router.replace("/signin");
    };

    if (!isSignedIn) return null;

    return (
        <button
            onClick={handleSignOut}
            className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-red-700 transition-colors z-50"
        >
            Sign Out
        </button>
    );
}
