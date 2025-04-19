import Image from 'next/image';

interface IconButtonProps {
    onClick: () => void;
    activated: boolean;
    icon?: React.ReactNode;
    image?: string;
    title?: string;
}

export function IconButton({
    icon,
    image,
    onClick,
    activated,
    title
}: IconButtonProps ) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-white-700 transition-colors ${
                activated ? 'bg-gray-700' : ''
            }`}
        >
            {image ? (
                <div className="w-[18px] h-[18px] relative">
                    <Image
                        src={image}
                        alt={title || ''}
                        width={18}
                        height={18}
                    />
                </div>
            ) : (
                icon
            )}
        </button>
    );
}
