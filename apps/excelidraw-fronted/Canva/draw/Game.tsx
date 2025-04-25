import { CanvasEngine, Shape, Tool } from "./CanvasEngine";
import { getExistingShapes } from "./http";
import { getShapeBounds } from "./utils";
import { drawSelectionFrameAndHandles as drawFrameHandles } from "../canvaFuncationality/FrameHandles";

export class Game {
	public canvas: HTMLCanvasElement;
	public engine: CanvasEngine;
	public roomId: string;
	public socket: WebSocket;
	public readOnly: boolean = false;
	public selectedTool: Tool = "circleOrOval";
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
	public get handleSize() {
		return this.engine.handleSize;
	}
	public set handleSize(val: number) {
		this.engine.handleSize = val;
	}
	public textToAdd: string | undefined;
	public getDrawingStyle:
		| (() => {
			strokeFill: string;
			bgFill: string;
			strokeWidth: number;
			strokeEdge: string;
			strokeStyle: string;
			roughStyle: number;
			fillStyle: string;
			fontFamily: string;
			fontSize: number;
			textAlign: string;
		})
		| null = null;

	constructor(
		canvas: HTMLCanvasElement,
		roomId: string,
		socket: WebSocket,
		readOnly = false
	) {
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
						if (shapeId && !this.engine.shapes.some((s) => s.id === shapeId)) {
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
		if (this.readOnly) return;

		const x = (e.clientX - this.engine.offsetX) / this.engine.scale;
		const y = (e.clientY - this.engine.offsetY) / this.engine.scale;

		if (this.selectedTool === "eraser") {
			this.eraserActive = true;
			const shape = this.engine.findShapeUnderPoint(e.clientX, e.clientY);
			if (shape && shape.id) {
				this.engine.eraseShapeById(shape.id);
				this.socket.send(
					JSON.stringify({
						type: "chat",
						message: JSON.stringify({ eraseId: shape.id }),
						roomId: this.roomId,
					})
				);
			}
			return;
		}
		if (this.engine.selectedShapeId) {
			const selected = this.engine.shapes.find(
				(s) => s.id === this.engine.selectedShapeId
			);
			if (selected) {
				const handleIdx = this.engine.getHandleAtPoint(selected, x, y);
				if (handleIdx !== null) {
					this.resizeHandle = handleIdx;
					return;
				}
			}
		}

		if (
			["rect", "circleOrOval", "line", "freehand", "diamond", "arrow"].includes(
				this.selectedTool
			)
		) {
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
			const selected = this.engine.shapes.find(
				(s) => s.id === this.engine.selectedShapeId
			);
			if (selected) {
				const bounds = getShapeBounds(selected);
				if (
					bounds &&
					x >= bounds.x &&
					x <= bounds.x + bounds.width &&
					y >= bounds.y &&
					y <= bounds.y + bounds.height
				) {
					this.draggingShapeId = selected.id || null;
					this.dragOffset = { x: x - bounds.x, y: y - bounds.y };
					return;
				}
			}
		}

		const shape = this.engine.findShapeUnderPoint(e.clientX, e.clientY);
		if (shape) {
			this.engine.selectedShapeId = shape.id || null;
			this.engine.clearCanvas();
		} else {
			this.engine.selectedShapeId = null;
			this.engine.clearCanvas();
		}
	};

	mouseUpHandler = (e: MouseEvent) => {
		if (this.readOnly) return;

		if (this.selectedTool === "eraser") {
			this.eraserActive = false;
			return;
		}

		if (this.resizeHandle !== null && this.engine.selectedShapeId) {
			const shape = this.engine.shapes.find(
				(s) => s.id === this.engine.selectedShapeId
			);
			if (shape) {
				this.socket.send(
					JSON.stringify({
						type: "chat",
						message: JSON.stringify({ shape: shape }),
						roomId: this.roomId,
					})
				);
			}
			this.resizeHandle = null;
			this.engine.clearCanvas();
			return;
		}

		if (this.draggingShapeId) {
			const shape = this.engine.shapes.find((s) => s.id === this.draggingShapeId);
			if (shape) {
				this.socket.send(
					JSON.stringify({
						type: "chat",
						message: JSON.stringify({ shape: shape }),
						roomId: this.roomId,
					})
				);
			}
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

		if (
			["line", "rect", "circleOrOval", "diamond", "arrow"].includes(
				this.selectedTool
			)
		) {
			if (Math.abs(width) < 2 && Math.abs(height) < 2) return;
			let shape: Shape | null = null;
			const style = this.getDrawingStyle
				? this.getDrawingStyle()
				: {
					strokeFill: "#000000",
					bgFill: "#ffffff",
					strokeWidth: 2,
					strokeEdge: "round",
					strokeStyle: "solid",
					roughStyle: 0,
					fillStyle: "solid",
					fontFamily: "Nunito",
					fontSize: 20,
					textAlign: "left",
				};
			switch (this.selectedTool) {
				case "rect":
					shape = {
						type: "rect",
						x: this.startX,
						y: this.startY,
						height,
						width,
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						fillColor: style.bgFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
					};
					break;
				case "circleOrOval":
					shape = {
						type: "circleOrOval",
						centerX: this.startX + width / 2,
						centerY: this.startY + height / 2,
						radiusX: Math.abs(width) / 2,
						radiusY: Math.abs(height) / 2,
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						fillColor: style.bgFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
					};
					break;
				case "line":
					shape = {
						type: "line",
						startX: this.startX,
						startY: this.startY,
						endX,
						endY,
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
					};
					break;
				case "arrow":
					shape = {
						type: "arrow",
						startX: this.startX,
						startY: this.startY,
						endX,
						endY,
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
					};
					break;
				case "diamond":
					shape = {
						type: "diamond",
						x: this.startX,
						y: this.startY,
						width,
						height,
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						fillColor: style.bgFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
					};
					break;
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
					roomId: this.roomId,
				})
			);
			this.engine.clearCanvas();
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
					const style = this.getDrawingStyle
						? this.getDrawingStyle()
						: {
							strokeFill: "#000000",
							strokeWidth: 2,
							strokeEdge: "round",
							strokeStyle: "solid",
						};
					const freehandShape = {
						type: "freehand" as const,
						points: [...this.freehandPoints],
						strokeWidth: style.strokeWidth,
						strokeColor: style.strokeFill,
						strokeEdge: style.strokeEdge,
						strokeStyle: style.strokeStyle,
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
							roomId: this.roomId,
						})
					);
				}
			}

			this.freehandPoints = [];
		} else if (this.selectedTool === "text" && this.textToAdd) {
			const ctx = this.engine.ctx;
			ctx.save();

			const style = this.getDrawingStyle
				? this.getDrawingStyle()
				: {
					fontSize: 24,
					fontFamily: "Nunito",
					textAlign: "left",
					strokeFill: "#000000",
				};
			const fontSize = style.fontSize || 24;
			const fontFamily = style.fontFamily || "Nunito";
			ctx.font = `${fontSize}px ${fontFamily}`;
			const metrics = ctx.measureText(this.textToAdd);
			const textWidth = metrics.width;

			let textHeight;
			if (
				"fontBoundingBoxAscent" in metrics &&
				"fontBoundingBoxDescent" in metrics
			) {
				textHeight =
					(metrics.fontBoundingBoxAscent || 0) +
					(metrics.fontBoundingBoxDescent || 0);
			} else if (
				"actualBoundingBoxAscent" in metrics &&
				"actualBoundingBoxDescent" in metrics
			) {
				const m = metrics as TextMetrics & {
					actualBoundingBoxAscent?: number;
					actualBoundingBoxDescent?: number;
				};
				textHeight =
					(m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
			} else {
				textHeight = fontSize;
			}

			ctx.restore();

			const shape: Shape = {
				type: "text" as const,
				x: this.startX,
				y: this.startY,
				width: textWidth,
				height: textHeight,
				text: this.textToAdd,
				fontSize,
				fontFamily,
				textAlign: style.textAlign,
				color: style.strokeFill,
				strokeColor: style.strokeFill,
			};

			this.engine.addShape(shape);
			const addedShape = this.engine.shapes[this.engine.shapes.length - 1];
			const shapeId = addedShape.id;

			this.engine.selectedShapeId = shapeId ?? null;

			if (this.onShapeDrawn && shapeId) this.onShapeDrawn(shapeId);

			this.socket.send(
				JSON.stringify({
					type: "chat",
					message: JSON.stringify({ shape: addedShape }),
					roomId: this.roomId,
				})
			);
			this.textToAdd = undefined;
		}
	};

	mouseMoveHandler = (e: MouseEvent) => {
		if (this.selectedTool === "eraser" && this.eraserActive) {
			const shape = this.engine.findShapeUnderPoint(e.clientX, e.clientY);

			if (shape && shape.id) {
				this.engine.eraseShapeById(shape.id);
				this.socket.send(
					JSON.stringify({
						type: "chat",
						message: JSON.stringify({ eraseId: shape.id }),
						roomId: this.roomId,
					})
				);
			}
			return;
		}

		if (this.resizeHandle !== null && this.engine.selectedShapeId) {
			const shape = this.engine.shapes.find(
				(s) => s.id === this.engine.selectedShapeId
			);
			if (shape) {
				this.engine.resizeShape(
					shape,
					this.resizeHandle,
					(e.clientX - this.engine.offsetX) / this.engine.scale,
					(e.clientY - this.engine.offsetY) / this.engine.scale
				);
				this.engine.clearCanvas();
			}
			return;
		}

		if (this.draggingShapeId && this.dragOffset) {
			const x = (e.clientX - this.engine.offsetX) / this.engine.scale;
			const y = (e.clientY - this.engine.offsetY) / this.engine.scale;
			const shape = this.engine.shapes.find((s) => s.id === this.draggingShapeId);

			if (shape) {
				const bounds = getShapeBounds(shape);
				if (bounds) {
					const dx = x - bounds.x - this.dragOffset.x;
					const dy = y - bounds.y - this.dragOffset.y;
					if (shape.type === "rect") {
						shape.x += dx;
						shape.y += dy;
					} else if (shape.type === "circleOrOval") {
						shape.centerX += dx;
						shape.centerY += dy;
					} else if (shape.type === "line") {
						shape.startX += dx;
						shape.startY += dy;
						shape.endX += dx;
						shape.endY += dy;
					} else if (shape.type === "arrow") {
						shape.startX += dx;
						shape.startY += dy;
						shape.endX += dx;
						shape.endY += dy;
					} else if (shape.type === "freehand") {
						for (let pt of shape.points) {
							pt.x += dx;
							pt.y += dy;
						}
					} else if (shape.type === "diamond") {
						shape.x += dx;
						shape.y += dy;
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
			const style = this.getDrawingStyle ? this.getDrawingStyle() : { strokeFill: "#ffffff", strokeWidth: 2 };
			this.engine.ctx.strokeStyle = style.strokeFill;
			this.engine.ctx.lineWidth = style.strokeWidth;
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
		const style = this.getDrawingStyle ? this.getDrawingStyle() : { strokeFill: "#ffffff", strokeWidth: 2 };
		this.engine.ctx.strokeStyle = style.strokeFill;
		this.engine.ctx.lineWidth = style.strokeWidth;

		if (this.selectedTool === "rect") {
			this.engine.ctx.strokeRect(this.startX, this.startY, width, height);
		} else if (this.selectedTool === "circleOrOval") {
			const centerX = this.startX + width / 2;
			const centerY = this.startY + height / 2;
			this.engine.ctx.beginPath();
			this.engine.ctx.ellipse(
				centerX,
				centerY,
				Math.abs(width) / 2,
				Math.abs(height) / 2,
				0,
				0,
				Math.PI * 2
			);
			this.engine.ctx.stroke();
			this.engine.ctx.closePath();
		} else if (this.selectedTool === "line") {
			this.engine.ctx.beginPath();
			this.engine.ctx.moveTo(this.startX, this.startY);
			this.engine.ctx.lineTo(endX, endY);
			this.engine.ctx.stroke();
			this.engine.ctx.closePath();
		} else if (this.selectedTool === "arrow") {
			this.engine.ctx.beginPath();
			this.engine.ctx.moveTo(this.startX, this.startY);
			this.engine.ctx.lineTo(endX, endY);
			this.engine.ctx.stroke();
			// Draw arrowhead
			const headlen = 18;
			const angle = Math.atan2(endY - this.startY, endX - this.startX);
			this.engine.ctx.beginPath();
			this.engine.ctx.moveTo(endX, endY);
			this.engine.ctx.lineTo(
				endX - headlen * Math.cos(angle - Math.PI / 7),
				endY - headlen * Math.sin(angle - Math.PI / 7)
			);
			this.engine.ctx.moveTo(endX, endY);
			this.engine.ctx.lineTo(
				endX - headlen * Math.cos(angle + Math.PI / 7),
				endY - headlen * Math.sin(angle + Math.PI / 7)
			);
			this.engine.ctx.stroke();
		} else if (this.selectedTool === "diamond") {
			this.engine.ctx.beginPath();
			this.engine.ctx.lineJoin = "round";
			this.engine.ctx.lineCap = "round";
			this.engine.ctx.moveTo(this.startX + width / 2, this.startY); // Top
			this.engine.ctx.lineTo(this.startX + width, this.startY + height / 2); // Right
			this.engine.ctx.lineTo(this.startX + width / 2, this.startY + height); // Bottom
			this.engine.ctx.lineTo(this.startX, this.startY + height / 2); // Left
			this.engine.ctx.closePath();
			this.engine.ctx.stroke();
		}
		this.engine.ctx.restore();
	};

	initMouseHandlers() {
		this.canvas.addEventListener("mousedown", this.mouseDownHandler);
		this.canvas.addEventListener("mouseup", this.mouseUpHandler);
		this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
	}

	getHandleCursor(handleIdx: number): string {
		switch (handleIdx) {
			case 0:
				return "nwse-resize";
			case 1:
				return "ns-resize";
			case 2:
				return "nesw-resize";
			case 3:
				return "ew-resize";
			case 4:
				return "nwse-resize";
			case 5:
				return "ns-resize";
			case 6:
				return "nesw-resize";
			case 7:
				return "ew-resize";
			default:
				return "default";
		}
	}

	drawSelectionFrameAndHandles(shape: Shape) {
		drawFrameHandles(this.engine.ctx, shape, this.handleSize);
	}
}
