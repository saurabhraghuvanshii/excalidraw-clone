import { Shape } from '../draw/CanvasEngine';
import { getShapeBounds } from '../draw/utils';

export function drawSelectionFrameAndHandles(ctx: CanvasRenderingContext2D, shape: Shape, handleSize: number) {
    ctx.save();
    ctx.strokeStyle = "#60A5FA";
    ctx.lineWidth = 2;
    let bounds = getShapeBounds(shape);
    if (!bounds) return;
    const { x, y, width, height } = bounds;

    const margin = 8;

    ctx.strokeRect(x - margin, y - margin, width + margin * 2, height + margin * 2);

    if (shape.type === "text") {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x - margin, y - margin, width + margin * 2, height + margin * 2);
        ctx.setLineDash([]);
        ctx.restore();
    }
    const hs = handleSize / 1;
    const handles = [
        [x - margin, y - margin],
        [x + (width / 2), y - margin],
        [x + width + margin, y - margin],
        [x + width + margin, y + (height / 2)],
        [x + width + margin, y + height + margin],
        [x + (width / 2), y + height + margin],
        [x - margin, y + height + margin],
        [x - margin, y + (height / 2)],
    ];
    ctx.fillStyle = "#60A5FA";
    for (let [hx, hy] of handles) {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.restore();
}
 