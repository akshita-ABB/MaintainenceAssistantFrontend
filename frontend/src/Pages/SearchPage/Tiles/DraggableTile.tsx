import { useDraggable } from "@dnd-kit/core";

export const DraggableTile = ({
    tile,
    onRemove,
}: {
    tile: any;
    onRemove: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: tile.id,
    });

    const style = {
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="bg-white shadow-md border rounded-xl p-3 relative"
        >
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 text-red-500 font-bold"
            >
                ×
            </button>
            <div className="text-sm font-medium text-gray-700 mb-1">
                Question:
            </div>
            <div className="text-gray-900 text-sm mb-2">{tile.question}</div>
            <div className="text-sm font-medium text-gray-700">Result:</div>
            <div className="text-gray-800 text-sm whitespace-pre-line">
                {tile.content}
            </div>
        </div>
    );
};
