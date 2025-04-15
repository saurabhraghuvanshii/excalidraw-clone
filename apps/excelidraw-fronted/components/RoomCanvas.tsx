"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { getToken } from "@/utils/auth";

export function RoomCanvas({ roomId }: { roomId: string }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        let wsUrl = `${WS_URL}?`;

        if (token) {
            wsUrl += `token=${token}`;
        } else {
            // Connect as guest
            wsUrl += `guest=true`;
            // Guest mode - show limited functionality
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setSocket(ws);
            const data = JSON.stringify({
                type: "join_room",
                roomId
            });
            ws.send(data);
        };

        ws.onerror = (error) => {
            setError('Failed to connect to the server');
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [roomId]);


    if (error) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Error</h2>
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => window.location.href = '/signin'}
                        className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (!socket) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Connecting to server...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-screen h-screen bg-gray-900">
            <div className="absolute top-4 right-4 flex gap-2">
                <div className="bg-gray-800 text-white px-4 py-2 rounded-lg">
                    Room ID: {roomId}
                </div>
            </div>
            <Canvas roomId={roomId} socket={socket as WebSocket} />
        </div>
    );
}
