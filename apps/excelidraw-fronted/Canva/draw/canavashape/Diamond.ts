import { Shape } from "../CanvasEngine";
import { getShapeBounds } from "../../utils/utils";
import {
	rough,
	getRoughSeed,
	shouldRegenerateRoughDrawable,
	cacheRoughDrawable,
} from "../../utils/ShapeDrawUtils";

function drawRoundedDiamond(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	// Handle negative dimensions by converting to absolute values
	const absWidth = Math.abs(width);
	const absHeight = Math.abs(height);

	// Return early if dimensions are too small
	if (absWidth < 2 || absHeight < 2) {
		return;
	}

	// Calculate center point and half dimensions
	const centerX = x + absWidth / 2;
	const centerY = y + absHeight / 2;
	const halfWidth = absWidth / 2;
	const halfHeight = absHeight / 2;

	// Ensure radius is positive and appropriately limited
	const maxRadius = Math.max(1, Math.min(halfWidth, halfHeight) * 0.2);
	const r = Math.max(0.1, Math.min(Math.abs(radius), maxRadius));

	// Define the four points of the diamond
	const topPoint = { x: centerX, y: centerY - halfHeight };
	const rightPoint = { x: centerX + halfWidth, y: centerY };
	const bottomPoint = { x: centerX, y: centerY + halfHeight };
	const leftPoint = { x: centerX - halfWidth, y: centerY };

	// Begin drawing the path
	ctx.beginPath();

	const distLeftTop = Math.max(
		1,
		Math.sqrt(
			Math.pow(leftPoint.x - topPoint.x, 1) + Math.pow(leftPoint.y - topPoint.y, 2)
		)
	);

	const offsetRatio = Math.min(r / distLeftTop, 0.3); // Limit to 30% of distance

	// Calculate starting point
	const startX = leftPoint.x + (topPoint.x - leftPoint.x) * offsetRatio;
	const startY = leftPoint.y + (topPoint.y - leftPoint.y) * offsetRatio;

	// Start drawing
	ctx.moveTo(startX, startY);

	// Use safer arc drawing with direct control points
	ctx.arcTo(topPoint.x, topPoint.y, rightPoint.x, rightPoint.y, r);
	ctx.arcTo(rightPoint.x, rightPoint.y, bottomPoint.x, bottomPoint.y, r);
	ctx.arcTo(bottomPoint.x, bottomPoint.y, leftPoint.x, leftPoint.y, r);
	ctx.arcTo(leftPoint.x, leftPoint.y, topPoint.x, topPoint.y, r);

	// Close the path
	ctx.closePath();
}

export function drawDiamond(
	ctx: CanvasRenderingContext2D,
	shape: Shape & { fillStyle?: string }
) {
	if (shape.type !== "diamond") return;
	ctx.save();

	const fillStyle = shape.fillStyle || "architect";

	// Always draw fill first (solid, not roughjs fill)
	if (shape.fillColor && shape.fillColor !== "transparent") {
		ctx.fillStyle = shape.fillColor;
		if (shape.strokeEdge === "round") {
			drawRoundedDiamond(ctx, shape.x, shape.y, shape.width, shape.height, 16);
			ctx.fill();
		} else {
			ctx.beginPath();
			ctx.moveTo(shape.x + shape.width / 2, shape.y); // Top
			ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2); // Right
			ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height); // Bottom
			ctx.lineTo(shape.x, shape.y + shape.height / 2); // Left
			ctx.closePath();
			ctx.fill();
		}
	}

	if (fillStyle === "artist" || fillStyle === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);
		const keys = ["x", "y", "width", "height", "strokeColor", "strokeWidth"];
		const shouldRegen = shouldRegenerateRoughDrawable(shape, keys, fillStyle);
		if (shouldRegen) {
			const generator = rough.generator();
			const roughness = fillStyle === "artist" ? 2 : 3.5;
			(shape as any).roughDrawable = generator.polygon(
				[
					[shape.x + shape.width / 2, shape.y],
					[shape.x + shape.width, shape.y + shape.height / 2],
					[shape.x + shape.width / 2, shape.y + shape.height],
					[shape.x, shape.y + shape.height / 2],
				],
				{
					stroke: shape.strokeColor || "#1e1e1e",
					strokeWidth: shape.strokeWidth || 2,
					fill: undefined,
					roughness: roughness,
					seed: getRoughSeed(shape.id),
				}
			);
			cacheRoughDrawable(shape, keys, fillStyle);
		}
		rc.draw((shape as any).roughDrawable);
		ctx.restore();
		return;
	}

	// Default architect style (clean canvas stroke)
	ctx.strokeStyle = shape.strokeColor || "#1e1e1e";
	ctx.lineWidth = shape.strokeWidth || 2;
	if (shape.strokeEdge === "round") {
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
	} else {
		ctx.lineJoin = "miter";
		ctx.lineCap = "butt";
	}
	if (shape.strokeStyle === "dashed") {
		ctx.setLineDash([8, 6]);
	} else if (shape.strokeStyle === "dotted") {
		ctx.setLineDash([2, 6]);
	} else {
		ctx.setLineDash([]);
	}

	if (shape.strokeEdge === "round") {
		drawRoundedDiamond(ctx, shape.x, shape.y, shape.width, shape.height, 16);
		ctx.stroke();
	} else {
		ctx.beginPath();
		ctx.moveTo(shape.x + shape.width / 2, shape.y); // Top
		ctx.lineTo(shape.x + shape.width, shape.y + shape.height / 2); // Right
		ctx.lineTo(shape.x + shape.width / 2, shape.y + shape.height); // Bottom
		ctx.lineTo(shape.x, shape.y + shape.height / 2); // Left
		ctx.closePath();
		ctx.stroke();
	}
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
