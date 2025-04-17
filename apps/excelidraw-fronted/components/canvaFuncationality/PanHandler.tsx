import { useEffect, useRef } from "react";

interface PanHandlerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  offset: { x: number; y: number };
  setOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export function PanHandler({ canvasRef, offset, setOffset, isDragging, setIsDragging }: PanHandlerProps) {
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanning = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2 || isDragging) {
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        panOrigin.current = { ...offset };
        document.body.style.cursor = "grabbing";
        if (e.button === 2) e.preventDefault();
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning.current) {
        setOffset({
          x: panOrigin.current.x + (e.clientX - panStart.current.x),
          y: panOrigin.current.y + (e.clientY - panStart.current.y),
        });
      }
    };
    const handleMouseUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
        document.body.style.cursor = "default";
      }
    };
    const preventContextMenu = (e: MouseEvent) => {
      if (isPanning.current) e.preventDefault();
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("contextmenu", preventContextMenu);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [canvasRef, offset, setOffset, isDragging]);

  // Setup canvas panning with space bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        document.body.style.cursor = "grab";
        setIsDragging(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        document.body.style.cursor = "default";
        setIsDragging(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setIsDragging]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // Only pan if not zooming (no ctrl/cmd)
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOffset((prev: { x: number; y: number }) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [setOffset, canvasRef]);

  return null; // This component only handles events
}
