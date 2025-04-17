import { CanvasEngine, Shape, Tool } from "./CanvasEngine";
import { getExistingShapes } from "./http";
import { drawRectangle, isPointInRectangle, resizeRectangle } from './canavashape/Rectangle';
import { drawCircle, isPointInCircle, resizeCircle } from './canavashape/Circle';
import { drawLine, isPointNearLine, resizeLine } from './canavashape/Line';
import { drawFreehand, isPointNearFreehand, resizeFreehand } from './canavashape/Freehand';
import { getShapeBounds } from "./utils";

export class Game {
    public canvas: HTMLCanvasElement;
    public engine: CanvasEngine;
    public roomId: string;
    public socket: WebSocket;
    public readOnly: boolean = false;
    public selectedTool: Tool = "circle";
    public clicked: boolean = false;
    public startX = 0;
    public startY = 0;
    public eraserActive = false;
    public freehandDrawing = false;
    public freehandPoints: { x: number; y: number }[] = [];
    public draggingShapeId: string | null = null;
    public dragOffset: { x: number; y: number } | null = null;
    public resizeHandle: number | null = null;
    public onShapeDrawn?: (newShapeId: string) => void;
    public get handleSize() { return this.engine.handleSize; }
    public set handleSize(val: number) { this.engine.handleSize = val; }

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, readOnly = false) {
        this.canvas = canvas;
        this.engine = new CanvasEngine(canvas);
        this.roomId = roomId;
        this.socket = socket;
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
        this.engine.setScale(scale);
    }

    setOffset(x: number, y: number) {
        this.engine.setOffset(x, y);
    }

    setReadOnly(readOnly: boolean) {
        this.readOnly = readOnly;
    }

    async init() {
        try {
            const shapes = await getExistingShapes(this.roomId);
            this.engine.setShapes(shapes);
        } catch (error) {
            console.error("Failed to initialize game:", error);
        }
    }

    handleResize() {
        setTimeout(() => {
            this.engine.clearCanvas();
        }, 0);
    }

    initHandlers() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "chat") {
                    const parsedData = JSON.parse(message.message);
                    if (parsedData.shape) {
                        const shapeId = parsedData.shape.id;
                        if (shapeId && !this.engine.shapes.some(s => s.id === shapeId)) {
                            this.engine.addShape(parsedData.shape);
                        }
                    } else if (parsedData.eraseId) {
                        this.engine.eraseShapeById(parsedData.eraseId);
                    }
                }
            } catch (error) {
                console.error("Error handling socket message:", error);
            }
        };
    }

    mouseDownHandler = (e: MouseEvent) => {
        const x = (e.clientX - this.engine.offsetX) / this.engine.scale;
        const y = (e.clientY - this.engine.offsetY) / this.engine.scale;
        if (this.readOnly) return;
        if (this.selectedTool === "eraser") {
            this.eraserActive = true;
            const shape = this.engine.findShapeUnderPoint(e.clientX, e.clientY);
            if (shape && shape.id) {
                this.engine.eraseShapeById(shape.id);
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ eraseId: shape.id }),
                    roomId: this.roomId
                }));
            }
            return;
        }
        if (this.engine.selectedShapeId) {
            const selected = this.engine.shapes.find(s => s.id === this.engine.selectedShapeId);
            if (selected) {
                const handleIdx = this.engine.getHandleAtPoint(selected, x, y);
                if (handleIdx !== null) {
                    this.resizeHandle = handleIdx;
                    return;
                }
            }
        }
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
        if (this.engine.selectedShapeId) {
            const selected = this.engine.shapes.find(s => s.id === this.engine.selectedShapeId);
            if (selected) {
                const bounds = this.getShapeBounds(selected);
                if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.draggingShapeId = (typeof selected.id === 'string' ? selected.id : null);
                    this.dragOffset = { x: x - bounds.x, y: y - bounds.y };
                    return;
                }
            }
        }
        const shape = this.engine.findShapeUnderPoint(x, y);
        if (shape) {
            this.engine.selectedShapeId = (typeof shape.id === 'string' ? shape.id : null);
            this.engine.clearCanvas();
        } else {
            this.engine.selectedShapeId = null;
            this.engine.clearCanvas();
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            this.eraserActive = false;
        }
        if (this.resizeHandle !== null) {
            this.resizeHandle = null;
            this.engine.clearCanvas();
            return;
        }
        if (this.draggingShapeId) {
            this.draggingShapeId = null;
            this.dragOffset = null;
            this.engine.clearCanvas();
            return;
        }
        if (!this.clicked) return;
        this.clicked = false;
        const endX = (e.clientX - this.engine.offsetX) / this.engine.scale;
        const endY = (e.clientY - this.engine.offsetY) / this.engine.scale;
        const width = endX - this.startX;
        const height = endY - this.startY;
        let shape = null;
        if (["line", "rect", "circle"].includes(this.selectedTool)) {
            if (Math.abs(width) < 2 && Math.abs(height) < 2) return;
            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect" as const,
                    x: this.startX,
                    y: this.startY,
                    height,
                    width
                };
            } else if (this.selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width / 2;
                const centerY = this.startY + height / 2;
                shape = {
                    type: "circle" as const,
                    radius: radius,
                    centerX: centerX,
                    centerY: centerY
                };
            } else if (this.selectedTool === "line") {
                shape = {
                    type: "line" as const,
                    startX: this.startX,
                    startY: this.startY,
                    endX: endX,
                    endY: endY
                };
            }
            if (!shape) return;
            this.engine.addShape(shape);
            const addedShape = this.engine.shapes[this.engine.shapes.length - 1];
            const shapeId = addedShape.id;
            this.engine.selectedShapeId = shapeId ?? null;
            if (this.onShapeDrawn && shapeId) this.onShapeDrawn(shapeId);
            this.socket.send(
                JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape: addedShape }),
                    roomId: this.roomId
                })
            );
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
                    const freehandShape = {
                        type: "freehand" as const,
                        points: [...this.freehandPoints]
                    };
                    this.engine.addShape(freehandShape);
                    const addedShape = this.engine.shapes[this.engine.shapes.length - 1];
                    const shapeId = addedShape.id;
                    this.engine.selectedShapeId = shapeId ?? null;
                    if (this.onShapeDrawn && shapeId) this.onShapeDrawn(shapeId);
                    this.socket.send(
                        JSON.stringify({
                            type: "chat",
                            message: JSON.stringify({ shape: addedShape }),
                            roomId: this.roomId
                        })
                    );
                }
            }
            this.freehandPoints = [];
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser" && this.eraserActive) {
            const shape = this.engine.findShapeUnderPoint(e.clientX, e.clientY);
            if (shape && shape.id) {
                this.engine.eraseShapeById(shape.id);
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ eraseId: shape.id }),
                    roomId: this.roomId
                }));
            }
            return;
        }
        if (this.resizeHandle !== null && this.engine.selectedShapeId) {
            const shape = this.engine.shapes.find(s => s.id === this.engine.selectedShapeId);
            if (shape) {
                this.engine.resizeShape(shape, this.resizeHandle, (e.clientX - this.engine.offsetX) / this.engine.scale, (e.clientY - this.engine.offsetY) / this.engine.scale);
                this.engine.clearCanvas();
            }
            return;
        }
        if (this.draggingShapeId && this.dragOffset) {
            const x = (e.clientX - this.engine.offsetX) / this.engine.scale;
            const y = (e.clientY - this.engine.offsetY) / this.engine.scale;
            const shape = this.engine.shapes.find(s => s.id === this.draggingShapeId);
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
                this.engine.clearCanvas();
            }
            return;
        }
        if (!this.clicked) return;
        const x = (e.clientX - this.engine.offsetX) / this.engine.scale;
        const y = (e.clientY - this.engine.offsetY) / this.engine.scale;
        if (this.selectedTool === "freehand" && this.freehandDrawing) {
            const last = this.freehandPoints[this.freehandPoints.length - 1];
            const dx = x - last.x;
            const dy = y - last.y;
            if (dx * dx + dy * dy > 4) {
                this.freehandPoints.push({ x, y });
            }
            this.engine.clearCanvas();
            this.engine.ctx.save();
            this.engine.ctx.translate(this.engine.offsetX, this.engine.offsetY);
            this.engine.ctx.scale(this.engine.scale, this.engine.scale);
            this.engine.ctx.strokeStyle = "rgba(255,255,255,1)";
            this.engine.ctx.beginPath();
            this.engine.ctx.moveTo(this.freehandPoints[0].x, this.freehandPoints[0].y);
            for (let i = 1; i < this.freehandPoints.length; i++) {
                this.engine.ctx.lineTo(this.freehandPoints[i].x, this.freehandPoints[i].y);
            }
            this.engine.ctx.stroke();
            this.engine.ctx.closePath();
            this.engine.ctx.restore();
            return;
        }
        const endX = x;
        const endY = y;
        const width = endX - this.startX;
        const height = endY - this.startY;
        this.engine.clearCanvas();
        this.engine.ctx.save();
        this.engine.ctx.translate(this.engine.offsetX, this.engine.offsetY);
        this.engine.ctx.scale(this.engine.scale, this.engine.scale);
        this.engine.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        if (this.selectedTool === "rect") {
            this.engine.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (this.selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            this.engine.ctx.beginPath();
            this.engine.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.engine.ctx.stroke();
            this.engine.ctx.closePath();
        } else if (this.selectedTool === "line") {
            this.engine.ctx.beginPath();
            this.engine.ctx.moveTo(this.startX, this.startY);
            this.engine.ctx.lineTo(endX, endY);
            this.engine.ctx.stroke();
            this.engine.ctx.closePath();
        }
        this.engine.ctx.restore();
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }

    getHandleCursor(handleIdx: number): string {
        switch (handleIdx) {
            case 0: return 'nwse-resize';
            case 1: return 'ns-resize';
            case 2: return 'nesw-resize';
            case 3: return 'ew-resize';
            case 4: return 'nwse-resize';
            case 5: return 'ns-resize';
            case 6: return 'nesw-resize';
            case 7: return 'ew-resize';
            default: return 'default';
        }
    }

    drawSelectionFrameAndHandles(shape: Shape) {
        // Do NOT apply translate/scale here; already applied in clearCanvas
        this.engine.ctx.save();
        this.engine.ctx.strokeStyle = "#60A5FA";
        this.engine.ctx.lineWidth = 2;
        let bounds = this.getShapeBounds(shape);
        if (!bounds) return;
        const { x, y, width, height } = bounds;
        // Draw frame
        this.engine.ctx.strokeRect(x, y, width, height);
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
        this.engine.ctx.fillStyle = "#60A5FA";
        for (let [hx, hy] of handles) {
            this.engine.ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        this.engine.ctx.restore();
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
}
