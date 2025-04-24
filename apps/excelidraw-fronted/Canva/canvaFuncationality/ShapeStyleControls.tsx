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

	return (
		<div className="flex flex-col gap-y-3 p-2">
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

			{/* Background Fill */}
			<div className="Background-Fill-Picker">
				<div className="text-sm font-medium mb-2">Background</div>
				<div className="flex flex-wrap gap-2">
					{[
						{ label: "Transparent", value: "transparent" },
						{ label: "vivid red", value: "#e03131" },
						{ label: "mint Green", value: "#b2f2bb" },
						{ label: "Light sky blue", value: "#a5d8ff" },
						{ label: "Pastel Gold", value: "#ffec99" },
					].map((color) => (
						<button
							key={color.value}
							className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${bgFill === color.value ? "border-blue-500" : "border-gray-400"}`}
							style={{
								background: color.value === "transparent" ? "linear-gradient(45deg, black, gray)" : color.value,
							}}
							onClick={() => setBgFill(color.value)}
							title={color.label}
						>
							{color.value === "transparent" && (
								<span className="block w-4 h-4 bg-white border border-gray-300 rounded-full relative">
									<span
										className="absolute left-0 top-1/2 w-4 h-0.5 bg-red-400 rotate-[-20deg]"
										style={{ transform: "translateY(-50%) rotate(-20deg)" }}
									/>
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Stroke Width */}
			<div className="Stroke-Width-Picker">
				<div className="text-sm font-medium mb-2">Stroke Width</div>
				<div className="flex flex-wrap gap-2">
					{[1, 2, 3].map((width, idx) => (
						<button
							key={width}
							className={`p-1 rounded ${strokeWidth === width ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setStrokeWidth(width)}
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
							className={`h-9 px-5 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-md shadow-lg shadow-violet-500/20 border border-white/20 flex items-center gap-2 hover:scale-105 active:scale-95 hover:from-violet-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                                strokeEdge === edge ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"
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
					{["solid", "dashed", "dotted"].map((style, idx) => (
						<button
							key={style}
							className={`p-1 rounded ${strokeStyle === style ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setStrokeStyle(style)}
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
						</button>
					))}
				</div>
			</div>

			{/* Fill Style */}
			<div className="Slopiness-Picker">
				<div className="text-sm font-medium mb-2">Slopiness</div>
				<div className="flex flex-wrap gap-2">
					{["architect", "artist", "cartoonist"].map((style, idx) => (
						<button
							key={style}
							className={`p-1 rounded ${fillStyle === style ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFillStyle(style)}
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
									fontFamily === family
										? "bg-blue-500 text-white"
										: "bg-gray-700 text-gray-200"
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
									fontSize === size
										? "bg-blue-500 text-white"
										: "bg-gray-700 text-gray-200"
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
									textAlign === align
										? "bg-blue-500 text-white"
										: "bg-gray-700 text-gray-200"
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
