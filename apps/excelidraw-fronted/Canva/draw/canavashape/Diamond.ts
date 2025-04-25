import { Shape } from "../CanvasEngine";
import { getShapeBounds } from "../utils";

export function drawDiamond(ctx: CanvasRenderingContext2D, shape: Shape) {
	if (shape.type !== "diamond") return;
	ctx.save();

	// Set stroke style
	ctx.strokeStyle = shape.strokeColor || "#1e1e1e";
	ctx.lineWidth = shape.strokeWidth || 2;
	if (shape.strokeEdge) {
		ctx.lineJoin = shape.strokeEdge as CanvasLineJoin;
		ctx.lineCap = shape.strokeEdge as CanvasLineCap;
	}
	if (shape.strokeStyle === "dashed") {
		ctx.setLineDash([8, 6]);
	} else if (shape.strokeStyle === "dotted") {
		ctx.setLineDash([2, 6]);
	} else {
		ctx.setLineDash([]);
	}

	ctx.beginPath();
	ctx.moveTo(shape.x + shape.width / 2, shape.y); // Top
	ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2); // Right
	ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height); // Bottom
	ctx.lineTo(shape.x, shape.y + shape.height / 2); // Left
	ctx.closePath();

	// Draw fill if specified
	if (shape.fillColor && shape.fillColor !== "transparent") {
		ctx.fillStyle = shape.fillColor;
		ctx.fill();
	}

	// Draw stroke
	ctx.stroke();
	ctx.restore();
}

export function isPointInDiamond(
	px: number,
	py: number,
	shape: Shape & { type: "diamond" },
	buffer = 0
) {
	const bounds = getShapeBounds(shape); // Using bounds check first for optimization
	if (!bounds) return false;

	if (
		px < bounds.x - buffer ||
		px > bounds.x + bounds.width + buffer ||
		py < bounds.y - buffer ||
		py > bounds.y + bounds.height + buffer
	) {
		return false;
	}

	const { x, y, width, height } = shape;
	// Transform point to diamond's local coordinates relative to center
	const cx = x + width / 2;
	const cy = y + height / 2;
	const dx = Math.abs(px - cx);
	const dy = Math.abs(py - cy);

	// Diamond equation check
	return dx / (width / 2 + buffer) + dy / (height / 2 + buffer) <= 1;
}

export function resizeDiamond(
	shape: Shape & { type: "diamond" },
	handleIdx: number,
	px: number,
	py: number
) {
	const { x, y, width, height } = shape;
	const minSize = 10;
	switch (handleIdx) {
		case 0: // TL
			shape.x = px;
			shape.y = py;
			shape.width = x + width - px;
			shape.height = y + height - py;
			break;
		case 1: // TC
			shape.y = py;
			shape.height = y + height - py;
			break;
		case 2: // TR
			shape.y = py;
			shape.width = px - x;
			shape.height = y + height - py;
			break;
		case 3: // RC
			shape.width = px - x;
			break;
		case 4: // BR
			shape.width = px - x;
			shape.height = py - y;
			break;
		case 5: // BC
			shape.height = py - y;
			break;
		case 6: // BL
			shape.x = px;
			shape.width = x + width - px;
			shape.height = py - y;
			break;
		case 7: // LC
			shape.x = px;
			shape.width = x + width - px;
			break;
	}
	// Clamp min size
	if (shape.width < minSize) shape.width = minSize;
	if (shape.height < minSize) shape.height = minSize;

	// Ensure x and y are updated if width/height clamping occurred from a top/left handle
	if (handleIdx === 0 || handleIdx === 6 || handleIdx === 7) {
		if (shape.width === minSize && width > minSize) {
			// Adjust x if clamped from the left
			shape.x = x + (width - minSize);
		}
	}
	if (handleIdx === 0 || handleIdx === 1 || handleIdx === 2) {
		if (shape.height === minSize && height > minSize) {
			// Adjust y if clamped from the top
			shape.y = y + (height - minSize);
		}
	}
}
