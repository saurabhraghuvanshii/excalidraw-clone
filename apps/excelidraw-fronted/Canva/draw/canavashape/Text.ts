import { getShapeBounds } from '../utils';
import type { Shape } from "../CanvasEngine";

// Helper functions similar to those in the reference
function getFontSize(fontSize: number | undefined, scale: number = 1): number {
    return (fontSize || 24) * scale;
}

function getLineHeight(fontSize: number): number {
    return fontSize * 1.2;
}

export function drawText(
    ctx: CanvasRenderingContext2D,
    shape: Shape
) {
    if (shape.type !== 'text') return;
    ctx.save();
    
    const fontSize = shape.fontSize || 24;
    const fontFamily = shape.fontFamily || "Nunito";
    const textAlign = shape.textAlign || "left";
    const fontStyle = shape.fontStyle || "normal";
    
    // Create font string similar to reference
    const fontString = `${fontStyle} ${fontSize}px/1.2 ${fontFamily}`;
    ctx.font = fontString;
    ctx.fillStyle = shape.color || "#fff";
    ctx.textAlign = textAlign as CanvasTextAlign;
    
    // Split text by line breaks for manual line breaking only
    const lines = shape.text.split('\n');
    
    // Calculate height based on number of lines
    const lineHeight = getLineHeight(fontSize);
    shape.height = Math.max(lines.length * lineHeight, fontSize);
    
    // Determine max line width for shape width
    let maxWidth = 0;
    for (const line of lines) {
        const metrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
    }
    
    // Set minimum width for empty text
    shape.width = Math.max(maxWidth, 100);
    
    // Draw each line separately, handling text alignment
    lines.forEach((line, index) => {
        let tx = shape.x;
        if (textAlign === "center") {
            tx = shape.x + shape.width / 2;
        } else if (textAlign === "right") {
            tx = shape.x + shape.width;
        }
        const ty = shape.y + (index + 1) * lineHeight;
        ctx.fillText(line, tx, ty);
    });
    
    ctx.restore();
}

export function isPointInText(
    x: number,
    y: number,
    shape: Shape
): boolean {
    if (shape.type !== 'text') return false;
    const bounds = getShapeBounds(shape);
    if (!bounds) return false;
    return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
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
        fontStyle?: string;
        textAlign?: string;
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
