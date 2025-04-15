"use client"
import { useState, useEffect } from "react";
import { Share2, Check } from "lucide-react";
import { isAuthenticated } from "@/utils/auth";

export function ShareRoomButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {

    setShareUrl(`${window.location.origin}/canvas/${roomId}`);

    setIsAuth(isAuthenticated());
  }, [roomId]);

  const handleShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isAuth) return null;

  return (
    <button
      onClick={handleShare}
      className="h-9 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-md flex items-center gap-1.5 hover:from-violet-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={!shareUrl}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-200" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Share Room</span>
        </>
      )}
    </button>
  );
}
