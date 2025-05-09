import { Shape } from "../CanvasEngine";
import {
	rough,
	getRoughSeed,
	shouldRegenerateRoughDrawable,
	cacheRoughDrawable,
	getRoughFillOptions,
} from "../../utils/ShapeDrawUtils";

// Extend Shape type locally to include roughFillDrawable and roughStrokeDrawable
// Use 'type' instead of 'interface' for proper extension

type RectangleShape = Shape & {
	fillStyle?: string;
	roughFillDrawable?: any;
	roughStrokeDrawable?: any;
};

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
	shape: RectangleShape
) {
	if (shape.type !== "rect") return;
	ctx.save();

	const strokeSlopiness = shape.strokeStyle || "architect";
	const strokeWidth = shape.strokeWidth || 2;
	const fillStyle = shape.fillStyle;

	// --- FILL ---
	if (shape.fillColor && shape.fillColor !== "transparent") {
		if (fillStyle === "hachure" || fillStyle === "zigzag") {
			ctx.save();
			// Clip to the rectangle path
			if (shape.strokeEdge === "round") {
				drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, 16);
				ctx.clip();
			} else {
				ctx.beginPath();
				ctx.rect(shape.x, shape.y, shape.width, shape.height);
				ctx.clip();
			}
			const rc = rough.canvas(ctx.canvas);
			const fillKeys = ["x", "y", "width", "height", "fillColor", "fillStyle"];
			const shouldRegenFill = shouldRegenerateRoughDrawable(
				shape,
				fillKeys,
				"fill-" + fillStyle,
				"roughFillDrawable"
			);
			if (shouldRegenFill) {
				const generator = rough.generator();
				shape.roughFillDrawable = generator.rectangle(
					shape.x,
					shape.y,
					shape.width,
					shape.height,
					getRoughFillOptions(fillStyle, shape)
				);
				cacheRoughDrawable(
					shape,
					fillKeys,
					"fill-" + fillStyle,
					"roughFillDrawable"
				);
			}
			if (shape.roughFillDrawable) {
				rc.draw(shape.roughFillDrawable);
			}
			ctx.restore();
		} else {
			ctx.fillStyle = shape.fillColor;
			if (shape.strokeEdge === "round") {
				drawRoundedRect(ctx, shape.x, shape.y, shape.width, shape.height, 16);
				ctx.fill();
			} else {
				ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
			}
		}
	}

	// --- STROKE ---
	if (strokeSlopiness === "artist" || strokeSlopiness === "cartoonist") {
		const rc = rough.canvas(ctx.canvas);
		const strokeKeys = [
			"x",
			"y",
			"width",
			"height",
			"strokeColor",
			"strokeWidth",
			"strokeStyle",
			"strokeSlopiness",
		];
		const shouldRegenStroke = shouldRegenerateRoughDrawable(
			shape,
			strokeKeys,
			"stroke-" + strokeSlopiness,
			"roughStrokeDrawable"
		);
		if (shouldRegenStroke) {
			const generator = rough.generator();
			const roughness = strokeSlopiness === "artist" ? 2 : 3.5;
			shape.roughStrokeDrawable = generator.rectangle(
				shape.x + strokeWidth / 2,
				shape.y + strokeWidth / 2,
				shape.width - strokeWidth,
				shape.height - strokeWidth,
				{
					stroke: shape.strokeColor || "#1e1e1e",
					strokeWidth: strokeWidth,
					fill: undefined,
					roughness: roughness,
					seed: getRoughSeed(shape.id),
				}
			);
			cacheRoughDrawable(
				shape,
				strokeKeys,
				"stroke-" + strokeSlopiness,
				"roughStrokeDrawable"
			);
		}
		if (shape.roughStrokeDrawable) {
			rc.draw(shape.roughStrokeDrawable);
		}
		ctx.restore();
		return;
	}

	// --- Default architect style (clean canvas stroke) ---
	ctx.strokeStyle = shape.strokeColor || "#1e1e1e";
	ctx.lineWidth = strokeWidth;
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
		drawRoundedRect(
			ctx,
			shape.x + strokeWidth / 2,
			shape.y + strokeWidth / 2,
			shape.width - strokeWidth,
			shape.height - strokeWidth,
			16
		);
		ctx.stroke();
	} else {
		ctx.strokeRect(
			shape.x + strokeWidth / 2,
			shape.y + strokeWidth / 2,
			shape.width - strokeWidth,
			shape.height - strokeWidth
		);
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
