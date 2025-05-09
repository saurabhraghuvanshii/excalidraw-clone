import { drawRectangle, isPointInRectangle, resizeRectangle, } from "./canavashape/Rectangle";
import { drawCircleOrOVal, isPointInCircleOrOval, resizeCircleOrOval, } from "./canavashape/Circle";
import { drawLine, isPointNearLine, resizeLine } from "./canavashape/Line";
import { drawFreehand, isPointNearFreehand, resizeFreehand, } from "./canavashape/Freehand";
import { generateId, getShapeBounds } from "../utils/utils";
import { drawText, isPointInText, resizeText } from "./canavashape/Text";
import { drawSelectionFrameAndHandles as drawFrameHandles } from "../canvaFuncationality/FrameHandles";
import { drawDiamond, isPointInDiamond, resizeDiamond, } from "./canavashape/Diamond";
import { drawArrow, isPointNearArrow, resizeArrow } from "./canavashape/Arrow";

export type Shape =
| {
	type: "rect";
	x: number;
	y: number;
	width: number;
	height: number;
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	roughDrawable?: any;
	id?: string;
	}
| {
	type: "circleOrOval";
	centerX: number;
	centerY: number;
	radiusX: number;
	radiusY: number;
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	id?: string;
	}
| {
	type: "line";
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	id?: string;
	}
| {
	type: "freehand";
	points: { x: number; y: number }[];
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	id?: string;
	}
| {
	type: "text";
	x: number;
	y: number;
	width: number;
	height: number;
	text: string;
	fontSize?: number;
	fontFamily?: string;
	textAlign?: string;
	fontStyle?: string;
	color?: string;
	strokeWidth?: number;
	strokeColor?: string;
	fillStyle?: string;
	id?: string;
	}
| {
	type: "diamond";
	x: number;
	y: number;
	width: number;
	height: number;
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	id?: string;
	}
| {
	type: "arrow";
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	strokeWidth?: number;
	strokeColor?: string;
	strokeEdge?: string;
	strokeStyle?: string;
	fillColor?: string;
	fillStyle?: string;
	id?: string;
};

export type Tool = | "select" | "freehand" | "line" | "rect" | "circleOrOval" | "eraser" | "text" | "diamond"| "arrow";

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
		if (this.scale === scale) return;
		this.scale = scale;
		this.clearCanvas();
	}

	setOffset(x: number, y: number) {
		if (this.offsetX === x && this.offsetY === y) return;
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
			const selected = this.shapes.find((s) => s.id === this.selectedShapeId);
			if (selected) {
				this.drawSelectionFrameAndHandles(selected);
			}
		}
		this.ctx.restore();
	}

	drawShapes() {
		if (!this.shapes || this.shapes.length === 0) return;

		for (const shape of this.shapes) {
			switch (shape.type) {
				case "rect":
					drawRectangle(this.ctx, {
						...shape,
						fillStyle: (shape as any).fillStyle || "architect",
					});
					break;
				case "circleOrOval":
					drawCircleOrOVal(this.ctx, shape);
					break;
				case "line":
					drawLine(this.ctx, shape);
					break;
				case "arrow":
					drawArrow(this.ctx, shape);
					break;
				case "freehand":
					drawFreehand(this.ctx, shape);
					break;
				case "text":
					drawText(this.ctx, shape);
					break;
				case "diamond":
					drawDiamond(this.ctx, shape);
					break;
			}
		}
	}

	eraseShapeById(id: string) {
		const initialLength = this.shapes.length;
		this.shapes = this.shapes.filter((shape) => shape.id !== id);
		if (this.selectedShapeId === id) {
			this.selectedShapeId = null; // Deselect if the erased shape was selected
		}
		if (this.shapes.length < initialLength) {
			this.clearCanvas(); // Only redraw if a shape was actually removed
		}
	}

	findShapeUnderPoint(clientX: number, clientY: number): Shape | null {
		const adjustedX = (clientX - this.offsetX) / this.scale;
		const adjustedY = (clientY - this.offsetY) / this.scale;
		const hitBuffer = 10 / this.scale;

		for (let i = this.shapes.length - 1; i >= 0; i--) {
			const shape = this.shapes[i];

			let isUnderPoint = false;

			switch (shape.type) {
				case "rect":
					isUnderPoint = isPointInRectangle(adjustedX, adjustedY, shape, hitBuffer);
					break;
				case "circleOrOval":
					isUnderPoint = isPointInCircleOrOval(adjustedX, adjustedY, shape, hitBuffer);
					break;
				case "line":
					isUnderPoint = isPointNearLine(adjustedX, adjustedY, shape);
					break;
				case "arrow":
					isUnderPoint = isPointNearArrow(adjustedX, adjustedY, shape);
					break;
				case "freehand":
					isUnderPoint = isPointNearFreehand(adjustedX, adjustedY, shape);
					break;
				case "text":
					isUnderPoint = isPointInText(adjustedX, adjustedY, shape, hitBuffer);
					break;
				case "diamond":
					isUnderPoint = isPointInDiamond(adjustedX, adjustedY, shape, hitBuffer);
					break;
			}

			if (isUnderPoint) {
				return shape;
			}
		}

		return null;
	}

	drawSelectionFrameAndHandles(shape: Shape) {
		drawFrameHandles(this.ctx, shape, this.handleSize / this.scale);
	}

	getHandleAtPoint(shape: Shape, px: number, py: number): number | null {
		const bounds = getShapeBounds(shape);
		if (!bounds) return null;

		const { x, y, width, height } = bounds;
		const margin = 8;
		const hs = this.handleSize / this.scale;

		const handles = [
			[x - margin, y - margin],
			[x + width / 2, y - margin],
			[x + width + margin, y - margin],
			[x + width + margin, y + height / 2],
			[x + width + margin, y + height + margin],
			[x + width / 2, y + height + margin],
			[x - margin, y + height + margin],
			[x - margin, y + height / 2],
		];

		for (let i = 0; i < handles.length; i++) {
			const [hx, hy] = handles[i];
			const buffer = hs / 2;

			if (
				px >= hx - buffer &&
				px <= hx + buffer &&
				py >= hy - buffer &&
				py <= hy + buffer
			) {
				return i;
			}
		}
		return null;
	}

	resizeShape(shape: Shape, handleIdx: number, px: number, py: number) {
		switch (shape.type) {
			case "rect":
				resizeRectangle(shape, handleIdx, px, py);
				break;
			case "circleOrOval":
				resizeCircleOrOval(shape, handleIdx, px, py);
				break;
			case "line":
				resizeLine(shape, handleIdx, px, py);
				break;
			case "arrow":
				resizeArrow(shape, handleIdx, px, py);
				break;
			case "freehand":
				resizeFreehand(shape, handleIdx, px, py);
				break;
			case "text":
				resizeText(shape, handleIdx, px, py);
				break;
			case "diamond":
				resizeDiamond(shape, handleIdx, px, py);
				break;
		}
	}

	addShape(shape: Shape) {
		if (!shape.id) shape.id = generateId();
		if ("strokeEdge" in shape && shape.strokeEdge === undefined)
			shape.strokeEdge = "round";
		if ("strokeStyle" in shape && shape.strokeStyle === undefined)
			shape.strokeStyle = "solid";
		this.shapes.push(shape);
	}

	updateShape(updateShape: Shape) {
		const idx = this.shapes.findIndex((s) => s.id === updateShape.id);
		if (idx !== -1) {
			const prev = this.shapes[idx];
			// If strokeStyle changes for a rectangle, force fillStyle to architect
			if (
				prev.type === "rect" &&
				updateShape.type === "rect" &&
				prev.strokeStyle !== updateShape.strokeStyle
			) {
				updateShape.fillStyle = "architect";
				(updateShape as any).roughDrawable = undefined;
			}
			// If fillStyle changes, clear roughDrawable for rectangles
			if (
				prev.type === "rect" &&
				updateShape.type === "rect" &&
				prev.fillStyle !== updateShape.fillStyle
			) {
				(updateShape as any).roughDrawable = undefined;
			}
			this.shapes[idx] = updateShape;
			this.clearCanvas();
		}
	}

	setShapes(shapes: Shape[]) {
		this.shapes = shapes;
		this.clearCanvas();
	}
}
