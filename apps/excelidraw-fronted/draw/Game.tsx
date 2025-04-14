import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
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
                    const parsedShape = JSON.parse(message.message);
                    this.existingShapes.push(parsedShape.shape);
                    this.clearCanvas();
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
        
        // Draw all existing shapes
        this.drawShapes();
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
            }
        });
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
    }

    mouseUpHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
        
        this.clicked = false;
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;

        let shape: Shape | null = null;
        
        if (this.selectedTool === "rect") {
            shape = {
                type: "rect",
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
                type: "circle",
                radius: radius,
                centerX: centerX,
                centerY: centerY,
            };
        } else if (this.selectedTool === "pencil") {
            shape = {
                type: "pencil",
                startX: this.startX,
                startY: this.startY,
                endX: e.clientX,
                endY: e.clientY
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

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
        
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        
        // Redraw existing shapes plus current preview
        this.clearCanvas();
        
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
            this.ctx.lineTo(e.clientX, e.clientY);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}
