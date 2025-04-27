import { Shape } from "../CanvasEngine";
import {
	rough,
	getRoughSeed,
	shouldRegenerateRoughDrawable,
	cacheRoughDrawable,
} from "../../utils/ShapeDrawUtils";

export function drawCircleOrOVal(
	ctx: CanvasRenderingContext2D,
	shape: Shape & { fillStyle?: string }
) {
	if (shape.type !== "circleOrOval") return;
	ctx.save();

	const fillStyle = shape.fillStyle || "architect";

	// Draw fill if specified
	if (shape.fillColor && shape.fillColor !== "transparent") {
		ctx.fillStyle = shape.fillColor;
		ctx.beginPath();
		ctx.ellipse(
			shape.centerX,
			shape.centerY,
			Math.abs(shape.radiusX),
			Math.abs(shape.radiusY),
			0,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}

	if (fillStyle === "artist" || fillStyle === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);
		const keys = [
			"centerX",
			"centerY",
			"radiusX",
			"radiusY",
			"strokeColor",
			"strokeWidth",
		];
		const shouldRegen = shouldRegenerateRoughDrawable(shape, keys, fillStyle);
		if (shouldRegen) {
			const generator = rough.generator();
			const roughness = fillStyle === "artist" ? 2 : 3.5;
			(shape as any).roughDrawable = generator.ellipse(
				shape.centerX,
				shape.centerY,
				Math.abs(shape.radiusX) * 2,
				Math.abs(shape.radiusY) * 2,
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
	ctx.ellipse(
		shape.centerX,
		shape.centerY,
		Math.abs(shape.radiusX),
		Math.abs(shape.radiusY),
		0,
		0,
		Math.PI * 2
	);
	ctx.stroke();

	ctx.restore();
}

export function isPointInCircleOrOval(
	x: number,
	y: number,
	shape: Shape,
	buffer: number = 10
): boolean {
	if (shape.type !== "circleOrOval") return false;

	// Use bounds check first for optimization, then ellipse formula
	const boundsX = shape.centerX - Math.abs(shape.radiusX);
	const boundsY = shape.centerY - Math.abs(shape.radiusY);
	const boundsWidth = Math.abs(shape.radiusX) * 2;
	const boundsHeight = Math.abs(shape.radiusY) * 2;

	if (
		x < boundsX - buffer ||
		x > boundsX + boundsWidth + buffer ||
		y < boundsY - buffer ||
		y > boundsY + boundsHeight + buffer
	) {
		return false;
	}

	const dx = (x - shape.centerX) / (Math.abs(shape.radiusX) + buffer);
	const dy = (y - shape.centerY) / (Math.abs(shape.radiusY) + buffer);
	return dx * dx + dy * dy <= 1;
}

export function resizeCircleOrOval(
	shape: Shape & { type: "circleOrOval" },
	handleIdx: number,
	px: number,
	py: number
) {
	if (shape.type !== "circleOrOval") return;

	const cx = shape.centerX;
	const cy = shape.centerY;

	const minSize = 10;

	switch (handleIdx) {
		case 0: // TL
		case 4: // BR
		case 2: // TR
		case 6: // BL
			// Resize based on distance from center, scaled by direction
			shape.radiusX = Math.max(Math.abs(px - cx), minSize / 2);
			shape.radiusY = Math.max(Math.abs(py - cy), minSize / 2);
			break;
		case 1: // TC
		case 5: // BC
			shape.radiusY = Math.max(Math.abs(py - cy), minSize / 2);
			break;
		case 3: // RC
		case 7: // LC
			shape.radiusX = Math.max(Math.abs(px - cx), minSize / 2);
			break;
	}

	// Ensure radii are positive
	shape.radiusX = Math.abs(shape.radiusX);
	shape.radiusY = Math.abs(shape.radiusY);
}
