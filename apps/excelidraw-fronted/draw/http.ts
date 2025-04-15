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

        const shapes = messages.map((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                return messageData.shape;
            } catch (e) {
                console.error("Error parsing message:", e);
                return null;
            }
        }).filter(Boolean); // Filter out null values

        return shapes;
    } catch (error) {
        console.error("Error fetching shapes:", error);
        return [];
    }
}
