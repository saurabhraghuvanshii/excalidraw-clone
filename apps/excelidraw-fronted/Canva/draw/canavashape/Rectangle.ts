import { Shape } from "../CanvasEngine";
import rough from "roughjs/bin/rough";

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.arcTo(x + width, y, x + width, y + radius, radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
	ctx.lineTo(x + radius, y + height);
	ctx.arcTo(x, y + height, x, y + height - radius, radius);
	ctx.lineTo(x, y + radius);
	ctx.arcTo(x, y, x + radius, y, radius);
	ctx.closePath();
}

export function drawRectangle(
	ctx: CanvasRenderingContext2D,
	shape: Shape & { fillStyle?: string }
) {
	if (shape.type !== "rect") return;
	ctx.save();

	const fillStyle = shape.fillStyle || "architect";

	// Always draw fill first (solid, not roughjs fill)
	if (shape.fillColor && shape.fillColor !== "transparent") {
		ctx.fillStyle = shape.fillColor;
		if (shape.strokeEdge === "round") {
			drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, 16);
			ctx.fill();
		} else {
			ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
		}
	}

	// Now draw the stroke
	if (fillStyle === "artist" || fillStyle === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);

		const shouldRegenerate = !shape.roughDrawable || 
                            shape.roughDrawable._lastX !== shape.x ||
                            shape.roughDrawable._lastY !== shape.y ||
                            shape.roughDrawable._lastWidth !== shape.width ||
                            shape.roughDrawable._lastHeight !== shape.height ||
                            shape.roughDrawable._lastStrokeColor !== shape.strokeColor ||
                            shape.roughDrawable._lastStrokeWidth !== shape.strokeWidth ||
                            shape.roughDrawable._lastFillStyle !== fillStyle;

		if (shouldRegenerate) {
			const generator = rough.generator();
			const roughness = fillStyle === "artist" ? 2 : 3.5;
			
			// Generate and cache the rough drawable
			shape.roughDrawable = generator.rectangle(shape.x, shape.y, shape.width, shape.height, {
				stroke: shape.strokeColor || "#1e1e1e",
				strokeWidth: shape.strokeWidth || 2,
				fill: undefined,
				roughness: roughness,
				seed: shape.id ? parseInt(shape.id.replace(/\D/g, '').substring(0, 8) || '42', 10) : 42, // Use a consistent seed based on shape ID
			});

			shape.roughDrawable._lastX = shape.x;
			shape.roughDrawable._lastY = shape.y;
			shape.roughDrawable._lastWidth = shape.width;
			shape.roughDrawable._lastHeight = shape. height;
			shape.roughDrawable._lastStrokeColor = shape.strokeColor;
			shape.roughDrawable._lastStrokeWidth = shape.strokeWidth;
			shape.roughDrawable._lastFillStyle = fillStyle;
		}

		rc.draw(shape.roughDrawable);
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
		drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, 16);
		ctx.stroke();
	} else {
		ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
	}
	ctx.restore();
}

export function isPointInRectangle(
	x: number,
	y: number,
	shape: Shape,
	buffer: number = 10
): boolean {
	if (shape.type !== "rect") return false;
	return (
		x >= shape.x - buffer &&
		x <= shape.x + shape.width + buffer &&
		y >= shape.y - buffer &&
		y <= shape.y + shape.height + buffer
	);
}

export function resizeRectangle(
	shape: Shape,
	handleIdx: number,
	px: number,
	py: number
) {
	if (shape.type !== "rect") return;
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
	shape.roughDrawable = undefined;
}
