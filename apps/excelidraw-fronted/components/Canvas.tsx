import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser } from "lucide-react";
import { EraserCursor } from "./eraser";
import { Game } from "@/draw/Game";
import ZoomControl from "./ZoomControl";
import { isAuthenticated } from "@/utils/auth";

export type Tool = "circle" | "rect" | "pencil" | "eraser";

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
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [eraserSize, setEraserSize] = useState(5);
    const canEdit = !readOnly;

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

    // Handle wheel zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                // Calculate zoom center point (mouse position)
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                
                // Update scale
                setScale(prevScale => {
                    const newScale = e.deltaY < 0 
                        ? Math.min(prevScale * 1.1, 5) 
                        : Math.max(prevScale * 0.9, 0.2);
                    return newScale;
                });
            }
        };
        
        canvasRef.current?.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            canvasRef.current?.removeEventListener('wheel', handleWheel);
        };
    }, []);

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

    // Setup canvas panning with space bar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                document.body.style.cursor = 'grab';
                setIsDragging(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                document.body.style.cursor = 'default';
                setIsDragging(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Handle mouse events for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDragging) {
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            document.body.style.cursor = 'grabbing';
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            document.body.style.cursor = 'grab';
        }
    };
    
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
        <div 
            className="h-screen overflow-hidden relative bg-black"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <canvas 
                ref={canvasRef} 
                width={dimensions.width} 
                height={dimensions.height}
                className="absolute top-0 left-0"
            />
            {selectedTool === "eraser" && <EraserCursor size={eraserSize} isActive />}
            <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
            <ZoomControl scale={scale} setScale={setScale} />
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
                <IconButton
                    onClick={() => setSelectedTool("eraser")}
                    activated={selectedTool === "eraser"}
                    icon={<Eraser />}
                />
            </div>
        </div>
    );
}
