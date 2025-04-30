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
	selectedShapeId: string | null;
	selectedShapeType: string | undefined;
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
	fillStyle,
	setFillStyle,
	fontFamily,
	setFontFamily,
	fontSize,
	setFontSize,
	textAlign,
	setTextAlign,
	selectedShapeId,
	selectedShapeType,
}: StyleConfiguratorProps) {
	const strokeEdges = ["round", "square"];

	const handleFillStyleChange = (style: string) => {
		setFillStyle(style);
		// If a shape is selected, update its fillStyle
		if ((window as any).updateSelectedShapeStyle) {
			(window as any).updateSelectedShapeStyle({ fillStyle: style });
		}
	};

	const handleSlopinessChange = (style: string) => {
		setStrokeStyle(style);
		// If a shape is selected, update its strokeStyle
		if ((window as any).updateSelectedShapeStyle) {
			(window as any).updateSelectedShapeStyle({ strokeStyle: style });
		}
	};

	return (
		<div className="flex flex-col gap-y-3 p-2">
			<div className="text-lg font-semibold mb-2">Style</div>

			<div className="Stroke-Color-Picker mb-2">
				<div className="text-sm font-medium mb-2">
					{activeTool === "text" ? "Text Color" : "Stroke Color"}
				</div>
				<ColorBoard
					mode="Shape"
					strokeFill={strokeFill}
					setStrokeFill={setStrokeFill}
					bgFill={bgFill}
					setBgFill={setBgFill}
					activeTool={activeTool}
				/>
			</div>

			{/* Background Color - Only for shapes that support fill */}
			{(activeTool === "rect" ||
				activeTool === "diamond" ||
				activeTool === "circleOrOval" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType &&
					["rect", "diamond", "circleOrOval"].includes(selectedShapeType))) && (
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
			)}

			{/* Fill Style (Hachure/Cross-hatch) - Only for shapes that support fill */}
			{(activeTool === "rect" ||
				activeTool === "diamond" ||
				activeTool === "circleOrOval" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType &&
					["rect", "diamond", "circleOrOval"].includes(selectedShapeType))) && (
				<div className="Fill-Style-Picker mb-2">
					<div className="text-sm font-medium mb-2">Fill</div>
					<div className="flex flex-wrap gap-2">
						<button
							className={`p-1 rounded group relative ${fillStyle === "hachure" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => handleFillStyleChange("hachure")}
							title="Hachure"
						>
							<Image src="/Hachure.svg" alt="Hachure" width={24} height={24} />
							<Tooltip label="Hachure" />
						</button>
						<button
							className={`p-1 rounded group relative ${fillStyle === "zigzag" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => handleFillStyleChange("zigzag")}
							title="Cross-hatch"
						>
							<Image src="/Cross-hatch.svg" alt="Cross-hatch" width={24} height={24} />
							<Tooltip label="Cross-hatch" />
						</button>
						<button
							className={`p-1 rounded group relative ${fillStyle === "solid" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => handleFillStyleChange("solid")}
							title="Solid"
						>
							<Image src="/FillSolid.svg" alt="Solid" width={24} height={24} />
							<Tooltip label="Solid" />
						</button>
					</div>
				</div>
			)}

			{/* Stroke Width - Hide for text tool and text shapes */}
			{activeTool !== "text" &&
				!(
					activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType === "text"
				) && (
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
				)}

			{/* Stroke Edge - Only for shapes that support fill */}
			{(activeTool === "rect" ||
				activeTool === "diamond" ||
				activeTool === "circleOrOval" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType &&
					["rect", "diamond", "circleOrOval"].includes(selectedShapeType))) && (
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
			)}

			{/* Stroke Style - Hide for text tool and text shapes */}
			{activeTool !== "text" &&
				!(
					activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType === "text"
				) && (
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
									<Tooltip
										label={idx === 0 ? "Solid" : idx === 1 ? "Dashed" : "Dotted"}
									/>
								</button>
							))}
						</div>
					</div>
				)}

			{/* Slopiness - For shapes that support rough drawing */}
			{(activeTool === "rect" ||
				activeTool === "diamond" ||
				activeTool === "circleOrOval" ||
				activeTool === "arrow" ||
				activeTool === "freehand" ||
				activeTool === "line" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType &&
					["rect", "diamond", "circleOrOval", "arrow", "freehand", "line"].includes(
						selectedShapeType
					))) && (
				<div className="Slopiness-Picker">
					<div className="text-sm font-medium mb-2">Slopiness</div>
					<div className="flex flex-wrap gap-2">
						{["architect", "artist", "cartoonist"].map((style, idx) => (
							<button
								key={style}
								className={`p-1 rounded group relative ${strokeStyle === style ? "bg-blue-500" : "bg-gray-700"}`}
								onClick={() => handleSlopinessChange(style)}
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
			)}

			{(activeTool === "text" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType === "text")) && (
				<div className="Font-Family-Picker">
					<div className="text-sm font-medium mb-2">Font Family</div>
					<div className="flex flex-wrap gap-2">
						<button
							className={`p-1 rounded group relative ${fontFamily === "Nunito" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontFamily("Nunito")}
							title="Nunito"
						>
							<Image src="/Nunito.svg" alt="Nunito" width={24} height={24} />
							<Tooltip label="Nunito" />
						</button>
						<button
							className={`p-1 rounded group relative ${fontFamily === "Arial" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontFamily("Arial")}
							title="Arial"
						>
							<Image src="/Arial.svg" alt="Arial" width={24} height={24} />
							<Tooltip label="Arial" />
						</button>
						<button
							className={`p-1 rounded group relative ${fontFamily === "Lilita One" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontFamily("Lilita One")}
							title="Lilita One"
						>
							<Image src="/LalitaOne.svg" alt="Lilita One" width={24} height={24} />
							<Tooltip label="Lilita One" />
						</button>
					</div>
				</div>
			)}

			{(activeTool === "text" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType === "text")) && (
				<div className="Font-Size-Picker">
					<div className="text-sm font-medium mb-2">Font Size</div>
					<div className="flex flex-wrap gap-2">
						<button
							className={`p-1 rounded group relative ${fontSize === 12 ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontSize(12)}
							title="Small"
						>
							<Image src="/Smalltext.svg" alt="Small" width={24} height={24} />
							<Tooltip label="Small" />
						</button>
						<button
							className={`p-1 rounded group relative ${fontSize === 20 ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontSize(20)}
							title="Medium"
						>
							<Image src="/Mediumtext.svg" alt="Medium" width={24} height={24} />
							<Tooltip label="Medium" />
						</button>
						<button
							className={`p-1 rounded group relative ${fontSize === 32 ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setFontSize(32)}
							title="Large"
						>
							<Image src="/largetext.svg" alt="Large" width={24} height={24} />
							<Tooltip label="Large" />
						</button>
					</div>
				</div>
			)}

			{(activeTool === "text" ||
				(activeTool === "select" &&
					selectedShapeId &&
					selectedShapeType === "text")) && (
				<div className="Text-Align-Picker">
					<div className="text-sm font-medium mb-2">Text Align</div>
					<div className="flex flex-wrap gap-2">
						<button
							className={`p-1 rounded group relative ${textAlign === "left" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setTextAlign("left")}
							title="Left"
						>
							<Image src="/lefttext.svg" alt="Left" width={24} height={24} />
							<Tooltip label="Left" />
						</button>
						<button
							className={`p-1 rounded group relative ${textAlign === "center" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setTextAlign("center")}
							title="Center"
						>
							<Image src="/CenterText.svg" alt="Center" width={24} height={24} />
							<Tooltip label="Center" />
						</button>
						<button
							className={`p-1 rounded group relative ${textAlign === "right" ? "bg-blue-500" : "bg-gray-700"}`}
							onClick={() => setTextAlign("right")}
							title="Right"
						>
							<Image src="/RightText.svg" alt="Right" width={24} height={24} />
							<Tooltip label="Right" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
