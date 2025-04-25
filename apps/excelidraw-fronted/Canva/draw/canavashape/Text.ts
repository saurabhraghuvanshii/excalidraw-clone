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
    shape: Shape & { type: 'text' }
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

    const boundsX = shape.x;
    const boundsY = shape.y;
    const boundsWidth = shape.width;
    const boundsHeight = shape.height;

    return (
        x >= boundsX - buffer &&
        x <= boundsX + boundsWidth + buffer &&
        y >= boundsY - buffer &&
        y <= boundsY + boundsHeight + buffer
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

    let { x, y, width, height, fontSize } = shape;

    let newX = x, newY = y, newWidth = width, newHeight = height;

    switch (handleIdx) {
        case 0: // top-left
            newX = px;
            newY = py;
            newWidth = x + width - px;
            newHeight = y + height - py;
            break;
        case 1: // top-center
            newY = py;
            newHeight = y + height - py;
            break;
        case 2: // top-right
            newY = py;
            newWidth = px - x;
            newHeight = y + height - py;
            break;
        case 3: // right-center
            newWidth = px - x;
            break;
        case 4: // bottom-right
            newWidth = px - x;
            newHeight = py - y;
            break;
        case 5: // bottom-center
            newHeight = py - y;
            break;
        case 6: // bottom-left
            newX = px;
            newWidth = x + width - px;
            newHeight = py - y;
            break;
        case 7: // left-center
            newX = px;
            newWidth = x + width - px;
            break;
    }

    newWidth = Math.max(newWidth, minWidth);
    newHeight = Math.max(newHeight, minHeight);

    // Apply clamped width/height and potentially adjusted x/y
    if (newWidth !== width) {
        shape.width = newWidth;

        if ((handleIdx === 0 || handleIdx === 6 || handleIdx === 7) && newWidth === minWidth && width > minWidth) {
            shape.x = x + (width - minWidth);
        } else {
            shape.x = newX;
        }
    } else {
       shape.x = newX;
    }

    if (newHeight !== height) {
        shape.height = newHeight;

        if ((handleIdx === 0 || handleIdx === 1 || handleIdx === 2) && newHeight === minHeight && height > minHeight) {
            shape.y = y + (height - minHeight);
        } else {
            shape.y = newY;
        }
    } else {
        shape.y = newY;
    }

    const originalHeight = height;
    const originalFontSize = fontSize || 24;

    if (originalHeight > 0 && shape.height !== originalHeight) {
        const scaleFactor = shape.height / originalHeight;
        const newFontSize = Math.floor(originalFontSize * scaleFactor);
        shape.fontSize = Math.max(Math.min(newFontSize, 120), 10); // clamp font size
    } else if (originalHeight === 0 && shape.height > 0) {
        shape.fontSize = Math.max(originalFontSize, 10);
    }
}
