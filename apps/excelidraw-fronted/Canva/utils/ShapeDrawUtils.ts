import rough from "roughjs/bin/rough";

export function getRoughSeed(id?: string) {
	return id
		? parseInt(String(id).replace(/\D/g, "").substring(0, 8) || "42", 10)
		: 42;
}

export function shouldRegenerateRoughDrawable(
	shape: any,
	keys: string[],
	fillStyle: string
) {
	if (!shape.roughDrawable) return true;
	for (const key of keys) {
		if (shape.roughDrawable[`_last${key}`] !== shape[key]) return true;
	}
	if (shape.roughDrawable._lastFillStyle !== fillStyle) return true;
	return false;
}

export function cacheRoughDrawable(
	shape: any,
	keys: string[],
	fillStyle: string
) {
	for (const key of keys) {
		shape.roughDrawable[`_last${key}`] = shape[key];
	}
	shape.roughDrawable._lastFillStyle = fillStyle;
}

export function getRoughFillOptions(fillStyle: string, shape: any) {
	if (fillStyle === "hachure") {
		return {
			fill: shape.fillColor || undefined,
			fillStyle: "hachure",
			stroke: shape.strokeColor || "#1e1e1e",
			strokeWidth: shape.strokeWidth || 2,
			hachureGap: 6,
			hachureAngle: 60,
			seed: getRoughSeed(shape.id),
		};
	} else if (fillStyle === "zigzag") {
		return {
			fill: shape.fillColor || undefined,
			fillStyle: "zigzag",
			stroke: shape.strokeColor || "#1e1e1e",
			strokeWidth: shape.strokeWidth || 2,
			hachureGap: 6,
			hachureAngle: 60,
			seed: getRoughSeed(shape.id),
		};
	}
	return {
		fill: undefined,
		stroke: shape.strokeColor || "#1e1e1e",
		strokeWidth: shape.strokeWidth || 2,
		seed: getRoughSeed(shape.id),
	};
}

export { rough };
