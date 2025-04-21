import { Shape } from '../draw/CanvasEngine';
import { getShapeBounds } from '../draw/utils';

export function drawSelectionFrameAndHandles(ctx: CanvasRenderingContext2D, shape: Shape, handleSize: number) {
    ctx.save();
    ctx.strokeStyle = "#60A5FA";
    ctx.lineWidth = 2;
    let bounds = getShapeBounds(shape);
    if (!bounds) return;
    const { x, y, width, height } = bounds;
    ctx.strokeRect(x, y, width, height);
    if (shape.type === "text") {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
        ctx.restore();
    }
    const hs = handleSize;
    const handles = [
        [x, y],
        [x + width / 2, y],
        [x + width, y],
        [x + width, y + height / 2],
        [x + width, y + height],
        [x + width / 2, y + height],
        [x, y + height],
        [x, y + height / 2],
    ];
    ctx.fillStyle = "#60A5FA";
    for (let [hx, hy] of handles) {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.restore();
}
 