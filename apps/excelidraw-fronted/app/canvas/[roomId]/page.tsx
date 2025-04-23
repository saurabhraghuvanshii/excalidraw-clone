"use client";
import { useState, useEffect, use } from "react";
import { RoomCanvas } from "@/Canva/RoomCanvas";
import { isAuthenticated } from "@/utils/auth";
import { ShareRoomButton } from "@/components/buttons/ShareRoomButton";
import Link from "next/link";
import { Home } from "lucide-react";

interface RoomParams {
  roomId: string;
}

export default function CanvasPage({ params }: { params: Promise<RoomParams> }) {
  const { roomId } = use(params);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  return (
    <div className="relative h-screen w-full no-scroll">
      <div className="absolute top-4 left-4 z-20">
        <Link href="/">
          <button className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 shadow-md transition-colors">
            <Home className="w-6 h-6 text-white" />
          </button>
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-20 hidden sm:block">
        <ShareRoomButton roomId={roomId} />
      </div>
      <RoomCanvas roomId={roomId} readOnly={!isAuth} />
    </div>
  );
}
