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
      className="pointer-events-none fixed z-50 border-2 border-white rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        left: 0,
        top: 0,
        opacity: 0.7,
        background: 'rgba(255, 255, 255, 0.1)',
        boxShadow: "0 0 0 2px #fff, 0 0 8px #000"
      }}
      onMouseMove={(e) => {
        const cursor = e.currentTarget;
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }}
    />
  );
}
