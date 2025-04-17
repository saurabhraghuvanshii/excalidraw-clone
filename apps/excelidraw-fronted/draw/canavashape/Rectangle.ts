import { Shape } from '../Game';

export function drawRectangle(ctx: CanvasRenderingContext2D, shape: Shape) {
    if (shape.type !== 'rect') return;
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
}

export function isPointInRectangle(x: number, y: number, shape: Shape, buffer: number = 10): boolean {
    if (shape.type !== 'rect') return false;
    return (
        x >= shape.x - buffer &&
        x <= shape.x + shape.width + buffer &&
        y >= shape.y - buffer &&
        y <= shape.y + shape.height + buffer
    );
}

export function resizeRectangle(shape: Shape, handleIdx: number, px: number, py: number) {
    if (shape.type !== 'rect') return;
    let { x, y, width, height } = shape;
    let minSize = 10;
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
}
