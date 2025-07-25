"use client"
import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket"

interface Message {
    messageID: number,
    message: string,
    userID: string,
    chatRoomSlug: string
}

export function ChatBubble(props : {messages: Message[], roomSlug:string }) {
    const [messages, setMessages]=useState<string[]>([]);
    const {socket, loading} = useSocket();

    useEffect(() => {
        console.log("Listener mounted")
        if(socket && !loading) {

            // join the room as well
            socket.send(JSON.stringify({
                type: "join_room",
                roomSlug: props.roomSlug
            }))

            console.log("Useffect for listening initiated for the room")
            
            socket.onmessage = (e)=>{
                const data = JSON.parse(e.data);
                console.log("Data is: ",data)
                if(data.type === "chat") {
                    console.log("Message received: ", data.message);
                    setMessages((c) => [...c, data.message])
                }
            }
        }
        return () => {
            console.log("Dismounting new message listener")
        }
    }, [socket, loading,props.roomSlug])

    return (
        <div className="">
            {props.messages.map((msg)=> {
                return (    
                    <div key={msg.messageID}>
                        {msg.message}
                    </div>
                )
            })}
            <br />
            <br />
            {messages.map((msg) =>{
                return (    
                    <div key={msg}>
                        {msg}
                    </div>
                )
            })}
        </div>
    )
}