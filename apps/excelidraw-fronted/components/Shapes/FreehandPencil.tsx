"use client";
import { useRef, useEffect } from "react";

export function FreehandPencil({ width = 600, height = 400 }: { width?: number; height?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const points = useRef<{ x: number; y: number }[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const handleMouseDown = (e: MouseEvent) => {
            drawing.current = true;
            points.current = [{ x: e.offsetX, y: e.offsetY }];
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (!drawing.current) return;
            points.current.push({ x: e.offsetX, y: e.offsetY });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(points.current[0].x, points.current[0].y);
            for (let i = 1; i < points.current.length; i++) {
                ctx.lineTo(points.current[i].x, points.current[i].y);
            }
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
        };
        const handleMouseUp = () => {
            drawing.current = false;
        };
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ background: "#222", borderRadius: 8 }}
        />
    );
}
 