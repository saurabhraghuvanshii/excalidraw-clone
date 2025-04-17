
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getShapeBounds(shape: any): { x: number; y: number; width: number; height: number } | null {
    if (shape.type === "rect") {
        return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    } else if (shape.type === "circle") {
        return {
            x: shape.centerX - shape.radius,
            y: shape.centerY - shape.radius,
            width: shape.radius * 2,
            height: shape.radius * 2
        };
    } else if (shape.type === "line") {
        const x = Math.min(shape.startX, shape.endX);
        const y = Math.min(shape.startY, shape.endY);
        const width = Math.abs(shape.endX - shape.startX);
        const height = Math.abs(shape.endY - shape.startY);
        return { x, y, width, height };
    } else if (shape.type === "freehand") {
        const xs = shape.points.map((p: any) => p.x);
        const ys = shape.points.map((p: any) => p.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - x;
        const height = Math.max(...ys) - y;
        return { x, y, width, height };
    }
    return null;
} 
