import { Shape } from '../Game';

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
    // Calculate distance from point to line segment
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
    // Handles: 0=start, 4=end
    if (handleIdx === 0) {
        shape.startX = px;
        shape.startY = py;
    } else if (handleIdx === 4) {
        shape.endX = px;
        shape.endY = py;
    }
}
