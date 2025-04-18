import { drawRectangle, isPointInRectangle, resizeRectangle } from './canavashape/Rectangle';
import { drawCircle, isPointInCircle, resizeCircle } from './canavashape/Circle';
import { drawLine, isPointNearLine, resizeLine } from './canavashape/Line';
import { drawFreehand, isPointNearFreehand, resizeFreehand } from './canavashape/Freehand';
import { generateId, getShapeBounds } from './utils';
import { drawText, isPointInText, resizeText } from './canavashape/Text';

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
} | {
    type: "text",
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    id?: string;
}

export type Tool = "select" | "freehand" | "line" | "rect" | "circle" | "eraser" | "text";

export class CanvasEngine {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public shapes: Shape[] = [];
    public scale = 1;
    public offsetX = 0;
    public offsetY = 0;
    public selectedShapeId: string | null = null;
    public handleSize: number = 8;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: true })!;
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

    clearCanvas() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        this.drawShapes();
        if (this.selectedShapeId) {
            const selected = this.shapes.find(s => s.id === this.selectedShapeId);
            if (selected) {
                this.drawSelectionFrameAndHandles(selected);
            }
        }
        this.ctx.restore();
    }

    drawShapes() {
        if (!this.shapes || this.shapes.length === 0) return;
        this.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
        this.shapes.forEach((shape) => {
            if (shape.type === "rect") {
                drawRectangle(this.ctx, shape);
            } else if (shape.type === "circle") {
                drawCircle(this.ctx, shape);
            } else if (shape.type === "line") {
                drawLine(this.ctx, shape);
            } else if (shape.type === "freehand") {
                drawFreehand(this.ctx, shape);
            } else if (shape.type === "text") {
                drawText(this.ctx, shape);
            }
        });
    }

    eraseShapeById(id: string) {
        this.shapes = this.shapes.filter(shape => shape.id !== id);
        this.clearCanvas();
    }

    findShapeUnderPoint(x: number, y: number): Shape | null {
        const adjustedX = (x - this.offsetX) / this.scale;
        const adjustedY = (y - this.offsetY) / this.scale;
        const eraserBuffer = 10;
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (shape.type === "rect" && isPointInRectangle(adjustedX, adjustedY, shape, eraserBuffer)) {
                return shape;
            } else if (shape.type === "circle" && isPointInCircle(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "line" && isPointNearLine(adjustedX, adjustedY, shape)) {
                return shape;
            } else if (shape.type === "freehand" && isPointNearFreehand(adjustedX, adjustedY, shape)) {
                return shape;
            }  else if (shape.type === "text" && isPointInText(adjustedX, adjustedY, shape)) {
                return shape;
            }
        }
        return null;
    }

    drawSelectionFrameAndHandles(shape: Shape) {
        this.ctx.save();
        this.ctx.strokeStyle = "#60A5FA";
        this.ctx.lineWidth = 2;
        let bounds = getShapeBounds(shape);
        if (!bounds) return;
        const { x, y, width, height } = bounds;
        this.ctx.strokeRect(x, y, width, height);
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
        this.ctx.fillStyle = "#60A5FA";
        for (let [hx, hy] of handles) {
            this.ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        this.ctx.restore();
    }

    getHandleAtPoint(shape: Shape, px: number, py: number): number | null {
        const bounds = getShapeBounds(shape);
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

    resizeShape(shape: Shape, handleIdx: number, px: number, py: number) {
        if (shape.type === "rect") {
            resizeRectangle(shape, handleIdx, px, py);
        } else if (shape.type === "circle") {
            resizeCircle(shape, handleIdx, px, py);
        } else if (shape.type === "line") {
            resizeLine(shape, handleIdx, px, py);
        } else if (shape.type === "freehand") {
            resizeFreehand(shape, handleIdx, px, py);
        } else if (shape.type === "text") {
            resizeText(shape, handleIdx, px, py);
        }
    }

    addShape(shape: Shape) {
        if (!shape.id) shape.id = generateId();
        this.shapes.push(shape);
        this.clearCanvas();
    }

    updateShape(shape: Shape) {
        const idx = this.shapes.findIndex(s => s.id === shape.id);
        if (idx !== -1) {
            this.shapes[idx] = shape;
            this.clearCanvas();
        }
    }

    setShapes(shapes: Shape[]) {
        this.shapes = shapes;
        this.clearCanvas();
    }
}
