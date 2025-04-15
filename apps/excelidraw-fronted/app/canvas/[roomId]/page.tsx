"use client";
import { useState, useEffect } from "react";
import { RoomCanvas } from "@/components/RoomCanvas";
import { isAuthenticated } from "@/utils/auth";
import { ShareRoomButton } from "@/components/ShareRoomButton";

export default function CanvasPage({ params }: { params: { roomId: string } }) {
    const { roomId } = params;
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        setIsAuth(isAuthenticated());
    }, []);

    return (
        <>
            <div className="absolute top-4 right-4 z-20">
                <ShareRoomButton roomId={roomId} />
            </div>
            <RoomCanvas roomId={roomId} readOnly={!isAuth} />
        </>
    );
}

