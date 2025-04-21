"use client";

import { WS_URL } from "@/config";
import { useEffect, useState, useCallback } from "react";
import { Canvas } from "./Canvas";
import { getToken } from "@/utils/auth";

export function RoomCanvas({ roomId, readOnly = false }: { roomId: string; readOnly?: boolean }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const connectToWebSocket = useCallback(() => {
    try {
      const token = getToken();
      let wsUrl = `${WS_URL}?`;
      
      // Append authentication token or connect as guest
      if (token) {
        wsUrl += `token=${token}`;
      } else {
        wsUrl += `guest=true`;
      }
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setSocket(ws);
        ws.send(JSON.stringify({
          type: "join_room",
          roomId
        }));
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Failed to connect to the server');
      };
      
      return ws;
    } catch (err) {
      console.error("WebSocket connection error:", err);
      setError('Failed to establish connection');
      return null;
    }
  }, [roomId]);
  
  useEffect(() => {
    const ws = connectToWebSocket();
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [connectToWebSocket]);
  
  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gray-900 text-white">
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
      <div className="relative min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading scene...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen flex-auto w-full bg-black">
      <Canvas roomId={roomId} socket={socket} readOnly={readOnly} />
    </div>
  );
}
