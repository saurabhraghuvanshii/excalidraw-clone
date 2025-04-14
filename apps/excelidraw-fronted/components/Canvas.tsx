import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";

export type Tool = "circle" | "rect" | "pencil";

export function Canvas({
    roomId,
    socket
}: {
    socket: WebSocket;
    roomId: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Initialize game once
    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            gameRef.current = g;
            
            return () => {
                g.destroy();
                gameRef.current = null;
            };
        }
    }, [roomId, socket]);

    // Handle tool selection
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setTool(selectedTool);
        }
    }, [selectedTool]);

    // Set up window resize handling with debounce
    useEffect(() => {
        let resizeTimer: number | null = null;
        
        function handleResize() {
            // Clear previous timer
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
            
            // Update dimensions state immediately
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            
            setDimensions({
                width: newWidth,
                height: newHeight
            });
            
            // Update canvas dimensions
            if (canvasRef.current) {
                canvasRef.current.width = newWidth;
                canvasRef.current.height = newHeight;
            }
            
            // Debounce the actual redraw to avoid multiple redraws during resize
            resizeTimer = window.setTimeout(() => {
                if (gameRef.current) {
                    gameRef.current.handleResize();
                }
            }, 100);
        }

        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
        };
    }, []);

    return (
        <div className="h-screen overflow-hidden relative bg-black">
            <canvas 
                ref={canvasRef} 
                width={dimensions.width} 
                height={dimensions.height}
                className="absolute top-0 left-0"
            />
            <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
        </div>
    );
}

function Topbar({selectedTool, setSelectedTool}: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void 
}) {
    return (
        <div className="fixed top-2 left-2 z-10">
            <div className="flex gap-2 bg-gray-800 p-2 rounded-md">
                <IconButton
                    onClick={() => setSelectedTool("pencil")}
                    activated={selectedTool === "pencil"}
                    icon={<Pencil />}
                />
                <IconButton 
                    onClick={() => setSelectedTool("rect")} 
                    activated={selectedTool === "rect"} 
                    icon={<RectangleHorizontalIcon />} 
                />
                <IconButton 
                    onClick={() => setSelectedTool("circle")} 
                    activated={selectedTool === "circle"} 
                    icon={<Circle />}
                />
            </div>
        </div>
    );
}
