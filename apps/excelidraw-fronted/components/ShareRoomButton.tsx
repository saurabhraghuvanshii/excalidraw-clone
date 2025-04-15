"use client"
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/utils/auth";
import { Share2, Check } from "lucide-react";

export function ShareRoomButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(`${window.location.origin}/canvas/${roomId}`);
  }, [roomId]);

  const handleShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isAuthenticated()) return null;

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
      disabled={!shareUrl}
    >
      {copied ? (
        <>
          <Check className="h-5 w-5 text-green-500" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-5 w-5" />
          <span>Share Room</span>
        </>
      )}
    </button>
  );
}
