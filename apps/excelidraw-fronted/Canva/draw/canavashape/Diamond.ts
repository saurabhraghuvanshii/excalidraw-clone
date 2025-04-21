import { Shape } from '../CanvasEngine';

export function drawDiamond(ctx: CanvasRenderingContext2D, shape: Shape & { type: 'diamond' }) {
    const { x, y, width, height } = shape;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const curve = 0.3; // 0 = sharp, 0.5 = very curved

    ctx.save();
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Four points
    const top = { x: cx, y: y };
    const right = { x: x + width, y: cy };
    const bottom = { x: cx, y: y + height };
    const left = { x: x, y: cy };

    // Control points for curves (bulge outwards)
    const topRight = { x: cx + (right.x - cx) * curve, y: y + (cy - y) * curve };
    const rightBottom = { x: x + width - (x + width - cx) * curve, y: cy + (y + height - cy) * curve };
    const bottomLeft = { x: cx - (cx - x) * curve, y: y + height - (y + height - cy) * curve };
    const leftTop = { x: x + (cx - x) * curve, y: cy - (cy - y) * curve };

    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo(topRight.x, topRight.y, right.x, right.y);
    ctx.quadraticCurveTo(rightBottom.x, rightBottom.y, bottom.x, bottom.y);
    ctx.quadraticCurveTo(bottomLeft.x, bottomLeft.y, left.x, left.y);
    ctx.quadraticCurveTo(leftTop.x, leftTop.y, top.x, top.y);

    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

export function isPointInDiamond(px: number, py: number, shape: Shape & { type: 'diamond' }, buffer = 0) {
    const { x, y, width, height } = shape;
    // Transform point to diamond's local coordinates
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    // Diamond equation: dx/width + dy/height <= 0.5
    return (dx / (width / 2 + buffer) + dy / (height / 2 + buffer)) <= 1;
}

export function resizeDiamond(shape: Shape & { type: 'diamond' }, handleIdx: number, px: number, py: number) {
    // Use the same logic as rectangle for resizing
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
 