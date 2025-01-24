"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export function ChatRoomClient({
    messages,
    id
}:{
   messages: {message: string} [];
   id: string
}) {
   const [chats, setChats] = useState(messages);
   const [currMessage, setCurrMessage] = useState("");
   const {socket, loading} = useSocket() ;

    useEffect(() => {
        if (socket && !loading) {

            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }));

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                if (parsedData.type === "chat"){
                 
                    setChats(c => [...c,{ message: parsedData.message}])
                }
            }
        }
    }, [socket, loading, id])

    return <div>
        {chats.map(m => <div>{m.message}</div>)}

        <input type="text"value={currMessage} onChange={e =>{
            setCurrMessage(e.target.value);
        }}></input>
        <button onClick={() => {
            socket?.send(JSON.stringify({
                type: "chat",
                roomId: id,
                messages: currMessage
            }))
            setCurrMessage("");
        }}>Send message</button>
    </div>
}
