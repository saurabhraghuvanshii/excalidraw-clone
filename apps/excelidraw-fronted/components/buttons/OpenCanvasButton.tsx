"use client";
import { Button } from "@repo/ui/button";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export function OpenCanvasButton() {
  const router = useRouter();
  const handleOpen = () => {
    const roomId = Math.random().toString(36).substring(2, 15);
    router.push(`/canvas/${roomId}`);
  };
  return (
    <Button
      onClick={handleOpen}
      className="relative h-12 px-8 overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl transition-all duration-300 ease-in-out hover:scale-105 group"
    >
        <span className="relative z-10 flex items-center">
            Open Canvas
            <Pencil className="ml-2 h-5 w-5 transition-transform group-hover:rotate-12" />
        </span>
    </Button>
  );
}
 