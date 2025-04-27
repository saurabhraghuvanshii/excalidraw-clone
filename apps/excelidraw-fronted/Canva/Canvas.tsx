import { useEffect, useRef, useState, useCallback } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Tool } from "./draw/CanvasEngine";
import { Game } from "./draw/Game";
import ZoomControl from "./canvaFuncationality/ZoomControl";
import { EraserCursor } from "./canvaFuncationality/eraser";
import { isAuthenticated } from "@/utils/auth";
import { PanHandler } from "./canvaFuncationality/PanHandler";
import { StyleConfigurator } from "./canvaFuncationality/ShapeStyleControls";

export function Canvas({
	roomId,
	socket,
	readOnly = false,
}: {
	socket: WebSocket;
	roomId: string;
	readOnly?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const gameRef = useRef<Game | null>(null);
	const [selectedTool, setSelectedTool] = useState<Tool>("select");
	const [scale, setScale] = useState<number>(1);
	const [dimensions, setDimensions] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [eraserSize, setEraserSize] = useState(2);
	const [isCanvasHovered, setIsCanvasHovered] = useState(false);
	const [editingText, setEditingText] = useState<{
		id: string | null;
		value: string;
		box: {
			x: number;
			y: number;
			width: number;
			height: number;
			fontSize?: number;
			fontFamily?: string;
			textAlign?: string;
			fontStyle?: string;
			color?: string;
		} | null;
	}>({
		id: null,
		value: "",
		box: null,
	});
	const canEdit = !readOnly;
	const [strokeFill, setStrokeFill] = useState("#ffffff");
	const [bgFill, setBgFill] = useState("transparent");
	const [strokeWidth, setStrokeWidth] = useState(2);
	const [strokeEdge, setStrokeEdge] = useState("round");
	const [strokeStyle, setStrokeStyle] = useState("solid");
	const [roughStyle, setRoughStyle] = useState(0);
	const [fillStyle, setFillStyle] = useState("architect");
	const [fontFamily, setFontFamily] = useState("Nunito");
	const [fontSize, setFontSize] = useState(20);
	const [textAlign, setTextAlign] = useState("left");
	const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

	// Helper function to convert screen to canvas coordinates
	const screenToCanvasCoords = useCallback(
		(clientX: number, clientY: number) => {
			if (!canvasRef.current) return { x: 0, y: 0 };
			const rect = canvasRef.current.getBoundingClientRect();
			return {
				x: (clientX - rect.left - offset.x) / scale,
				y: (clientY - rect.top - offset.y) / scale,
			};
		},
		[offset, scale]
	);

	// Initialize game once
	useEffect(() => {
		if (canvasRef.current && !gameRef.current) {
			const g = new Game(canvasRef.current, roomId, socket, readOnly);
			g.onShapeDrawn = () => setSelectedTool("select");
			g.getDrawingStyle = () => ({
				strokeFill,
				bgFill,
				strokeWidth,
				strokeEdge,
				strokeStyle,
				roughStyle,
				fillStyle,
				fontFamily,
				fontSize,
				textAlign,
			});
			gameRef.current = g;
			return () => {
				g.destroy();
				gameRef.current = null;
			};
		}
	}, [roomId, socket, readOnly]);

	// Update game properties when they change
	useEffect(() => {
		if (!gameRef.current) return;

		gameRef.current.setReadOnly(readOnly);
		gameRef.current.setTool(selectedTool);
		gameRef.current.setScale(scale);
		gameRef.current.setOffset(offset.x, offset.y);
	}, [readOnly, selectedTool, scale, offset]);

	// Handle wheel zoom (ctrl/cmd + wheel)
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				setScale((prevScale) => {
					const delta = e.deltaY < 0 ? 1.1 : 0.9;
					return Math.min(Math.max(prevScale * delta, 0.2), 5);
				});
			}
		};

		canvas.addEventListener("wheel", handleWheel, { passive: false });
		return () => canvas.removeEventListener("wheel", handleWheel);
	}, []);

	// Responsive canvas using window resize
	useEffect(() => {
		const handleResize = () => {
			setDimensions({ width: window.innerWidth, height: window.innerHeight });
		};
		window.addEventListener("resize", handleResize);
		handleResize();
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Sync canvas element size and redraw on dimensions change
	useEffect(() => {
		if (canvasRef.current) {
			canvasRef.current.width = dimensions.width;
			canvasRef.current.height = dimensions.height;
			if (gameRef.current) gameRef.current.handleResize();
		}
	}, [dimensions]);

	// Handle eraser size with keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (selectedTool === "eraser") {
				if (e.key === "[") {
					setEraserSize((prev) => Math.max(prev - 1, 2));
				} else if (e.key === "]") {
					setEraserSize((prev) => Math.min(prev + 1, 20));
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedTool]);

	// Cursor logic & shape hovering
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !gameRef.current) return;

		function handleMouseMove(e: MouseEvent) {
			const game = gameRef.current;
			if (!game || !canvas) return;

			const { x, y } = screenToCanvasCoords(e.clientX, e.clientY);
			let cursor = getCursorForTool(selectedTool);

			// Check for handle hover if a shape is selected
			if (game.engine.selectedShapeId) {
				const selected = game.engine.shapes.find(
					(s) => s.id === game.engine.selectedShapeId
				);
				if (selected) {
					const handleIdx = game.engine.getHandleAtPoint(selected, x, y);
					if (handleIdx !== null) {
						cursor = game.getHandleCursor(handleIdx);
						canvas.style.cursor = cursor;
						return;
					}
				}
			}

			// Otherwise, check for shape hover
			const shape = game.engine.findShapeUnderPoint?.(x, y);
			canvas.style.cursor = shape ? "move" : cursor;
		}

		canvas.addEventListener("mousemove", handleMouseMove);
		return () => canvas.removeEventListener("mousemove", handleMouseMove);
	}, [screenToCanvasCoords, selectedTool]);

	// Handle canvas interactions (click to select, create text, double-click to edit)
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !gameRef.current) return;

		// Click to select shape
		function handleClick(e: MouseEvent) {
			if (!gameRef.current || !canvasRef.current) return;

			const { x, y } = screenToCanvasCoords(e.clientX, e.clientY);

			// Handle text tool click to create new text
			if (selectedTool === "text" && canEdit) {
				const ctx = canvasRef.current.getContext("2d")!;
				const fontSize = 24;
				const fontFamily = "Nunito";
				ctx.font = `${fontSize}px ${fontFamily}`;
				const metrics = ctx.measureText("");

				// Calculate text height
				let textHeight;
				if (
					"fontBoundingBoxAscent" in metrics &&
					"fontBoundingBoxDescent" in metrics
				) {
					textHeight =
						(metrics.fontBoundingBoxAscent || 0) +
						(metrics.fontBoundingBoxDescent || 0);
				} else if (
					"actualBoundingBoxAscent" in metrics &&
					"actualBoundingBoxDescent" in metrics
				) {
					const m = metrics as TextMetrics & {
						actualBoundingBoxAscent?: number;
						actualBoundingBoxDescent?: number;
					};
					textHeight =
						(m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
				} else {
					textHeight = fontSize;
				}

				// Add a new text shape
				const shape = {
					type: "text" as const,
					x,
					y,
					width: 120,
					height: textHeight,
					text: "",
					fontSize,
					fontFamily,
					fontStyle: "normal",
					textAlign: "left",
					color: "#fff",
				};

				gameRef.current.engine.addShape(shape);
				const addedShape =
					gameRef.current.engine.shapes[gameRef.current.engine.shapes.length - 1];
				gameRef.current.engine.selectedShapeId = addedShape.id ?? null;

				setEditingText({
					id: addedShape.id ?? null,
					value: "",
					box: {
						x,
						y,
						width: 120,
						height: textHeight,
						fontSize,
						fontFamily,
						fontStyle: "normal",
						textAlign: "left",
						color: "#fff",
					},
				});

				setSelectedTool("select");
				return;
			}

			// Handle regular shape selection
			const shape = gameRef.current.engine.findShapeUnderPoint?.(x, y);
			if (shape) {
				gameRef.current.engine.selectedShapeId = shape.id || null;
				setSelectedShapeId(shape.id || null);
				gameRef.current.engine.clearCanvas();
			} else {
				gameRef.current.engine.selectedShapeId = null;
				setSelectedShapeId(null);
				gameRef.current.engine.clearCanvas();
			}
		}

		// Double-click to edit text
		function handleDoubleClick(e: MouseEvent) {
			if (!gameRef.current) return;

			const { x, y } = screenToCanvasCoords(e.clientX, e.clientY);
			const found = gameRef.current.engine.findShapeUnderPoint?.(x, y);

			if (found && found.type === "text") {
				setEditingText({
					id: found.id ?? null,
					value: found.text,
					box: {
						x: found.x,
						y: found.y,
						width: found.width,
						height: found.height,
						fontSize: found.fontSize,
						fontFamily: found.fontFamily,
						fontStyle: found.fontStyle,
						textAlign: found.textAlign,
						color: found.color,
					},
				});
			}
		}

		canvas.addEventListener("click", handleClick);
		canvas.addEventListener("dblclick", handleDoubleClick);

		return () => {
			canvas.removeEventListener("click", handleClick);
			canvas.removeEventListener("dblclick", handleDoubleClick);
		};
	}, [screenToCanvasCoords, selectedTool, canEdit]);

	// Handle clicks outside the text area to finish editing
	useEffect(() => {
		if (!editingText.id) return;

		const handleClickOutside = (e: MouseEvent) => {
			const textareaEl = document.querySelector("textarea");
			if (textareaEl && !textareaEl.contains(e.target as Node)) {
				textareaEl.blur();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [editingText.id]);

	// Handle text editing completion
	const completeTextEditing = useCallback(() => {
		if (!gameRef.current || !editingText.id) return;

		const found = gameRef.current.engine.shapes.find(
			(s) => s.id === editingText.id
		);
		if (found && found.type === "text") {
			found.text = editingText.value;
			gameRef.current.engine.updateShape(found);

			if (socket) {
				socket.send(
					JSON.stringify({
						type: "chat",
						message: JSON.stringify({ shape: found }),
						roomId,
					})
				);
			}
		}

		setEditingText({ id: null, value: "", box: null });
	}, [editingText, roomId, socket]);

	// Handle text input changes
	const handleTextChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setEditingText((prev) => ({ ...prev, value: e.target.value }));

			// Auto-resize the textarea
			e.target.style.width = "auto";
			e.target.style.width = e.target.scrollWidth + "px";
			e.target.style.height = "auto";
			e.target.style.height = e.target.scrollHeight + "px";
		},
		[]
	);

	// Handle text input keydown events
	const handleTextKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();

				// Insert newline at cursor position
				const textarea = e.target as HTMLTextAreaElement;
				const cursorPos = textarea.selectionStart;
				const textBefore = editingText.value.substring(0, cursorPos);
				const textAfter = editingText.value.substring(cursorPos);

				setEditingText((prev) => ({
					...prev,
					value: textBefore + "\n" + textAfter,
				}));

				// Move cursor after the newline
				setTimeout(() => {
					textarea.selectionStart = cursorPos + 1;
					textarea.selectionEnd = cursorPos + 1;
				}, 0);
			}
		},
		[editingText.value]
	);

	// After the initial gameRef.current creation useEffect, add:
	useEffect(() => {
		if (gameRef.current) {
			gameRef.current.getDrawingStyle = () => ({
				strokeFill,
				bgFill,
				strokeWidth,
				strokeEdge,
				strokeStyle,
				roughStyle,
				fillStyle,
				fontFamily,
				fontSize,
				textAlign,
			});
		}
	}, [
		strokeFill,
		bgFill,
		strokeWidth,
		strokeEdge,
		strokeStyle,
		roughStyle,
		fillStyle,
		fontFamily,
		fontSize,
		textAlign,
	]);

	// Handler functions to update selected shape style if a shape is selected
	const handleStrokeFillChange = (color: string) => {
		setStrokeFill(color);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ strokeColor: color });
		}
	};
	const handleBgFillChange = (color: string) => {
		setBgFill(color);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ fillColor: color });
		}
	};
	const handleStrokeWidthChange = (width: number) => {
		setStrokeWidth(width);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ strokeWidth: width });
		}
	};
	const handleStrokeEdgeChange = (edge: string) => {
		setStrokeEdge(edge);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ strokeEdge: edge });
		}
	};
	const handleStrokeStyleChange = (style: string) => {
		setStrokeStyle(style);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({
				strokeStyle: style,
			});
		}
	};
	const handleFillStyleChange = (style: string) => {
		setFillStyle(style);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ fillStyle: style });
		}
	};
	const handleFontFamilyChange = (family: string) => {
		setFontFamily(family);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ fontFamily: family });
		}
	};
	const handleFontSizeChange = (size: number) => {
		setFontSize(size);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ fontSize: size });
		}
	};
	const handleTextAlignChange = (align: string) => {
		setTextAlign(align);
		if (gameRef.current?.engine.selectedShapeId) {
			gameRef.current.updateSelectedShapeStyle({ textAlign: align });
		}
	};

	// Render authentication required message if not authenticated
	if (canEdit && !isAuthenticated()) {
		return (
			<div className="relative min-h-screen flex items-center justify-center bg-gray-900 text-white">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
					<p className="text-red-500">You must be signed in to edit the canvas.</p>
					<button
						onClick={() => (window.location.href = "/signin")}
						className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Go to Sign In
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full w-screen overflow-hidden">
			<div className="absolute inset-0 bg-gray-500">
				<PanHandler
					canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
					offset={offset}
					setOffset={setOffset}
					isDragging={isDragging}
					setIsDragging={setIsDragging}
				/>

				<canvas
					ref={canvasRef}
					width={dimensions.width}
					height={dimensions.height}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						background: "#f3f4f6",
						cursor: getCursorForTool(selectedTool),
					}}
					onMouseEnter={() => setIsCanvasHovered(true)}
					onMouseLeave={() => setIsCanvasHovered(false)}
				/>

				{editingText.id && editingText.box && (
					<textarea
						value={editingText.value}
						autoFocus
						style={{
							position: "absolute",
							left: editingText.box.x * scale + offset.x,
							top: editingText.box.y * scale + offset.y,
							width: editingText.box.width * scale,
							height: editingText.box.height * scale,
							fontSize: (editingText.box.fontSize || 24) * scale + "px",
							fontFamily: editingText.box.fontFamily || "Nunito",
							color: editingText.box.color || "#fff",
							background: "rgba(0, 0, 0, 0.3)",
							border: "1px solid rgba(255, 255, 255, 0.3)",
							zIndex: 20,
							padding: "2px",
							outline: "none",
							resize: "none",
							minWidth: "40px",
							minHeight: "24px",
							boxSizing: "border-box",
							caretColor: editingText.box.color || "#fff",
							overflow: "hidden",
							whiteSpace: "nowrap",
						}}
						onChange={handleTextChange}
						onBlur={completeTextEditing}
						onKeyDown={handleTextKeyDown}
					/>
				)}
				<Topbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
				{selectedTool === "eraser" && isCanvasHovered && (
					<EraserCursor size={eraserSize * scale} isActive />
				)}
				{(selectedShapeId ||
					[
						"rect",
						"circleOrOval",
						"diamond",
						"line",
						"arrow",
						"freehand",
						"text",
					].includes(selectedTool)) && (
					<div className="fixed left-6 top-20 z-50 w-56 h-[calc(100vh-150px)] overflow-y-auto overflow-x-hidden rounded-lg transition-transform duration-300 ease-in-out bg-gray-900 text-gray-100 shadow-md dark-custom-scrollbar">
						<div className="ColorBoard flex flex-col gap-y-3">
							<StyleConfigurator
								activeTool={selectedTool}
								strokeFill={strokeFill}
								setStrokeFill={handleStrokeFillChange}
								strokeWidth={strokeWidth}
								setStrokeWidth={handleStrokeWidthChange}
								bgFill={bgFill}
								setBgFill={handleBgFillChange}
								strokeEdge={strokeEdge}
								setStrokeEdge={handleStrokeEdgeChange}
								strokeStyle={strokeStyle}
								setStrokeStyle={handleStrokeStyleChange}
								roughStyle={roughStyle}
								setRoughStyle={setRoughStyle}
								fillStyle={fillStyle}
								setFillStyle={handleFillStyleChange}
								fontFamily={fontFamily}
								setFontFamily={handleFontFamilyChange}
								fontSize={fontSize}
								setFontSize={handleFontSizeChange}
								textAlign={textAlign}
								setTextAlign={handleTextAlignChange}
							/>
						</div>
					</div>
				)}
			</div>
			<ZoomControl scale={scale} setScale={setScale} />
		</div>
	);
}

function Topbar({
	selectedTool,
	setSelectedTool,
}: {
	selectedTool: Tool;
	setSelectedTool: (s: Tool) => void;
}) {
	return (
		<div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex justify-center items-center z-50 rounded-lg bg-gray-900">
			<div className="flex gap-1 p-1 rounded-lg pointer-events-auto cursor-pointer">
				<IconButton
					onClick={() => setSelectedTool("select")}
					activated={selectedTool === "select"}
					image="/selector.svg"
					title="Select"
				/>
				<IconButton
					onClick={() => setSelectedTool("freehand")}
					activated={selectedTool === "freehand"}
					image="/pencil.svg"
					title="Freehand"
				/>
				<IconButton
					onClick={() => setSelectedTool("line")}
					activated={selectedTool === "line"}
					image="/line.svg"
					title="Line"
				/>
				<IconButton
					onClick={() => setSelectedTool("arrow")}
					activated={selectedTool === "arrow"}
					image="/arrow.svg"
					title="Arrow"
				/>
				<IconButton
					onClick={() => setSelectedTool("rect")}
					activated={selectedTool === "rect"}
					image="/rectangle.svg"
					title="Rectangle"
				/>
				<IconButton
					onClick={() => setSelectedTool("diamond")}
					activated={selectedTool === "diamond"}
					image="/diamond.svg"
					title="Diamond"
				/>
				<IconButton
					onClick={() => setSelectedTool("circleOrOval")}
					activated={selectedTool === "circleOrOval"}
					image="/circle.svg"
					title="Circle"
				/>
				<IconButton
					onClick={() => setSelectedTool("text")}
					activated={selectedTool === "text"}
					image="/Text.svg"
					title="Text"
				/>
				<IconButton
					onClick={() => setSelectedTool("eraser")}
					activated={selectedTool === "eraser"}
					image="/Erarser.svg"
					title="Eraser"
				/>
			</div>
		</div>
	);
}

function getCursorForTool(tool: Tool) {
	switch (tool) {
		case "freehand":
		case "line":
		case "rect":
		case "circleOrOval":
		case "diamond":
		case "arrow":
			return "crosshair";
		case "text":
			return "text";
		default:
			return "default";
	}
}
