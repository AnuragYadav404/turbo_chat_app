"use client"
import { useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import { HandEraserCanvas } from "./HandEraserCanvas";

interface Message {
    messageID: number,
    message: string,
}

interface Stroke {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
}
type Line = Stroke[];
type Shapes = Line[];

export function Canvas(props: {roomSlug: string, messages: Shapes}) {
    const {socket, loading} = useSocket();

    useEffect(() => {
        if(!loading && socket) {
            console.log("Joining room")
            socket.send(JSON.stringify({
                type: "join_room",
                roomSlug: props.roomSlug
            }))
        }
            
        return () => {
            // socket?.send(JSON.stringify({
            //     type: "exit_room",
            //     roomSlug: props.roomSlug,
            // }))
            socket?.close();
        }
    }, [socket, loading, props.roomSlug])

    return (
        <div>
            {(!loading&&socket) && (<div>
                <HandEraserCanvas roomSlug={props.roomSlug} messages={props.messages} socket={socket} loading={loading}/>
            </div>)}
        </div>
    )
}