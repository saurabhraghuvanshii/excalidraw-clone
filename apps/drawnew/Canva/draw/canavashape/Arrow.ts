import { Shape } from "../CanvasEngine";
import {
	rough,
	getRoughSeed,
	shouldRegenerateRoughDrawable,
	cacheRoughDrawable,
} from "../../utils/ShapeDrawUtils";

export function drawArrow(
	ctx: CanvasRenderingContext2D,
	shape: Shape & { fillStyle?: string }
) {
	if (shape.type !== "arrow") return;
	const { startX, startY, endX, endY } = shape;

	ctx.save();

	if (shape.strokeStyle === "artist" || shape.strokeStyle === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);
		const keys = [
			"startX",
			"startY",
			"endX",
			"endY",
			"strokeColor",
			"strokeWidth",
			"strokeStyle",
		];
		const shouldRegen = shouldRegenerateRoughDrawable(
			shape,
			keys,
			shape.strokeStyle
		);
		if (shouldRegen) {
			const generator = rough.generator();
			const roughness = shape.strokeStyle === "artist" ? 1 : 2;
			(shape as any).roughDrawable = generator.line(startX, startY, endX, endY, {
				stroke: shape.strokeColor || "#1e1e1e",
				strokeWidth: shape.strokeWidth || 2,
				roughness: roughness,
				seed: getRoughSeed(shape.id),
			});
			cacheRoughDrawable(shape, keys, shape.strokeStyle);
		}
		rc.draw((shape as any).roughDrawable);
	} else {
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
		// Draw main line
		ctx.beginPath();
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	}

	// Draw arrowhead (always architect style for consistency)
	const headlen = 18; // length of head in pixels
	const angle = Math.atan2(endY - startY, endX - startX);

	ctx.beginPath();
	ctx.moveTo(endX, endY);
	ctx.lineTo(
		endX - headlen * Math.cos(angle - Math.PI / 7),
		endY - headlen * Math.sin(angle - Math.PI / 7)
	);
	ctx.moveTo(endX, endY);
	ctx.lineTo(
		endX - headlen * Math.cos(angle + Math.PI / 7),
		endY - headlen * Math.sin(angle + Math.PI / 7)
	);
	ctx.stroke();

	ctx.restore();
}

export function isPointNearArrow(x: number, y: number, shape: Shape): boolean {
	if (shape.type !== "arrow") return false;
	// Use the same logic as isPointNearLine
	const A = x - shape.startX;
	const B = y - shape.startY;
	const C = shape.endX - shape.startX;
	const D = shape.endY - shape.startY;
	const dot = A * C + B * D;
	const len_sq = C * C + D * D;
	const param = len_sq !== 0 ? dot / len_sq : -1;
	let xx, yy;
	if (param < 0) {
		xx = shape.startX;
		yy = shape.startY;
	} else if (param > 1) {
		xx = shape.endX;
		yy = shape.endY;
	} else {
		xx = shape.startX + param * C;
		yy = shape.startY + param * D;
	}
	const dx = x - xx;
	const dy = y - yy;
	const distance = Math.sqrt(dx * dx + dy * dy);
	return distance < 10; // 10px buffer for arrows
}

export function resizeArrow(
	shape: Shape & { type: "arrow" },
	handleIdx: number,
	px: number,
	py: number
) {
	if (shape.type !== "arrow") return;

	const minX = Math.min(shape.startX, shape.endX);
	const minY = Math.min(shape.startY, shape.endY);
	const maxX = Math.max(shape.startX, shape.endX);
	const maxY = Math.max(shape.startY, shape.endY);
	const width = maxX - minX;
	const height = maxY - minY;
	const centerX = (shape.startX + shape.endX) / 2;
	const centerY = (shape.startY + shape.endY) / 2;

	let scaleX = 1,
		scaleY = 1;
	if (handleIdx === 0 || handleIdx === 6 || handleIdx === 7) {
		scaleX = (minX + width - px) / width;
	} else if (handleIdx === 2 || handleIdx === 3 || handleIdx === 4) {
		scaleX = (px - minX) / width;
	}
	if (handleIdx === 0 || handleIdx === 1 || handleIdx === 2) {
		scaleY = (minY + height - py) / height;
	} else if (handleIdx === 4 || handleIdx === 5 || handleIdx === 6) {
		scaleY = (py - minY) / height;
	}
	// Scale both points relative to center
	const scalePoint = (x: number, y: number) => ({
		x: centerX + (x - centerX) * scaleX,
		y: centerY + (y - centerY) * scaleY,
	});

	const newStart = scalePoint(shape.startX, shape.startY);
	const newEnd = scalePoint(shape.endX, shape.endY);
	shape.startX = newStart.x;
	shape.startY = newStart.y;
	shape.endX = newEnd.x;
	shape.endY = newEnd.y;
}
