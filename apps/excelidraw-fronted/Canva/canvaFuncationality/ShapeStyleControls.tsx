import React from "react";
import Image from "next/image";
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

// Helper for tooltip
const Tooltip = ({ label }: { label: string }) => (
	<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
		{label}
	</span>
);

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
}: StyleConfiguratorProps) {
	const strokeEdges = ["round", "square"];
	const fontFamilies = ["Nunito", "Arial", "Times New Roman", "Courier New"];
	const fontSizes = [12, 16, 20, 24, 32, 48];
	const textAligns = ["left", "center", "right"];

	const handleFillStyleChange = (style: string) => {
		setFillStyle(style);
		// If a shape is selected, update its fillStyle
		if ((window as any).updateSelectedShapeStyle) {
			(window as any).updateSelectedShapeStyle({ fillStyle: style });
		}
	};

	return (
		<div className="flex flex-col gap-y-3 p-2">
			<div className="text-lg font-semibold mb-2">Style</div>

			{/* Stroke Color */}
			<div className="Stroke-Color-Picker mb-2">
				<div className="text-sm font-medium mb-2">Stroke Color</div>
				<ColorBoard
					mode="Shape"
					strokeFill={strokeFill}
					setStrokeFill={setStrokeFill}
					bgFill={bgFill}
					setBgFill={setBgFill}
					activeTool={activeTool}
				/>
			</div>

			{/* Background Color */}
			<div className="Background-Color-Picker mb-2">
				<ColorBoard
					mode="CanvasSheet"
					strokeFill={strokeFill}
					setStrokeFill={setStrokeFill}
					bgFill={bgFill}
					setBgFill={setBgFill}
					activeTool={activeTool}
				/>
			</div>

			{/* Stroke Width */}
			<div className="Stroke-Width-Picker">
				<div className="text-sm font-medium mb-2">Stroke Width</div>
				<div className="flex flex-wrap gap-2">
					{[1, 2, 3].map((width, idx) => (
						<button
							key={width}
							className={`p-1 rounded group relative ${strokeWidth === width ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setStrokeWidth(width)}
							title={idx === 0 ? "Thin" : idx === 1 ? "Bold" : "Extra Bold"}
						>
							{idx === 0 && (
								<Image src="/Thinline.svg" alt="Thin" width={24} height={24} />
							)}
							{idx === 1 && (
								<Image src="/Boldline.svg" alt="Bold" width={24} height={24} />
							)}
							{idx === 2 && (
								<Image src="/Extrabold.svg" alt="Extra Bold" width={24} height={24} />
							)}
							<Tooltip
								label={idx === 0 ? "Thin" : idx === 1 ? "Bold" : "Extra Bold"}
							/>
						</button>
					))}
				</div>
			</div>

			{/* Stroke Edge */}
			<div className="Stroke-Edge-Picker">
				<div className="text-sm font-medium mb-2">Stroke Edge</div>
				<div className="flex flex-wrap gap-2">
					{strokeEdges.map((edge, idx) => (
						<button
							key={edge}
							className={`p-1 rounded flex flex-col items-center group relative ${strokeEdge === edge ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setStrokeEdge(edge)}
							title={edge === "round" ? "Rounded" : "Sharp"}
						>
							{edge === "round" && (
								<Image src="/rounded.svg" alt="Rounded" width={24} height={24} />
							)}
							{edge === "square" && (
								<Image src="/sharp.svg" alt="Sharp" width={24} height={24} />
							)}
							<Tooltip label={edge === "round" ? "Rounded" : "Sharp"} />
						</button>
					))}
				</div>
			</div>

			{/* Stroke Style */}
			<div className="Stroke-Style-Picker">
				<div className="text-sm font-medium mb-2">Stroke Style</div>
				<div className="flex flex-wrap gap-2">
					{["solid", "dashed", "dotted"].map((style, idx) => (
						<button
							key={style}
							className={`p-1 rounded group relative ${strokeStyle === style ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setStrokeStyle(style)}
							title={idx === 0 ? "Solid" : idx === 1 ? "Dashed" : "Dotted"}
						>
							{idx === 0 && (
								<Image src="/Solid.svg" alt="Solid" width={24} height={24} />
							)}
							{idx === 1 && (
								<Image src="/Dashed.svg" alt="Dashed" width={24} height={24} />
							)}
							{idx === 2 && (
								<Image src="/Dotted.svg" alt="Dotted" width={24} height={24} />
							)}
							<Tooltip label={idx === 0 ? "Solid" : idx === 1 ? "Dashed" : "Dotted"} />
						</button>
					))}
				</div>
			</div>

			{/* Slopiness */}
			<div className="Slopiness-Picker">
				<div className="text-sm font-medium mb-2">Slopiness</div>
				<div className="flex flex-wrap gap-2">
					{["architect", "artist", "cartoonist"].map((style, idx) => (
						<button
							key={style}
							className={`p-1 rounded group relative ${fillStyle === style ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => handleFillStyleChange(style)}
							title={idx === 0 ? "Architect" : idx === 1 ? "Artist" : "Cartoonist"}
						>
							{idx === 0 && (
								<Image
									src="/SlopeArchitect.svg"
									alt="Architect"
									width={24}
									height={24}
								/>
							)}
							{idx === 1 && (
								<Image src="/SlopeArtist.svg" alt="Artist" width={24} height={24} />
							)}
							{idx === 2 && (
								<Image
									src="/SlopeCartoonist.svg"
									alt="Cartoonist"
									width={24}
									height={24}
								/>
							)}
							<Tooltip
								label={idx === 0 ? "Architect" : idx === 1 ? "Artist" : "Cartoonist"}
							/>
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
								className={`px-3 py-1 rounded ${fontFamily === family ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
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
								className={`px-3 py-1 rounded ${fontSize === size ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
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
								className={`px-3 py-1 rounded ${textAlign === align ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}
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
