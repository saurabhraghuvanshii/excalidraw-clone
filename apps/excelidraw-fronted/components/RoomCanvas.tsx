"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
import { Share2, Check } from "lucide-react";

export function RoomCanvas({roomId}: {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No authentication token found. Please sign in.');
            return;
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`);

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

    const handleShare = () => {
        const url = `${window.location.origin}/canvas/${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            setError('Failed to copy URL to clipboard');
        });
    };
   
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
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
            </div>
            <Canvas roomId={roomId} socket={socket} />
        </div>
    );
}
