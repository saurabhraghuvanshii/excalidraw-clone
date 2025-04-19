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
    const fontString = `${fontStyle} ${fontSize}px/${getLineHeight(fontSize)} ${fontFamily}`;
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
        maxWidth = Math.max(maxWidth, maxWidth = Math.max(maxWidth, ctx.measureText(line).width));
    }
    
    // Set minimum width for empty text
    shape.width = Math.max(maxWidth, 100);
    
    // Draw each line separately, handling text alignment
    lines.forEach((line, i) => {
        let tx = shape.x;

        if (textAlign === "center") {
            tx = shape.x + shape.width / 2;
        } else if (textAlign === "right") {
            tx = shape.x + shape.width;
        }

        const ty = shape.y + (i + 1) * lineHeight;
        ctx.fillText(line, tx, ty);
    });
    
    ctx.restore();
}

export function isPointInText(
    x: number,
    y: number,
    shape: Shape,
    buffer: number = 10
): boolean {
    if (shape.type !== 'text') return false;

    const bounds = getShapeBounds(shape);
    if (!bounds) return false;

    return (
        x >= bounds.x - buffer &&
        x <= bounds.x + bounds.width + buffer &&
        y >= bounds.y - buffer &&
        y <= bounds.y + bounds.height + buffer
    );
}

export function resizeText(
    shape: Shape & { type: "text" },
    handleIdx: number,
    px: number,
    py: number,
) {
    const minWidth = 40;
    const minHeight = 20;

    let originalFontSize = shape.fontSize || 24;
    let originalHeight = shape.height;

    let changedHeight = false;

    switch (handleIdx) {
        case 0: // top-left
            const newWidth1 = shape.width - (px - shape.x);
            const newHeight1 = shape.height - (py - shape.y);
            if (newWidth1 > minWidth) {
                shape.width = newWidth1;
                shape.x = px;
            }
            if (newHeight1 > minHeight) {
                shape.height = newHeight1;
                shape.y = py;
                changedHeight = true;
            }
            break;
        case 1: // top-center
            const newHeight2 = shape.height - (py - shape.y);
            if (newHeight2 > minHeight) {
                shape.height = newHeight2;
                shape.y = py;
                changedHeight = true;
            }
            break;
        case 2: // top-right
            const newWidth3 = px - shape.x;
            const newHeight3 = shape.height - (py - shape.y);
            if (newWidth3 > minWidth) {
                shape.width = newWidth3;
            }
            if (newHeight3 > minHeight) {
                shape.height = newHeight3;
                shape.y = py;
                changedHeight = true;
            }
            break;
        case 3: // right-center
            const newWidth4 = px - shape.x;
            if (newWidth4 > minWidth) {
                shape.width = newWidth4;
            }
            break;
        case 4: // bottom-right
            const newWidth5 = px - shape.x;
            const newHeight5 = py - shape.y;
            if (newWidth5 > minWidth) {
                shape.width = newWidth5;
            }
            if (newHeight5 > minHeight) {
                shape.height = newHeight5;
                changedHeight = true;
            }
            break;
        case 5: // bottom-center
            const newHeight6 = py - shape.y;
            if (newHeight6 > minHeight) {
                shape.height = newHeight6;
                changedHeight = true;
            }
            break;
        case 6: // bottom-left
            const newWidth7 = shape.width - (px - shape.x);
            const newHeight7 = py - shape.y;
            if (newWidth7 > minWidth) {
                shape.width = newWidth7;
                shape.x = px;
            }
            if (newHeight7 > minHeight) {
                shape.height = newHeight7;
                changedHeight = true;
            }
            break;
        case 7: // left-center
            const newWidth8 = shape.width - (px - shape.x);
            if (newWidth8 > minWidth) {
                shape.width = newWidth8;
                shape.x = px;
            }
            break;
    }

    // Only update font size if height changed
    if (changedHeight && originalHeight > 0) {
        const scaleFactor = shape.height / originalHeight;
        const newFontSize = Math.floor(originalFontSize * scaleFactor);
        shape.fontSize = Math.max(Math.min(newFontSize, 120), 10); // clamp
    }
}
