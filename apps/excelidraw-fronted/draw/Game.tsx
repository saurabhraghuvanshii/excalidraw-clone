import { getExistingShapes } from "./http";
import { drawRectangle, isPointInRectangle, resizeRectangle } from './canavashape/Rectangle';
import { drawCircle, isPointInCircle, resizeCircle } from './canavashape/Circle';
import { drawLine, isPointNearLine, resizeLine } from './canavashape/Line';
import { drawFreehand, isPointNearFreehand, resizeFreehand } from './canavashape/Freehand';

export type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    id?: string;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    id?: string;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    id?: string;
} | {
    type: "freehand";
    points: { x: number; y: number }[];
    id?: string;
};

export type Tool = "select" | "freehand" | "line" | "rect" | "circle" | "eraser";

export class Game {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public existingShapes: Shape[] = [];
    public roomId: string;
    public clicked: boolean;
    public startX = 0;
    public startY = 0;
    public selectedTool: Tool = "circle";
    public isInitialized = false;
    public scale = 1;
    public offsetX = 0;
    public offsetY = 0;
    public eraserActive = false;
    public selectedShapeId: string | null = null;
    public readOnly: boolean = false;
    public freehandDrawing: boolean = false;
    public freehandPoints: { x: number; y: number }[] = [];
    public draggingShapeId: string | null = null;
    public dragOffset: { x: number; y: number } | null = null;
    public resizeHandle: number | null = null; // 0-7 for 8 handles
    public handleSize: number = 8;

    socket: WebSocket;

    // Add a callback to notify when a shape is drawn
    public onShapeDrawn?: (newShapeId: string) => void;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, readOnly = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.readOnly = readOnly;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    setScale(scale: number) {
        this.scale = scale;
        this.clearCanvas();
    }

    setOffset(x: number, y: number) {
        this.offsetX = x;
        this.offsetY = y;
        this.clearCanvas();
    }

    setReadOnly(readOnly: boolean) {
        this.readOnly = readOnly;
    }

    async init() {
        try {
            this.existingShapes = await getExistingShapes(this.roomId);
            this.isInitialized = true;
            this.clearCanvas();
        } catch (error) {
            console.error("Failed to initialize game:", error);
        }
    }

    handleResize() {
        // Immediately redraw everything when canvas is resized
        if (this.isInitialized) {
            // Use setTimeout to ensure this runs after the canvas dimensions have been updated
            setTimeout(() => {
                this.clearCanvas();
            }, 0);
        }
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "chat") {
                    const parsedData = JSON.parse(message.message);

                    if (parsedData.shape) {
                        // Only add shape if it doesn't already exist (by id)
                        const shapeId = parsedData.shape.id;
                        if (shapeId && !this.existingShapes.some(s => s.id === shapeId)) {
                            this.existingShapes.push(parsedData.shape);
                            this.clearCanvas();
                        }
                    } else if (parsedData.eraseId) {
                        // Handle eraser action
                        this.existingShapes = this.existingShapes.filter(
                            shape => shape.id !== parsedData.eraseId
                        );
                        this.clearCanvas();
                    }
                }
            } catch (error) {
                console.error("Error handling socket message:", error);
            }
        };
    }

    clearCanvas() {
        // Ensure the canvas is correctly sized before drawing
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear and set black background
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, width, height);

        // Apply scale and translation transformations
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw all existing shapes
        this.drawShapes();

        // Draw selection frame and handles for selected shape
        if (this.selectedShapeId) {
            const selected = this.existingShapes.find(s => s.id === this.selectedShapeId);
            if (selected) {
                this.drawSelectionFrameAndHandles(selected);
            }
        }

        // Restore original transform
        this.ctx.restore();
    }

    drawShapes() {
        if (!this.existingShapes || this.existingShapes.length === 0) return;
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.existingShapes.forEach((shape) => {
            if (shape.type === "rect") {
                drawRectangle(this.ctx, shape);
            } else if (shape.type === "circle") {
                drawCircle(this.ctx, shape);
            } else if (shape.type === "line") {
                drawLine(this.ctx, shape);
            } else if (shape.type === "freehand") {
                drawFreehand(this.ctx, shape);
            }
        });
    }

    // Generate a unique ID for shapes
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    private eraseAtPosition(clientX: number, clientY: number) {
        const shapeToErase = this.findShapeUnderPoint(clientX, clientY);

        if (shapeToErase && shapeToErase.id) {
            // Remove shape locally
            this.existingShapes = this.existingShapes.filter(shape => shape.id !== shapeToErase.id);

            const eraseMessage = JSON.stringify({
                eraseId: shapeToErase.id
            });
            // Send erase action to other clients
            this.socket.send(JSON.stringify({
                type: "chat",
                message: eraseMessage,
                roomId: this.roomId
            }));

            // Redraw canvas
            this.clearCanvas();
        }
    }

    // Check if a point is inside a rectangle
    private isPointInRect(x: number, y: number, rect: Shape & { type: "rect" }): boolean {
        return isPointInRectangle(x, y, rect, 10);
    }

    // Check if a point is inside a circle
    private isPointInCircle(x: number, y: number, circle: Shape & { type: "circle" }): boolean {
        return isPointInCircle(x, y, circle);
    }

    // Check if a point is near a pencil line
    private isPointNearPencilLine(x: number, y: number, pencil: Shape & { type: "line" }): boolean {
        return isPointNearLine(x, y, pencil);
    }

    public findShapeUnderPoint(x: number, y: number): Shape | null {
        // Adjust for scale and offset
        const adjustedX = (x - this.offsetX) / this.scale;
        const adjustedY = (y - this.offsetY) / this.scale;
        const eraserBuffer = 10; // Always use a 10px buffer for eraser

        // Check from the newest shape (top) to the oldest (bottom)
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];

            if (shape.type === "rect" && isPointInRectangle(adjustedX, adjustedY, shape, eraserBuffer)) {
                return shape;
            } else if (shape.type === "circle" && this.isPointInCircle(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "line" && this.isPointNearPencilLine(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "freehand" && isPointNearFreehand(adjustedX, adjustedY, shape)) {
                return shape;
            }
        }

        return null;
    }

    drawSelectionFrameAndHandles(shape: Shape) {
        // Do NOT apply translate/scale here; already applied in clearCanvas
        this.ctx.save();
        this.ctx.strokeStyle = "#60A5FA";
        this.ctx.lineWidth = 2;
        let bounds = this.getShapeBounds(shape);
        if (!bounds) return;
        const { x, y, width, height } = bounds;
        // Draw frame
        this.ctx.strokeRect(x, y, width, height);
        // Draw 8 handles (corners + edges)
        const hs = this.handleSize;
        const handles = [
            [x, y], // top-left
            [x + width / 2, y], // top-center
            [x + width, y], // top-right
            [x + width, y + height / 2], // right-center
            [x + width, y + height], // bottom-right
            [x + width / 2, y + height], // bottom-center
            [x, y + height], // bottom-left
            [x, y + height / 2], // left-center
        ];
        this.ctx.fillStyle = "#60A5FA";
        for (let [hx, hy] of handles) {
            this.ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        this.ctx.restore();
    }

    getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } | null {
        if (shape.type === "rect") {
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        } else if (shape.type === "circle") {
            return {
                x: shape.centerX - shape.radius,
                y: shape.centerY - shape.radius,
                width: shape.radius * 2,
                height: shape.radius * 2
            };
        } else if (shape.type === "line") {
            const x = Math.min(shape.startX, shape.endX);
            const y = Math.min(shape.startY, shape.endY);
            const width = Math.abs(shape.endX - shape.startX);
            const height = Math.abs(shape.endY - shape.startY);
            return { x, y, width, height };
        } else if (shape.type === "freehand") {
            const xs = shape.points.map(p => p.x);
            const ys = shape.points.map(p => p.y);
            const x = Math.min(...xs);
            const y = Math.min(...ys);
            const width = Math.max(...xs) - x;
            const height = Math.max(...ys) - y;
            return { x, y, width, height };
        }
        return null;
    }

    // Helper to check if pointer is on a handle
    getHandleAtPoint(shape: Shape, px: number, py: number): number | null {
        const bounds = this.getShapeBounds(shape);
        if (!bounds) return null;
        const { x, y, width, height } = bounds;
        const hs = this.handleSize;
        const handles = [
            [x, y],
            [x + width / 2, y],
            [x + width, y],
            [x + width, y + height / 2],
            [x + width, y + height],
            [x + width / 2, y + height],
            [x, y + height],
            [x, y + height / 2],
        ];
        for (let i = 0; i < handles.length; i++) {
            const [hx, hy] = handles[i];
            if (
                px >= hx - hs / 2 &&
                px <= hx + hs / 2 &&
                py >= hy - hs / 2 &&
                py <= hy + hs / 2
            ) {
                return i;
            }
        }
        return null;
    }

    mouseDownHandler = (e: MouseEvent) => {
        const x = (e.clientX - this.offsetX) / this.scale;
        const y = (e.clientY - this.offsetY) / this.scale;
        if (this.readOnly) return;
        if (this.selectedTool === "eraser") {
            this.eraserActive = true;
            this.eraseAtPosition(e.clientX, e.clientY);
            return;
        }
        // --- RESIZE LOGIC: Check for handle first ---
        if (this.selectedShapeId) {
            const selected = this.existingShapes.find(s => s.id === this.selectedShapeId);
            if (selected) {
                const handleIdx = this.getHandleAtPoint(selected, x, y);
                if (handleIdx !== null) {
                    this.resizeHandle = handleIdx;
                    // Prevent drag/draw when resizing
                    return;
                }
            }
        }
        // Drawing tools always draw, never select
        if (["rect", "circle", "line", "freehand"].includes(this.selectedTool)) {
            this.clicked = true;
            this.startX = x;
            this.startY = y;
            if (this.selectedTool === "freehand") {
                this.freehandDrawing = true;
                this.freehandPoints = [{ x, y }];
            }
            return;
        }
        // Selection mode: check for shape
        if (this.selectedShapeId) {
            const selected = this.existingShapes.find(s => s.id === this.selectedShapeId);
            if (selected) {
                // If inside shape, start dragging
                const bounds = this.getShapeBounds(selected);
                if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.draggingShapeId = (typeof selected.id === 'string' ? selected.id : null);
                    this.dragOffset = { x: x - bounds.x, y: y - bounds.y };
                    return;
                }
            }
        }
        // Otherwise, try to select a shape
        const shape = this.findShapeUnderPoint(x, y);
        if (shape) {
            this.selectedShapeId = (typeof shape.id === 'string' ? shape.id : null);
            this.clearCanvas();
        } else {
            this.selectedShapeId = null;
            this.clearCanvas();
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            this.eraserActive = false;
        }
        // --- END RESIZE ---
        if (this.resizeHandle !== null) {
            this.resizeHandle = null;
            this.clearCanvas();
            return;
        }
        if (this.draggingShapeId) {
            this.draggingShapeId = null;
            this.dragOffset = null;
            this.clearCanvas();
            return;
        }
        if (!this.clicked) return;
        this.clicked = false;
        const endX = (e.clientX - this.offsetX) / this.scale;
        const endY = (e.clientY - this.offsetY) / this.scale;
        const width = endX - this.startX;
        const height = endY - this.startY;
        let shape = null;
        const shapeId = this.generateId();
        if (["line", "rect", "circle"].includes(this.selectedTool)) {
            if (Math.abs(width) < 2 && Math.abs(height) < 2) return;
            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect" as const,
                    x: this.startX,
                    y: this.startY,
                    height,
                    width,
                    id: shapeId
                };
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width / 2;
                const centerY = this.startY + height / 2;
                shape = {
                    type: "circle" as const,
                    radius: radius,
                    centerX: centerX,
                    centerY: centerY,
                    id: shapeId
                };
            } else if (this.selectedTool === "line") {
                shape = {
                    type: "line" as const,
                    startX: this.startX,
                    startY: this.startY,
                    endX: endX,
                    endY: endY,
                    id: shapeId
                };
            }
            if (!shape) return;
            if (!this.existingShapes.some(s => s.id === shapeId)) {
                this.existingShapes.push(shape);
                this.selectedShapeId = shapeId;
                if (this.onShapeDrawn) this.onShapeDrawn(shapeId);
                this.socket.send(
                    JSON.stringify({
                        type: "chat",
                        message: JSON.stringify({ shape }),
                        roomId: this.roomId
                    })
                );
                this.clearCanvas();
            }
        } else if (this.selectedTool === "freehand" && this.freehandDrawing) {
            this.freehandDrawing = false;
            if (this.freehandPoints.length > 1) {
                let moved = false;
                for (let i = 1; i < this.freehandPoints.length; i++) {
                    const dx = this.freehandPoints[i].x - this.freehandPoints[0].x;
                    const dy = this.freehandPoints[i].y - this.freehandPoints[0].y;
                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                        moved = true;
                        break;
                    }
                }
                if (moved) {
                    const shape = {
                        type: "freehand" as const,
                        points: [...this.freehandPoints],
                        id: shapeId
                    };
                    if (!this.existingShapes.some(s => s.id === shapeId)) {
                        this.existingShapes.push(shape);
                        this.selectedShapeId = shapeId;
                        if (this.onShapeDrawn) this.onShapeDrawn(shapeId);
                        this.socket.send(
                            JSON.stringify({
                                type: "chat",
                                message: JSON.stringify({ shape }),
                                roomId: this.roomId
                            })
                        );
                        this.clearCanvas();
                    }
                }
            }
            this.freehandPoints = [];
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser" && this.eraserActive) {
            this.eraseAtPosition(e.clientX, e.clientY);
            return;
        }
        // --- RESIZE LOGIC ---
        if (this.resizeHandle !== null && this.selectedShapeId) {
            const shape = this.existingShapes.find(s => s.id === this.selectedShapeId);
            if (shape) {
                this.resizeShape(shape, this.resizeHandle, (e.clientX - this.offsetX) / this.scale, (e.clientY - this.offsetY) / this.scale);
                this.clearCanvas();
            }
            return;
        }
        // Dragging shape logic
        if (this.draggingShapeId && this.dragOffset) {
            const x = (e.clientX - this.offsetX) / this.scale;
            const y = (e.clientY - this.offsetY) / this.scale;
            const shape = this.existingShapes.find(s => s.id === this.draggingShapeId);
            if (shape) {
                const bounds = this.getShapeBounds(shape);
                if (bounds) {
                    const dx = x - bounds.x - this.dragOffset.x;
                    const dy = y - bounds.y - this.dragOffset.y;
                    if (shape.type === "rect") {
                        shape.x += dx;
                        shape.y += dy;
                    } else if (shape.type === "circle") {
                        shape.centerX += dx;
                        shape.centerY += dy;
                    } else if (shape.type === "line") {
                        shape.startX += dx;
                        shape.startY += dy;
                        shape.endX += dx;
                        shape.endY += dy;
                    } else if (shape.type === "freehand") {
                        for (let pt of shape.points) {
                            pt.x += dx;
                            pt.y += dy;
                        }
                    }
                }
                this.clearCanvas();
            }
            return;
        }
        if (!this.clicked) return;
        const x = (e.clientX - this.offsetX) / this.scale;
        const y = (e.clientY - this.offsetY) / this.scale;
        if (this.selectedTool === "freehand" && this.freehandDrawing) {
            const last = this.freehandPoints[this.freehandPoints.length - 1];
            const dx = x - last.x;
            const dy = y - last.y;
            if (dx * dx + dy * dy > 4) {
                this.freehandPoints.push({ x, y });
            }
            this.clearCanvas();
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);
            this.ctx.strokeStyle = "rgba(255,255,255,1)";
            this.ctx.beginPath();
            this.ctx.moveTo(this.freehandPoints[0].x, this.freehandPoints[0].y);
            for (let i = 1; i < this.freehandPoints.length; i++) {
                this.ctx.lineTo(this.freehandPoints[i].x, this.freehandPoints[i].y);
            }
            this.ctx.stroke();
            this.ctx.closePath();
            this.ctx.restore();
            return;
        }
        const endX = x;
        const endY = y;
        const width = endX - this.startX;
        const height = endY - this.startY;
        this.clearCanvas();
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        if (this.selectedTool === "rect") {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        } else if (this.selectedTool === "line") {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.ctx.restore();
    }

    resizeShape(shape: Shape, handleIdx: number, px: number, py: number) {
        // px, py are in canvas coordinates
        const bounds = this.getShapeBounds(shape);
        if (!bounds) return;
        let { x, y, width, height } = bounds;
        let minSize = 10;
        // 0-7: TL, TC, TR, RC, BR, BC, BL, LC
        if (shape.type === "rect") {
            resizeRectangle(shape, handleIdx, px, py);
        } else if (shape.type === "circle") {
            resizeCircle(shape, handleIdx, px, py);
        } else if (shape.type === "line") {
            resizeLine(shape, handleIdx, px, py);
        } else if (shape.type === "freehand") {
            resizeFreehand(shape, handleIdx, px, py);
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }

    // Returns the appropriate cursor for a given handle index
    public getHandleCursor(handleIdx: number): string {
        // 0: TL, 1: TC, 2: TR, 3: RC, 4: BR, 5: BC, 6: BL, 7: LC
        switch (handleIdx) {
            case 0: return 'nwse-resize'; // top-left
            case 1: return 'ns-resize';   // top-center
            case 2: return 'nesw-resize'; // top-right
            case 3: return 'ew-resize';   // right-center
            case 4: return 'nwse-resize'; // bottom-right
            case 5: return 'ns-resize';   // bottom-center
            case 6: return 'nesw-resize'; // bottom-left
            case 7: return 'ew-resize';   // left-center
            default: return 'default';
        }
    }
}
