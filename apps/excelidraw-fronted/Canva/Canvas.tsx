import { useEffect, useRef, useState } from "react";
import { IconButton } from "../components/ui/IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, Eraser, MousePointer2, LetterText } from "lucide-react";
import { Tool } from "@/Canva/draw/CanvasEngine";
import { Game } from "@/Canva/draw/Game";
import ZoomControl from "./canvaFuncationality/ZoomControl";
import { EraserCursor } from "./canvaFuncationality/eraser";
import { isAuthenticated } from "@/utils/auth";
import { PanHandler } from "./canvaFuncationality/PanHandler";

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
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [scale, setScale] = useState<number>(1);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [eraserSize, setEraserSize] = useState(2);
    const [isCanvasHovered, setIsCanvasHovered] = useState(false);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [editingTextValue, setEditingTextValue] = useState<string>("");
    const [editingTextBox, setEditingTextBox] = useState<{
        x: number,
        y: number,
        width: number,
        height: number,
        fontSize?: number,
        fontFamily?: string,
        textAlign?: string,
        fontStyle?: string,
        color?: string,
    } | null>(null);
    const canEdit = !readOnly;

    // Initialize game once
    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            const g = new Game(canvasRef.current, roomId, socket, readOnly);
            // Set up callback to switch to select tool after drawing
            g.onShapeDrawn = (newShapeId: string) => {
                setSelectedTool("select");
            };
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

    // Cursor logic: change to move or resize if hovering a shape or handle
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        function handleMouseMove(e: MouseEvent) {
            const game = gameRef.current;
            if (!game) return;
            const c = canvasRef.current;
            if (!c) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            let cursor = getCursorForTool(selectedTool);
            // Check for handle hover if a shape is selected
            if (game.engine.selectedShapeId) {
                const selected = game.engine.shapes.find((s: any) => s.id === game.engine.selectedShapeId);
                if (selected) {
                    const handleIdx = game.engine.getHandleAtPoint(selected, x, y);
                    if (handleIdx !== null) {
                        cursor = game.getHandleCursor(handleIdx);
                        c.style.cursor = cursor;
                        return;
                    }
                }
            }
            // Otherwise, check for shape hover
            const shape = game.engine.findShapeUnderPoint
                ? game.engine.findShapeUnderPoint(x, y)
                : null;
            if (shape) {
                c.style.cursor = "move";
            } else {
                c.style.cursor = cursor;
            }
        }
        canvas.addEventListener("mousemove", handleMouseMove);
        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [offset, scale, selectedTool]);

    // Click to select shape (no drag)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        function handleClick(e: MouseEvent) {
            if (!gameRef.current) return;
            const c = canvasRef.current;
            if (!c) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            const shape = gameRef.current.engine.findShapeUnderPoint
                ? gameRef.current.engine.findShapeUnderPoint(x, y)
                : null;
            if (shape) {
                gameRef.current.engine.selectedShapeId = shape.id || null;
                gameRef.current.engine.clearCanvas();
            }
        }
        canvas.addEventListener("click", handleClick);
        return () => {
            canvas.removeEventListener("click", handleClick);
        };
    }, [offset, scale]);

    // Text tool: click to create text box and edit
    useEffect(() => {
        if (selectedTool !== "text" || !canEdit) return;
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        function handleTextClick(e: MouseEvent) {
            const c = canvasRef.current;
            if (!c || !gameRef.current) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            // Measure text size for bounding box
            const ctx = c.getContext("2d")!;
            const fontSize = 24;
            const fontFamily = "Nunito";
            ctx.font = `${fontSize}px ${fontFamily}`;
            const metrics = ctx.measureText("");
            let textHeight;
            if ('fontBoundingBoxAscent' in metrics && 'fontBoundingBoxDescent' in metrics) {
                textHeight = (metrics.fontBoundingBoxAscent || 0) + (metrics.fontBoundingBoxDescent || 0);
            } else if ('actualBoundingBoxAscent' in metrics && 'actualBoundingBoxDescent' in metrics) {
                const m = metrics as any;
                textHeight = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
            } else {
                textHeight = fontSize;
            }
            // Add a new text shape with measured size
            const shape = {
                type: "text" as const,
                x,
                y,
                width: 120,
                height: textHeight,
                text: "",
                fontSize,
                fontFamily,
                color: "#fff"
            };
            gameRef.current.engine.addShape(shape);
            const addedShape = gameRef.current.engine.shapes[gameRef.current.engine.shapes.length - 1];
            gameRef.current.engine.selectedShapeId = addedShape.id ?? null;
            setEditingTextId(addedShape.id ?? null);
            setEditingTextValue("");
            setEditingTextBox({ x, y, width: 120, height: textHeight, fontSize, fontFamily, color: "#fff" });
            setSelectedTool("select");
        }
        canvas.addEventListener("click", handleTextClick);
        return () => {
            canvas.removeEventListener("click", handleTextClick);
        };
    }, [selectedTool, offset, scale, canEdit]);

    // Double-click to edit text again
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        function handleDoubleClick(e: MouseEvent) {
            const c = canvasRef.current;
            if (!c || !gameRef.current) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            const found = gameRef.current.engine.findShapeUnderPoint
                ? gameRef.current.engine.findShapeUnderPoint(x, y)
                : null;
            if (found && found.type === "text") {
                setEditingTextId(found.id ?? null);
                setEditingTextValue(found.text);
                setEditingTextBox({ x: found.x, y: found.y, width: found.width, height: found.height, fontSize: found.fontSize, fontFamily: found.fontFamily, color: found.color });
            }
        }
        canvas.addEventListener("dblclick", handleDoubleClick);
        return () => {
            canvas.removeEventListener("dblclick", handleDoubleClick);
        };
    }, [offset, scale]);

    // Inline text input rendering (textarea for editing)
    
    {editingTextId && editingTextBox && (
        <div
            style={{
                position: "absolute",
                width: Math.max(editingTextBox.width * scale, 100),
                minHeight: editingTextBox.height * scale,
                zIndex: 20,
                pointerEvents: "auto"
            }}
        >
            <textarea
                value={editingTextValue}
                autoFocus
                style={{
                    position: "absolute",
                    left: editingTextBox.x * scale + offset.x,
                    top: editingTextBox.y * scale + offset.y,
                    width: editingTextBox.width * scale,
                    height: editingTextBox.height * scale,
                    fontSize: ((editingTextBox.fontSize || 24) * scale) + "px",
                    fontFamily: editingTextBox.fontFamily || "Nunito",
                    color: editingTextBox.color || "#fff",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    zIndex: 20,
                    padding: "2px",
                    outline: "none",
                    resize: "none",
                    minWidth: "40px",
                    minHeight: "24px",
                    boxSizing: "border-box",
                    caretColor: editingTextBox.color || "#fff",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)"
                }}
                onChange={e => {
                    setEditingTextValue(e.target.value);
                    // Auto-resize the textarea width and height to fit content
                    e.target.style.width = 'auto';
                    e.target.style.width = e.target.scrollWidth + 'px';
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={() => {
                    if (!gameRef.current) return;
                    const found = gameRef.current.engine.shapes.find(s => s.id === editingTextId);
                    if (found && found.type === "text") {
                        found.text = editingTextValue;
                        gameRef.current.engine.updateShape(found);
                        if (socket) {
                            socket.send(
                                JSON.stringify({
                                    type: "chat",
                                    message: JSON.stringify({ shape: found }),
                                    roomId
                                })
                            );
                        }
                    }
                    setEditingTextId(null);
                    setEditingTextValue("");
                    setEditingTextBox(null);
                }}
                onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        // Insert newline at cursor position
                        const textarea = e.target as HTMLTextAreaElement;
                        const cursorPos = textarea.selectionStart;
                        const textBefore = editingTextValue.substring(0, cursorPos);
                        const textAfter = editingTextValue.substring(cursorPos);
                        setEditingTextValue(textBefore + '\n' + textAfter);
                        // Move cursor after the newline
                        setTimeout(() => {
                            textarea.selectionStart = cursorPos + 1;
                            textarea.selectionEnd = cursorPos + 1;
                        }, 0);
                    }
                }}
            />
        </div>
    )}

    useEffect(() => {
        if (selectedTool !== "text" || !canEdit) return;
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        
        function handleTextClick(e: MouseEvent) {
            const c = canvasRef.current;
            if (!c || !gameRef.current) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            
            // Create a new text shape
            const shape = {
                type: "text" as const,
                x,
                y,
                width: 100,
                height: 24,
                text: "",
                fontSize: 24,
                fontFamily: "Nunito",
                fontStyle: "normal",
                textAlign: "left",
                color: "#fff"
            };
            
            gameRef.current.engine.addShape(shape);
            const addedShape = gameRef.current.engine.shapes[gameRef.current.engine.shapes.length - 1];
            gameRef.current.engine.selectedShapeId = addedShape.id ?? null;
            
            setEditingTextId(addedShape.id ?? null);
            setEditingTextValue("");
            setEditingTextBox({
                x, 
                y, 
                width: 100, 
                height: 24, 
                fontSize: 24, 
                fontFamily: "Nunito",
                fontStyle: "normal",
                textAlign: "left",
                color: "#fff"
            });
            
            setSelectedTool("select");
        }
        
        canvas.addEventListener("click", handleTextClick);
        return () => {
            canvas.removeEventListener("click", handleTextClick);
        };
    }, [selectedTool, offset, scale, canEdit]);
    
    // Update the double-click handler for text editing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameRef.current) return;
        
        function handleDoubleClick(e: MouseEvent) {
            const c = canvasRef.current;
            if (!c || !gameRef.current) return;
            const rect = c.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;
            
            const found = gameRef.current.engine.findShapeUnderPoint
                ? gameRef.current.engine.findShapeUnderPoint(x, y)
                : null;
                
            if (found && found.type === "text") {
                setEditingTextId(found.id ?? null);
                setEditingTextValue(found.text);
                setEditingTextBox({
                    x: found.x,
                    y: found.y,
                    width: found.width,
                    height: found.height,
                    fontSize: found.fontSize,
                    fontFamily: found.fontFamily,
                    fontStyle: found.fontStyle,
                    textAlign: found.textAlign,
                    color: found.color
                });
            }
        }
        
        canvas.addEventListener("dblclick", handleDoubleClick);
        return () => {
            canvas.removeEventListener("dblclick", handleDoubleClick);
        };
    }, [offset, scale]);
    
    // Handle clicks outside the text area to finish editing
    useEffect(() => {
        if (!editingTextId) return;
        
        const handleClickOutside = (e: MouseEvent) => {
            // Check if click is outside the text area
            const textareaEl = document.querySelector('textarea');
            if (textareaEl && !textareaEl.contains(e.target as Node)) {
                textareaEl.blur();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingTextId]);

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
                onMouseEnter={() => setIsCanvasHovered(true)}
                onMouseLeave={() => setIsCanvasHovered(false)}
            />
            {selectedTool === "eraser" && isCanvasHovered && <EraserCursor size={eraserSize} isActive />}
            {editingTextId && editingTextBox && (
            <textarea
                value={editingTextValue}
                autoFocus
                style={{
                    position: "absolute",
                    left: editingTextBox.x * scale + offset.x,
                    top: editingTextBox.y * scale + offset.y,
                    width: editingTextBox.width * scale,
                    height: editingTextBox.height * scale,
                    fontSize: ((editingTextBox.fontSize || 24) * scale) + "px",
                    fontFamily: editingTextBox.fontFamily || "Nunito",
                    color: editingTextBox.color || "#fff",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    zIndex: 20,
                    padding: "2px",
                    outline: "none",
                    resize: "none",
                    minWidth: "40px",
                    minHeight: "24px",
                    boxSizing: "border-box",
                    caretColor: editingTextBox.color || "#fff",
                    overflow: "hidden",
                    whiteSpace: "nowrap"
                }}
                onChange={e => {
                    setEditingTextValue(e.target.value);
                    // Auto-resize the textarea width and height to fit content
                    e.target.style.width = 'auto';
                    e.target.style.width = e.target.scrollWidth + 'px';
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onBlur={() => {
                    if (!gameRef.current) return;
                    const found = gameRef.current.engine.shapes.find(s => s.id === editingTextId);
                    if (found && found.type === "text") {
                        found.text = editingTextValue;
                        gameRef.current.engine.updateShape(found);
                        if (socket) {
                            socket.send(
                                JSON.stringify({
                                    type: "chat",
                                    message: JSON.stringify({ shape: found }),
                                    roomId
                                })
                            );
                        }
                    }
                    setEditingTextId(null);
                    setEditingTextValue("");
                    setEditingTextBox(null);
                }}
                onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        // Insert newline at cursor position
                        const textarea = e.target as HTMLTextAreaElement;
                        const cursorPos = textarea.selectionStart;
                        const textBefore = editingTextValue.substring(0, cursorPos);
                        const textAfter = editingTextValue.substring(cursorPos);
                        setEditingTextValue(textBefore + '\n' + textAfter);
                        // Move cursor after the newline
                        setTimeout(() => {
                            textarea.selectionStart = cursorPos + 1;
                            textarea.selectionEnd = cursorPos + 1;
                        }, 0);
                    }
                }}
            />
        )}
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
                    onClick={() => setSelectedTool("select")}
                    activated={selectedTool === "select"}
                    icon={<MousePointer2 size={18} />}
                    title="Select"
                />
                <IconButton
                    onClick={() => setSelectedTool("freehand")}
                    activated={selectedTool === "freehand"}
                    icon={<Pencil size={18} />}
                    title="Freehand"
                />
                <IconButton
                    onClick={() => setSelectedTool("line")}
                    activated={selectedTool === "line"}
                    image="/line.svg"
                    title="Line"
                />
                <IconButton
                    onClick={() => setSelectedTool("rect")}
                    activated={selectedTool === "rect"}
                    icon={<RectangleHorizontalIcon size={18} />}
                    title="Rectangle"
                />
                <IconButton
                    onClick={() => setSelectedTool("circle")}
                    activated={selectedTool === "circle"}
                    icon={<Circle size={18} />}
                    title="Circle"
                />
                <IconButton
                    onClick={() => setSelectedTool("text")}
                    activated={selectedTool === "text"}
                    icon={<LetterText size={18} />}
                    title="Text"
                />
                <IconButton
                    onClick={() => setSelectedTool("eraser")}
                    activated={selectedTool === "eraser"}
                    icon={<Eraser size={18} />}
                    title="Eraser"
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
        case "text":
            return "text";
        default:
            return "default";
    }
}
