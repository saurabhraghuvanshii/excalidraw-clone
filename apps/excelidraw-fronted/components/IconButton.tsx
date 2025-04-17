import { ReactNode } from "react";

export function IconButton({
    icon,
    image,
    onClick,
    activated
}: {
    icon?: ReactNode,
    image?: string,
    onClick: () => void,
    activated: boolean
}) {
    return (
        <div
            className={`m-2 pointer rounded-full border p-2 bg-black hover:bg-gray ${activated ? "text-red-400" : "text-white"}`}
            onClick={onClick}
        >
            {image ? (
                <img src={image} alt="tool" className="w-5 h-5" />
            ) : icon}
        </div>
    );
}
