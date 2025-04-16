import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { getToken } from "@/utils/auth";

export async function getExistingShapes(roomId: string) {
    try {
        const token = getToken();
        const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const messages = res.data.messages || [];

        const erasedShapeIds = new Set<string>();
        messages.forEach((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                if (messageData.eraseId) {
                    erasedShapeIds.add(messageData.eraseId);
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                // Ignore parsing errors for eraseId messages
            }
        });

        // Then collect and filter shapes that haven't been erased
        const shapes = messages
            .map((x: { message: string }) => {
                try {
                    const messageData = JSON.parse(x.message);
                    if (messageData.shape && messageData.shape.id && !erasedShapeIds.has(messageData.shape.id)) {
                        return messageData.shape;
                    }
                    return null;
                } catch (e) {
                    console.error("Error parsing message:", e);
                    return null;
                }
            })
            .filter(Boolean); // Filter out null values

        return shapes;
    } catch (error) {
        console.error("Error fetching shapes:", error);
        return [];
    }
}
