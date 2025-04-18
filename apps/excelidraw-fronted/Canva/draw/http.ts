import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { getToken } from "@/utils/auth";
import { Shape } from "./CanvasEngine";

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const response = await fetch(`${HTTP_BACKEND}/chats/${roomId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Get the list of erased shape IDs from the messages
        const erasedShapeIds = new Set<string>();
        data.messages.forEach((msg: any) => {
            try {
                const parsedMsg = JSON.parse(msg.message);
                if (parsedMsg.type === "erase" && parsedMsg.shapeId) {
                    erasedShapeIds.add(parsedMsg.shapeId);
                }
            } catch (e) {
                console.error("Error parsing message:", e);
            }
        });
        
        // Create a map to store the most recent version of each shape
        const shapeMap = new Map<string, Shape>();
        
        // Process messages in chronological order to get the most recent version of each shape
        data.messages.forEach((msg: any) => {
            try {
                const parsedMsg = JSON.parse(msg.message);
                if (parsedMsg.shape && parsedMsg.shape.id) {
                    // Only add shapes that haven't been erased
                    if (!erasedShapeIds.has(parsedMsg.shape.id)) {
                        // Always update with the latest version of the shape
                        shapeMap.set(parsedMsg.shape.id, parsedMsg.shape);
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
