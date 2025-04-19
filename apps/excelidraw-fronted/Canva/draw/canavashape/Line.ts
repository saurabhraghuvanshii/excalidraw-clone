import { Shape } from '../CanvasEngine';

export function drawLine(ctx: CanvasRenderingContext2D, shape: Shape) {
    if (shape.type !== 'line') return;
    ctx.beginPath();
    ctx.moveTo(shape.startX, shape.startY);
    ctx.lineTo(shape.endX, shape.endY);
    ctx.stroke();
    ctx.closePath();
}

export function isPointNearLine(x: number, y: number, shape: Shape): boolean {
    if (shape.type !== 'line') return false;
    
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
    return distance < 10; // 10px buffer for lines
}

export function resizeLine(shape: Shape, handleIdx: number, px: number, py: number) {
    if (shape.type !== 'line') return;

    const minX = Math.min(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxX = Math.max(shape.startX, shape.endX);
    const maxY = Math.max(shape.startY, shape.endY);
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (shape.startX + shape.endX) / 2;
    const centerY = (shape.startY + shape.endY) / 2;

    let scaleX = 1, scaleY = 1;

    // Determine scale based on handle index (same logic as freehand)
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
