import React from "react";
import { ColorBoard } from "@/components/colorBoard";
 
interface StyleConfiguratorProps {
    activeTool: string;
    strokeFill: string;
    setStrokeFill: (color: string) => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
    bgFill: string;
    setBgFill: (color: string) => void;
    strokeEdge: string;
    setStrokeEdge: (edge: string) => void;
    strokeStyle: string;
    setStrokeStyle: (style: string) => void;
    roughStyle: number;
    setRoughStyle: (style: number) => void;
    fillStyle: string;
    setFillStyle: (style: string) => void;
    fontFamily: string;
    setFontFamily: (family: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    textAlign: string;
    setTextAlign: (align: string) => void;
    isMobile?: boolean;
}
 
export function StyleConfigurator({
    activeTool,
    strokeFill,
    setStrokeFill,
    strokeWidth,
    setStrokeWidth,
    bgFill,
    setBgFill,
    strokeEdge,
    setStrokeEdge,
    strokeStyle,
    setStrokeStyle,
    roughStyle,
    setRoughStyle,
    fillStyle,
    setFillStyle,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    textAlign,
    setTextAlign,
    isMobile = false
}: StyleConfiguratorProps) {
    const strokeWidths = [1, 2, 3, 4, 5];
    const strokeEdges = ["round", "square"];
    const strokeStyles = ["solid", "dashed", "dotted"];
    const roughStyles = [0, 1, 2];
    const fillStyles = ["solid", "hachure", "cross-hatch"];
    const fontFamilies = ["Nunito", "Arial", "Times New Roman", "Courier New"];
    const fontSizes = [12, 16, 20, 24, 32, 48];
    const textAligns = ["left", "center", "right"];

    return (
        <div className="flex flex-col gap-y-4 p-4 bg-gray-800 rounded-lg">
            <div className="text-lg font-semibold mb-2">Style</div>
            
            {/* Color Picker */}
            <ColorBoard
                mode="Shape"
                strokeFill={strokeFill}
                setStrokeFill={setStrokeFill}
                bgFill={bgFill}
                setBgFill={setBgFill}
                activeTool={activeTool}
            />
            
            {/* Stroke Width */}
            <div className="Stroke-Width-Picker">
                <div className="text-sm font-medium mb-2">Stroke Width</div>
                <div className="flex flex-wrap gap-2">
                    {strokeWidths.map((width) => (
                        <button
                            key={width}
                            className={`px-3 py-1 rounded ${
                                strokeWidth === width ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                            }`}
                            onClick={() => setStrokeWidth(width)}
                        >
                            {width}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Stroke Edge */}
            <div className="Stroke-Edge-Picker">
                <div className="text-sm font-medium mb-2">Stroke Edge</div>
                <div className="flex flex-wrap gap-2">
                    {strokeEdges.map((edge) => (
                        <button
                            key={edge}
                            className={`px-3 py-1 rounded ${
                                strokeEdge === edge ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                            }`}
                            onClick={() => setStrokeEdge(edge)}
                        >
                            {edge}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Stroke Style */}
            <div className="Stroke-Style-Picker">
                <div className="text-sm font-medium mb-2">Stroke Style</div>
                <div className="flex flex-wrap gap-2">
                    {strokeStyles.map((style) => (
                        <button
                            key={style}
                            className={`px-3 py-1 rounded ${
                                strokeStyle === style ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                            }`}
                            onClick={() => setStrokeStyle(style)}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Rough Style */}
            <div className="Rough-Style-Picker">
                <div className="text-sm font-medium mb-2">Rough Style</div>
                <div className="flex flex-wrap gap-2">
                    {roughStyles.map((style) => (
                        <button
                            key={style}
                            className={`px-3 py-1 rounded ${
                                roughStyle === style ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                            }`}
                            onClick={() => setRoughStyle(style)}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Fill Style */}
            <div className="Fill-Style-Picker">
                <div className="text-sm font-medium mb-2">Fill Style</div>
                <div className="flex flex-wrap gap-2">
                    {fillStyles.map((style) => (
                        <button
                            key={style}
                            className={`px-3 py-1 rounded ${
                                fillStyle === style ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                            }`}
                            onClick={() => setFillStyle(style)}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Font Family - Only for text tool */}
            {activeTool === "text" && (
                <div className="Font-Family-Picker">
                    <div className="text-sm font-medium mb-2">Font Family</div>
                    <div className="flex flex-wrap gap-2">
                        {fontFamilies.map((family) => (
                            <button
                                key={family}
                                className={`px-3 py-1 rounded ${
                                    fontFamily === family ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                                }`}
                                onClick={() => setFontFamily(family)}
                            >
                                {family}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Font Size - Only for text tool */}
            {activeTool === "text" && (
                <div className="Font-Size-Picker">
                    <div className="text-sm font-medium mb-2">Font Size</div>
                    <div className="flex flex-wrap gap-2">
                        {fontSizes.map((size) => (
                            <button
                                key={size}
                                className={`px-3 py-1 rounded ${
                                    fontSize === size ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                                }`}
                                onClick={() => setFontSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Text Align - Only for text tool */}
            {activeTool === "text" && (
                <div className="Text-Align-Picker">
                    <div className="text-sm font-medium mb-2">Text Align</div>
                    <div className="flex flex-wrap gap-2">
                        {textAligns.map((align) => (
                            <button
                                key={align}
                                className={`px-3 py-1 rounded ${
                                    textAlign === align ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
                                }`}
                                onClick={() => setTextAlign(align)}
                            >
                                {align}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
