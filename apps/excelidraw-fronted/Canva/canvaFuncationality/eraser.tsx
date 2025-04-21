import { useEffect, useState } from "react";

type CursorPosition = {
  x: number;
  y: number;
};

export function EraserCursor({ size = 10, isActive = false }: { size: number; isActive: boolean }) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });

  useEffect(() => {
    
    if (isActive) {
      const handleMouseMove = (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
      };
  
      document.addEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "none";
  
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.body.style.cursor = "default";
      };
    }

  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: position.x,
        top: position.y,
        background: "rgba(0,0,0,0.15)",
        boxShadow: "0 0 0 2px #fff, 0 0 8px #000"
      }}
    />
  );
}
