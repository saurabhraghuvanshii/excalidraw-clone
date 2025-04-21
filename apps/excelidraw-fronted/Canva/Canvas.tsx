import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Tool } from "./draw/CanvasEngine";
import { Game } from "./draw/Game";
import ZoomControl from "./canvaFuncationality/ZoomControl";
import { EraserCursor } from "./canvaFuncationality/eraser";
import { isAuthenticated } from "@/utils/auth";
import { PanHandler } from "./canvaFuncationality/PanHandler";

let ResizeObserverImpl: typeof ResizeObserver;
if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
  ResizeObserverImpl = window.ResizeObserver;
} else {
  // @ts-ignore
  ResizeObserverImpl = require('resize-observer-polyfill');
}

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
        width: 0,
        height: 0
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
            g.onShapeDrawn = () => {
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

    // Responsive canvas using ResizeObserver
    useEffect(() => {
        const parent = canvasRef.current?.parentElement;
        if (!parent) return;
        const observer = new ResizeObserverImpl((entries: ResizeObserverEntry[]) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
                if (canvasRef.current) {
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;
                }
                if (gameRef.current) {
                    gameRef.current.handleResize();
                }
            }
        });
        observer.observe(parent);
        // Set initial size
        if (parent && canvasRef.current) {
            const { width, height } = parent.getBoundingClientRect();
            setDimensions({ width, height });
            canvasRef.current.width = width;
            canvasRef.current.height = height;
        }
        return () => {
            observer.disconnect();
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
                const selected = game.engine.shapes.find((s) => s.id && s.id === game.engine.selectedShapeId);
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
                const m = metrics as TextMetrics & {
                    actualBoundingBoxAscent?: number;
                    actualBoundingBoxDescent?: number;
                };
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

    const textEditBox = editingTextId && editingTextBox && (
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
    );

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
            <div className="relative min-h-screen flex items-center justify-center bg-gray-900 text-white">
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
        <div className="fixed inset-0 min-h-screen w-screen bg-black no-scroll">
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
                className="absolute top-0 left-0 w-full h-full bg-black"
                onMouseEnter={() => setIsCanvasHovered(true)}
                onMouseLeave={() => setIsCanvasHovered(false)}
                style={{ cursor: getCursorForTool(selectedTool) }}
            />
            {textEditBox}
            <div className="fixed w-full flex justify-center items-center pb-2 z-50`">
               <Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
            </div>
            <div className="fixed z-10 bottom-4 left-4 rounded-lg flex items-center bg-gray-800 shadow-lg">
                <ZoomControl scale={scale} setScale={setScale} /> 
            </div>
            {selectedTool === "eraser" && isCanvasHovered && <EraserCursor size={eraserSize} isActive />}
        </div>
    );
}

function Topbar({ selectedTool, setSelectedTool }: {
    selectedTool: Tool,
    setSelectedTool: (s: Tool) => void
}) {
    return (
        <div className="fixed flex justify-center items-center mt-4 pb-2 z-50 rounded-lg">
            <div className="flex gap-1  p-2 rounded-lg pointer-events-auto shadow-lg border border-gray-800 cursor-pointer">
                <IconButton
                    onClick={() => setSelectedTool("select")}
                    activated={selectedTool === "select"}
                    image="/selector.svg"
                    title="Select"
                />
                <IconButton
                    onClick={() => setSelectedTool("freehand")}
                    activated={selectedTool === "freehand"}
                    image="/pencil.svg"
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
                    image="/rectangle.svg"
                    title="Rectangle"
                />
                <IconButton
                    onClick={() => setSelectedTool("circleOrOval")}
                    activated={selectedTool === "circleOrOval"}
                    image="/circle.svg"
                    title="Circle"
                />
                <IconButton
                    onClick={() => setSelectedTool("text")}
                    activated={selectedTool === "text"}
                    image="/Text.svg"
                    title="Text"
                />
                <IconButton
                    onClick={() => setSelectedTool("eraser")}
                    activated={selectedTool === "eraser"}
                    image="/Erarser.svg"
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
        case "circleOrOval":
            return "crosshair";
        case "text":
            return "text";
        default:
            return "default";
    }
}
