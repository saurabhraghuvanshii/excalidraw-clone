import type { Shape } from "../CanvasEngine";

export function drawText(
    ctx: CanvasRenderingContext2D,
    shape: {
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        id?: string;
    }
) {
    ctx.save();
    const fontSize = shape.fontSize || 24;
    const fontFamily = shape.fontFamily || "Nunito";
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = shape.color || "#fff";
    ctx.textBaseline = "top";
    // Measure text bounding box
    const metrics = ctx.measureText(shape.text);
    shape.width = metrics.width;
    if ('fontBoundingBoxAscent' in metrics && 'fontBoundingBoxDescent' in metrics) {
        shape.height = (metrics.fontBoundingBoxAscent || 0) + (metrics.fontBoundingBoxDescent || 0);
    } else if ('actualBoundingBoxAscent' in metrics && 'actualBoundingBoxDescent' in metrics) {
        const m = metrics as any;
        shape.height = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
    } else {
        shape.height = fontSize;
    }
    // Handle text wrapping
    const words = shape.text.split(' ');
    let line = '';
    let y = shape.y;
    const lineHeight = fontSize * 1.2;
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testMetrics = ctx.measureText(testLine);
        const testWidth = testMetrics.width;
        if (testWidth > shape.width && i > 0) {
            ctx.fillText(line, shape.x, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, shape.x, y);
    ctx.restore();
}

export function isPointInText(
    x: number,
    y: number,
    shape: {
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        id?: string;
    }
): boolean {
    return (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y &&
        y <= shape.y + shape.height
    );
}

export function resizeText(
    shape: {
        type: "text";
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        id?: string;
    },
    handleIdx: number,
    px: number,
    py: number
) {
    // Handle resize from different corners/edges
    switch (handleIdx) {
        case 0: // top-left
            const newWidth1 = shape.width - (px - shape.x);
            const newHeight1 = shape.height - (py - shape.y);
            if (newWidth1 > 40) {
                shape.width = newWidth1;
                shape.x = px;
            }
            if (newHeight1 > 20) {
                shape.height = newHeight1;
                shape.y = py;
            }
            break;
        case 1: // top-center
            const newHeight2 = shape.height - (py - shape.y);
            if (newHeight2 > 20) {
                shape.height = newHeight2;
                shape.y = py;
            }
            break;
        case 2: // top-right
            const newWidth3 = px - shape.x;
            const newHeight3 = shape.height - (py - shape.y);
            if (newWidth3 > 40) {
                shape.width = newWidth3;
            }
            if (newHeight3 > 20) {
                shape.height = newHeight3;
                shape.y = py;
            }
            break;
        case 3: // right-center
            const newWidth4 = px - shape.x;
            if (newWidth4 > 40) {
                shape.width = newWidth4;
            }
            break;
        case 4: // bottom-right
            const newWidth5 = px - shape.x;
            const newHeight5 = py - shape.y;
            if (newWidth5 > 40) {
                shape.width = newWidth5;
            }
            if (newHeight5 > 20) {
                shape.height = newHeight5;
            }
            break;
        case 5: // bottom-center
            const newHeight6 = py - shape.y;
            if (newHeight6 > 20) {
                shape.height = newHeight6;
            }
            break;
        case 6: // bottom-left
            const newWidth7 = shape.width - (px - shape.x);
            const newHeight7 = py - shape.y;
            if (newWidth7 > 40) {
                shape.width = newWidth7;
                shape.x = px;
            }
            if (newHeight7 > 20) {
                shape.height = newHeight7;
            }
            break;
        case 7: // left-center
            const newWidth8 = shape.width - (px - shape.x);
            if (newWidth8 > 40) {
                shape.width = newWidth8;
                shape.x = px;
            }
            break;
    }

    // Adjust font size proportionally to height
    if (shape.height >= 20) {
        shape.fontSize = Math.max(Math.floor(shape.height * 0.7), 12);
    }
}
