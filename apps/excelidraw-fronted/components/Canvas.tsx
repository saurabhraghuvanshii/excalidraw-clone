import { useEffect, useRef, useState } from "react";
import { IconButton } from "./ui/IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser } from "lucide-react";
import { EraserCursor } from "./Shapes/eraser";
import { Game, Tool } from "@/draw/Game";
import ZoomControl from "./Shapes/ZoomControl";
import { isAuthenticated } from "@/utils/auth";
import { PanHandler } from "./Shapes/PanHandler";

export function Canvas({
    roomId,
    socket,
    readOnly = false
}: {
    socket: WebSocket;
    roomId: string;
    readOnly?: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<Game | null>(null);
    const [selectedTool, setSelectedTool] = useState<Tool>("circle");
    const [scale, setScale] = useState<number>(1);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [eraserSize, setEraserSize] = useState(2);
    const canEdit = !readOnly;

    // Initialize game once
    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            const g = new Game(canvasRef.current, roomId, socket, readOnly);
            gameRef.current = g;
            return () => {
                g.destroy();
                gameRef.current = null;
            };
        }
    }, [roomId, socket, readOnly]);

    // Update readonly mode if it changes
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setReadOnly(readOnly);
        }
    }, [readOnly]);

    // Handle tool selection
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setTool(selectedTool);
        }
    }, [selectedTool]);

    // Handle scale changes
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setScale(scale);
        }
    }, [scale]);

    // Handle offset changes
    useEffect(() => {
        if (gameRef.current) {
            gameRef.current.setOffset(offset.x, offset.y);
        }
    }, [offset]);

    // Handle wheel zoom (ctrl/cmd + wheel)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setScale(prevScale => {
                    const newScale = e.deltaY < 0
                        ? Math.min(prevScale * 1.1, 5)
                        : Math.max(prevScale * 0.9, 0.2);
                    return newScale;
                });
            }
        };
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Set up window resize handling with debounce
    useEffect(() => {
        let resizeTimer: number | null = null;
        function handleResize() {
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            setDimensions({
                width: newWidth,
                height: newHeight
            });
            if (canvasRef.current) {
                canvasRef.current.width = newWidth;
                canvasRef.current.height = newHeight;
            }
            resizeTimer = window.setTimeout(() => {
                if (gameRef.current) {
                    gameRef.current.handleResize();
                }
            }, 100);
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimer) {
                window.clearTimeout(resizeTimer);
            }
        };
    }, []);

    // Handle eraser size with keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedTool === 'eraser') {
                if (e.key === '[') {
                    setEraserSize(prev => Math.max(prev - 1, 2));
                } else if (e.key === ']') {
                    setEraserSize(prev => Math.min(prev + 1, 20));
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTool]);

    if (canEdit && !isAuthenticated()) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                    <p className="text-red-500">You must be signed in to edit the canvas.</p>
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

    return (
        <div className="h-screen overflow-hidden relative bg-black">
            <PanHandler
                canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
                offset={offset}
                setOffset={setOffset}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
            />
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="absolute top-0 left-0"
                style={{ cursor: getCursorForTool(selectedTool) }}
            />
            {selectedTool === "eraser" && <EraserCursor size={eraserSize} isActive />}
            <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
            <ZoomControl scale={scale} setScale={setScale} />
        </div>
    );
}

function Topbar({ selectedTool, setSelectedTool }: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-10 flex justify-center w-full pointer-events-none">
            <div className="flex gap-1 bg-gray-800 p-1 rounded-md pointer-events-auto shadow-md border border-gray-700 cursor-pointer">
                <IconButton
                    onClick={() => setSelectedTool("freehand")}
                    activated={selectedTool === "freehand"}
                    icon={<Pencil size={18} />}
                />
                <IconButton
                    onClick={() => setSelectedTool("line")}
                    activated={selectedTool === "line"}
                    image="/line.svg"
                />
                <IconButton
                    onClick={() => setSelectedTool("rect")}
                    activated={selectedTool === "rect"}
                    icon={<RectangleHorizontalIcon size={18} />}
                />
                <IconButton
                    onClick={() => setSelectedTool("circle")}
                    activated={selectedTool === "circle"}
                    icon={<Circle size={18} />}
                />
                <IconButton
                    onClick={() => setSelectedTool("eraser")}
                    activated={selectedTool === "eraser"}
                    icon={<Eraser size={18} />}
                />
            </div>
        </div>
    );
}

function getCursorForTool(tool: Tool) {
    switch (tool) {
        case "freehand":
        case "line":
        case "rect":
        case "circle":
            return "crosshair";
        default:
            return "default";
    }
}
