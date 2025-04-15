type Tool = "pencil" | "rect" | "circle" | "eraser";
import { getExistingShapes } from "./http";

type Shape = {
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
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    id?: string;
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[] = [];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private isInitialized = false;
    private scale = 1;
    private offsetX = 0;
    private offsetY = 0;
    private eraserActive = false;


    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
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
                        // Add new shape
                        this.existingShapes.push(parsedData.shape);
                        this.clearCanvas();
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

        // Restore original transform
        this.ctx.restore();
    }

    drawShapes() {
        if (!this.existingShapes || this.existingShapes.length === 0) return;

        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";

        this.existingShapes.forEach((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
            } else if (shape.type === "pencil") {
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                this.ctx.closePath();
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

            // Send erase action to other clients
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ eraseId: shapeToErase.id }),
                roomId: this.roomId
            }));

            // Redraw canvas
            this.clearCanvas();
        }
    }

    // Check if a point is inside a rectangle
    private isPointInRect(x: number, y: number, rect: Shape & { type: "rect" }): boolean {
        const buffer = Math.min(Math.abs(rect.width), Math.abs(rect.height)) < 10 ? 5 : 0;

        return (
            x >= rect.x - buffer &&
            x <= rect.x + rect.width + buffer &&
            y >= rect.y - buffer &&
            y <= rect.y + rect.height + buffer
        );
    }

    // Check if a point is inside a circle
    private isPointInCircle(x: number, y: number, circle: Shape & { type: "circle" }): boolean {
        const dx = x - circle.centerX;
        const dy = y - circle.centerY;
        const buffer = circle.radius < 10 ? 5 : 0;
        return Math.sqrt(dx * dx + dy * dy) <= circle.radius + buffer;
    }

    // Check if a point is near a pencil line
    private isPointNearPencilLine(x: number, y: number, pencil: Shape & { type: "pencil" }): boolean {
        // Calculate distance from point to line segment
        const A = x - pencil.startX;
        const B = y - pencil.startY;
        const C = pencil.endX - pencil.startX;
        const D = pencil.endY - pencil.startY;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = len_sq !== 0 ? dot / len_sq : -1;

        let xx, yy;

        if (param < 0) {
            xx = pencil.startX;
            yy = pencil.startY;
        } else if (param > 1) {
            xx = pencil.endX;
            yy = pencil.endY;
        } else {
            xx = pencil.startX + param * C;
            yy = pencil.startY + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 10; // 10px buffer for pencil lines
    }

    private findShapeUnderPoint(x: number, y: number): Shape | null {
        // Adjust for scale and offset
        const adjustedX = (x - this.offsetX) / this.scale;
        const adjustedY = (y - this.offsetY) / this.scale;

        // Check from the newest shape (top) to the oldest (bottom)
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shape = this.existingShapes[i];

            if (shape.type === "rect" && this.isPointInRect(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "circle" && this.isPointInCircle(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "pencil" && this.isPointNearPencilLine(adjustedX, adjustedY, shape)) {
                return shape;
            }
        }

        return null;
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = (e.clientX - this.offsetX) / this.scale;
        this.startY = (e.clientY - this.offsetY) / this.scale;


        if (this.selectedTool === "eraser") {
            this.eraserActive = true;
            this.eraseAtPosition(e.clientX, e.clientY);
        }

    }

    mouseUpHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser") {
            // Stop erasing when mouse button is released
            this.eraserActive = false;
        }

        this.clicked = false;

        if (["pencil", "rect", "circle"].includes(this.selectedTool)) {
            const endX = (e.clientX - this.offsetX) / this.scale;
            const endY = (e.clientY - this.offsetY) / this.scale;
            const width = endX - this.startX;
            const height = endY - this.startY;

            let shape: Shape | null = null;
            const shapeId = this.generateId();

            if (this.selectedTool === "rect") {
                shape = {
                    type: "rect",
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
                    type: "circle",
                    radius: radius,
                    centerX: centerX,
                    centerY: centerY,
                    id: shapeId
                };
            } else if (this.selectedTool === "pencil") {
                shape = {
                    type: "pencil",
                    startX: this.startX,
                    startY: this.startY,
                    endX: endX,
                    endY: endY,
                    id: shapeId
                };
            }

            if (!shape) return;

            // Add shape locally
            this.existingShapes.push(shape);

            // Send to other clients
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape }),
                roomId: this.roomId
            }));

            // Redraw canvas
            this.clearCanvas();
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.selectedTool === "eraser" && this.eraserActive) {
            // Only erase if mouse button is being held down (eraserActive is true)
            this.eraseAtPosition(e.clientX, e.clientY);
            return;
        }

        if (!this.clicked) return;

        const endX = (e.clientX - this.offsetX) / this.scale;
        const endY = (e.clientY - this.offsetY) / this.scale;
        const width = endX - this.startX;
        const height = endY - this.startY;

        // Redraw existing shapes plus current preview
        this.clearCanvas();

        // Apply scale and translation for preview
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
        } else if (this.selectedTool === "pencil") {
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        this.ctx.restore();
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}
