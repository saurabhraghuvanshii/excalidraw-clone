"use client";
import { useState, useEffect, use } from "react";
import { RoomCanvas } from "@/components/RoomCanvas";
import { isAuthenticated } from "@/utils/auth";
import { ShareRoomButton } from "@/components/ShareRoomButton";

interface RoomParams {
  roomId: string;
}

export default function CanvasPage({ params }: { params: Promise<RoomParams> }) {
  
  const { roomId } = use(params);
  
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuth(isAuthenticated());
    };
    
    checkAuth();
  }, []);

  return (
    <main className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-20">
        <ShareRoomButton roomId={roomId} />
      </div>
      <RoomCanvas roomId={roomId} readOnly={!isAuth} />
    </main>
  );
}
