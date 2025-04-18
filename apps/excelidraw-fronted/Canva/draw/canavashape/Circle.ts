import { Shape } from '../CanvasEngine';

export function drawCircle(ctx: CanvasRenderingContext2D, shape: Shape) {
    if (shape.type !== 'circle') return;
    ctx.beginPath();
    ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
}

export function isPointInCircle(x: number, y: number, shape: Shape, buffer: number = 10): boolean {
    if (shape.type !== 'circle') return false;
    const dx = x - shape.centerX;
    const dy = y - shape.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= shape.radius + buffer;
}

export function resizeCircle(shape: Shape, px: number, py: number) {
    if (shape.type !== 'circle') return;
    const cx = shape.centerX;
    const cy = shape.centerY;
    const dx = px - cx;
    const dy = py - cy;
    const minSize = 10;
    shape.radius = Math.max(Math.sqrt(dx * dx + dy * dy), minSize / 2);
}
