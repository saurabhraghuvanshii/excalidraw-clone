import { Shape } from "../CanvasEngine";
import { rough, getRoughSeed } from "../../utils/ShapeDrawUtils";

export function drawFreehand(
	ctx: CanvasRenderingContext2D,
	shape: Shape & { fillStyle?: string }
) {
	if (shape.type !== "freehand" || !shape.points.length) return;

	ctx.save();

	const fillStyle = shape.fillStyle || "architect";

	if (fillStyle === "artist" || fillStyle === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);
		const keys = ["points", "strokeColor", "strokeWidth"];
		// For points, use a hash (stringify)
		const pointsHash = JSON.stringify(shape.points);
		const shouldRegen =
			!(shape as any).roughDrawable ||
			(shape as any).roughDrawable._lastPointsHash !== pointsHash ||
			(shape as any).roughDrawable._lastStrokeColor !== shape.strokeColor ||
			(shape as any).roughDrawable._lastStrokeWidth !== shape.strokeWidth ||
			(shape as any).roughDrawable._lastFillStyle !== fillStyle;
		if (shouldRegen) {
			const generator = rough.generator();
			const roughness = fillStyle === "artist" ? 2 : 3.5;
			(shape as any).roughDrawable = generator.linearPath(
				shape.points.map((p: any) => [p.x, p.y]),
				{
					stroke: shape.strokeColor || "#1e1e1e",
					strokeWidth: shape.strokeWidth || 2,
					roughness: roughness,
					seed: getRoughSeed(shape.id),
				}
			);
			(shape as any).roughDrawable._lastPointsHash = pointsHash;
			(shape as any).roughDrawable._lastStrokeColor = shape.strokeColor;
			(shape as any).roughDrawable._lastStrokeWidth = shape.strokeWidth;
			(shape as any).roughDrawable._lastFillStyle = fillStyle;
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
	ctx.moveTo(shape.points[0].x, shape.points[0].y);

	for (let i = 1; i < shape.points.length; i++) {
		ctx.lineTo(shape.points[i].x, shape.points[i].y);
	}

	ctx.stroke();
	ctx.restore();
}

export function isPointNearFreehand(
	x: number,
	y: number,
	shape: Shape
): boolean {
	if (shape.type !== "freehand") return false;
	const points = shape.points;
	for (let i = 1; i < points.length; i++) {
		// Check distance from (x, y) to the segment between points[i-1] and points[i]
		const A = x - points[i - 1].x;
		const B = y - points[i - 1].y;
		const C = points[i].x - points[i - 1].x;
		const D = points[i].y - points[i - 1].y;
		const dot = A * C + B * D;
		const len_sq = C * C + D * D;
		const param = len_sq !== 0 ? dot / len_sq : -1;
		let xx, yy;
		if (param < 0) {
			xx = points[i - 1].x;
			yy = points[i - 1].y;
		} else if (param > 1) {
			xx = points[i].x;
			yy = points[i].y;
		} else {
			xx = points[i - 1].x + param * C;
			yy = points[i - 1].y + param * D;
		}
		const dx = x - xx;
		const dy = y - yy;
		if (Math.sqrt(dx * dx + dy * dy) < 10) return true; // 10px buffer
	}
	return false;
}

export function resizeFreehand(
	shape: Shape,
	handleIdx: number,
	px: number,
	py: number
) {
	if (shape.type !== "freehand") return;
	// Scale all points relative to center
	const xs = shape.points.map((p) => p.x);
	const ys = shape.points.map((p) => p.y);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	const width = Math.max(...xs) - x;
	const height = Math.max(...ys) - y;
	const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
	const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
	let scaleX = 1,
		scaleY = 1;
	if (handleIdx === 0 || handleIdx === 6 || handleIdx === 7) {
		// left handles
		scaleX = (x + width - px) / width;
	} else if (handleIdx === 2 || handleIdx === 3 || handleIdx === 4) {
		// right handles
		scaleX = (px - x) / width;
	}
	if (handleIdx === 0 || handleIdx === 1 || handleIdx === 2) {
		// top handles
		scaleY = (y + height - py) / height;
	} else if (handleIdx === 4 || handleIdx === 5 || handleIdx === 6) {
		// bottom handles
		scaleY = (py - y) / height;
	}
	for (const pt of shape.points) {
		pt.x = centerX + (pt.x - centerX) * scaleX;
		pt.y = centerY + (pt.y - centerY) * scaleY;
	}
}
