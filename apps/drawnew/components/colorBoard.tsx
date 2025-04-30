import React from "react";
import { Check } from "lucide-react";

interface ColorBoardProps {
    mode: "Shape" | "CanvasSheet";
    strokeFill: string;
    setStrokeFill: (color: string) => void;
    bgFill: string;
    setBgFill: (color: string) => void;
    activeTool?: string;
}

export function ColorBoard({
    mode,
    strokeFill,
    setStrokeFill,
    bgFill,
    setBgFill,
}: ColorBoardProps) {
    const strokeFills: string[] = ["#1e1e1e", "#2f9e44", "#e03131","#1971c2", "#f08c00","#0c8599", "#ffffff", "#e8590c", "#099268"];
    const bgFills: string[] = ["#00000000", "#a5d8ff", "#b2f2bb", "#ffc9c9", "#ffec99", "#ffffff", "#1e1e1e", "#99e9f2", "#e9ecef", "#eebefa"];

    return (
        <div className="flex flex-col gap-y-3">
            {mode === 'Shape' && (
                <>
                    <div className="Stroke-Color-Picker">
                        <div className="text-sm font-medium mb-2">Stroke</div>
                        <div className="flex flex-wrap gap-2">
                            {strokeFills.map((color) => (
                                <ColorPickerButton
                                    key={color}
                                    color={color}
                                    isSelected={color === strokeFill}
                                    onClick={() => setStrokeFill(color)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
            {mode === 'CanvasSheet' && (
                <>
                    <div className="Background-Color-Picker">
                        <div className="text-sm font-medium mb-2">Background</div>
                        <div className="flex flex-wrap gap-2">
                            {bgFills.map((color) => (
                                <ColorPickerButton
                                    key={color}
                                    color={color}
                                    isSelected={color === bgFill}
                                    onClick={() => setBgFill(color)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface ColorPickerButtonProps {
    color: string;
    isSelected: boolean;
    onClick: () => void;
}

function ColorPickerButton({ color, isSelected, onClick }: ColorPickerButtonProps) {
    return (
        <button
            className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center ${
                isSelected ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={onClick}
            title={color}
        >
            {isSelected && <Check size={16} color={color === '#ffffff' ? '#000000' : '#ffffff'} />}
        </button>
    );
}

