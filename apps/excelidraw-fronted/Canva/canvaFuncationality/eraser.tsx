import { useEffect, useState } from "react";

type CursorPosition = {
  x: number;
  y: number;
};

type EraserCursorProps = {
  size?: number;
  isActive?: boolean;
  color?: string;
  opacity?: number;
};

export function EraserCursor({
  size = 20,
  isActive = false,
  color = "white",
  opacity = 0.7
}: EraserCursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  
  useEffect(() => {
    if (isActive) {
      const handleMouseMove = (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
      };
      
      // Store the original cursor style
      const originalCursor = document.body.style.cursor;
      
      // Add event listener and hide default cursor
      document.addEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "none";
      
      return () => {
        // Clean up event listener and restore original cursor
        document.removeEventListener("mousemove", handleMouseMove);
        document.body.style.cursor = originalCursor;
      };
    }
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-full flex items-center justify-center"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%)",
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity,
        background: "rgba(255, 255, 255, 0.1)",
        boxShadow: `0 0 0 2px ${color}, 0 0 8px rgba(0, 0, 0, 0.6)`,
      }}
    >
      <div className="w-1/4 h-1/4 rounded-full bg-white opacity-50" />
    </div>
  );
}
