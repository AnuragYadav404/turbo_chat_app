"use client"
import { useEffect, useState } from "react"
import { useSocket } from "../hooks/useSocket";

export function NewChat(props: {roomSlug: string}) {
    const [newMessage, setNewMessage] = useState("");
    const {socket, loading} = useSocket();

    useEffect(() => {
        if(socket && !loading) {
            socket.send(JSON.stringify({
                type: "join_room",
                roomSlug: props.roomSlug,
            }))
        }
    }, [socket, loading, props.roomSlug])

    function handleNewChatMessage() {
        // here we send a new message to the socket
        // but first we need to handle the join room logic
        if(socket&&!loading) {
            socket.send(JSON.stringify({
                type:"chat_message",
                roomSlug: props.roomSlug,
                message: newMessage
            }))
            setNewMessage("")
        }
    }


    return (
        <div className="bg-gray-800 text-white p-2 rounded-2xl">
            <input type="text" placeholder="New message" onChange={(e) => setNewMessage(e.target.value)} value={newMessage} className="p-2 rounded-2xl border-zinc-200 border-2"/>
            <button className="p-2 m-2 rounded-2xl border-zinc-200 border-2" onClick={handleNewChatMessage} disabled={loading}>Send</button>
        </div>
    )
}