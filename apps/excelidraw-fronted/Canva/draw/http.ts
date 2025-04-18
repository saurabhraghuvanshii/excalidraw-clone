import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { getToken } from "@/utils/auth";
import { Shape } from "./CanvasEngine";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const token = getToken();
        const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const messages = res.data.messages || [];
        
        // Get the list of erased shape IDs from the messages
        const erasedShapeIds = new Set<string>();
        messages.forEach((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                if (messageData.eraseId) {
                    erasedShapeIds.add(messageData.eraseId);
                }
            } catch (e) {
                // Ignore parsing errors for eraseId messages
            }
        });
        
        // Create a map to store the most recent version of each shape
        const shapeMap = new Map<string, Shape>();
        
        // Process messages in chronological order to get the most recent version of each shape
        messages.forEach((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                if (messageData.shape && messageData.shape.id) {
                    // Only add shapes that haven't been erased
                    if (!erasedShapeIds.has(messageData.shape.id)) {
                        // Always update with the latest version of the shape
                        shapeMap.set(messageData.shape.id, messageData.shape);
                    }
                }
            } catch (e) {
                console.error("Error parsing message:", e);
            }
        });
        
        // Convert the map to an array of shapes
        return Array.from(shapeMap.values());
    } catch (error) {
        console.error("Error fetching shapes:", error);
        return [];
    }
}
