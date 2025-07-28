"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { GameLogicClass } from "../game/logic";

interface Stroke {
    startX: number,
    startY: number,
    endX: number,
    endY: number,
}
type Line = Stroke[];
type Shapes = Line[];

export function HandEraserCanvas(props: {roomSlug: string, messages: Shapes, socket:WebSocket, loading:boolean, setMessages: Dispatch<SetStateAction<Shapes>>}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTool, setCurrentTool] = useState("select");

    // we need to pass all these messages down to useEffect, and also maintain these in a state?
    // here we connect to socket or we connect at parent layer


    useEffect(() => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas?.getContext("2d");
        if(!ctx) return;
        // console.log("Useffect message:", props.messages);
        const game = new GameLogicClass(canvas, ctx, currentTool, props.socket, props.roomSlug, props.messages,  props.setMessages);
        return () => {
            game.destroy();    
        }
        
    }, [currentTool,props.roomSlug, props.messages, props.setMessages, props.socket, props.loading])


    return (
        <div>
            {props.loading && <p>Loading ...</p>}
            {!props.loading && <div>
                <canvas ref={canvasRef} className="h-screen w-screen bg-black"></canvas>
                <div className="fixed top-0 left-0 bg-black">
                    <button className="p-2 m-2 rounded-r-2xl text-white border-zinc-400 border-2 hover:bg-zinc-600 " onClick={(e) => setCurrentTool("Pen")}>Pen</button>
                    <button className="p-2 m-2 rounded-r-2xl  text-white border-zinc-400 border-2 hover:bg-zinc-600 " onClick={(e) => setCurrentTool("Eraser")}>Eraser</button>
                </div>
            </div>}
        </div>
        
    )
}