import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export default function ZoomControl({
    scale,
    setScale
}: {
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
}) {
    const zoomIn = () => {
        setScale((prevScale: number) => Math.min(prevScale * 1.1, 5));
    };

    const zoomOut = () => {
        setScale(prevScale => Math.max(prevScale * 0.9, 0.2));
    };

    const resetScale = () => {
        setScale(1);
    };

    return (
        <div className="fixed z-10 bottom-4 left-4 rounded-lg flex items-center bg-gray-800 shadow-lg">
            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomOut}
                            className="w-8 h-8 rounded-l-lg rounded-r-none text-white hover:bg-gray-700"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetScale}
                            className="w-12 px-1 h-8 rounded-none text-white hover:bg-gray-700 text-xs sm:text-sm"
                        >
                            {Math.round(scale * 100)}%
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Scale</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomIn}
                            className="w-8 h-8 rounded-r-lg rounded-l-none text-white hover:bg-gray-700"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
