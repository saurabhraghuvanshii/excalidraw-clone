import { Shape } from '../CanvasEngine';

export function drawCircleOrOVal(ctx: CanvasRenderingContext2D, shape: Shape) {
    if (shape.type !== 'circleOrOval') return;
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
    ctx.closePath();
}


export function isPointInCircleOrOval(x: number, y: number, shape: Shape, buffer: number = 10): boolean {
    if (shape.type !== 'circleOrOval') return false;

    const dx = (x - shape.centerX) / (shape.radiusX + buffer);
    const dy = (y - shape.centerY) / (shape.radiusY + buffer);
    return dx * dx + dy * dy <= 1;
}

export function resizeCircleOrOval(shape: Shape, handleIdx: number, px: number, py: number) {
    if (shape.type !== 'circleOrOval') return;

    const cx = shape.centerX;
    const cy = shape.centerY;
    let dx = px - cx;
    let dy = py - cy;

    const minSize = 10;

    switch (handleIdx) {
        case 0: // TL
        case 4: // BR
        case 2: // TR
        case 6: // BL
            shape.radiusX = Math.max(Math.abs(dx), minSize / 2);
            shape.radiusY = Math.max(Math.abs(dy), minSize / 2);
            break;
        case 1: // TC
        case 5: // BC
            shape.radiusY = Math.max(Math.abs(dy), minSize / 2);
            break;
        case 3: // RC
        case 7: // LC
            shape.radiusX = Math.max(Math.abs(dx), minSize / 2);
            break;
    }
}
