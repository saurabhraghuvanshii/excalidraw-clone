import { RoomCanvas } from "@/components/RoomCanvas";
import { ShareRoomButton } from "@/components/ShareRoomButton";

export default async function CanvasPage({ params }: {
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params;

    return (
        <>
            <div className="absolute top-4 right-4 z-20">
                <ShareRoomButton roomId={roomId} />
            </div>
            <RoomCanvas roomId={roomId} />
        </>
    );
}
