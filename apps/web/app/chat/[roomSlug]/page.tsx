"use client";

import { useEffect, useState } from "react";
import { Canvas } from "../../components/Canvas";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

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

type Data = {
    messages: {
        message: string
    }
};

// async function getChatMessages(roomSlug:string) {
//     let messages:Shapes = [];
//     const tokenVal = localStorage.getItem("token");
//     if(!tokenVal) {
        
//     }
//     const chatMessagesResponse = await fetch(`http://localhost:3000/chat/${roomSlug}`,  {
//         method: "GET",
//         headers: {
//             // "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI1NjIxOGJlNy00NjNmLTRiMDQtODFlYy1jNzZhYTAxOTliMjUiLCJpYXQiOjE3NTM0NTYzMTN9.8dvRNJdYw6MwaLVbK3JJz-SM3140AFOjvTwwwcaxEjk",
//            "Authorization": localStorage.getItem("token"),
//         }
//     })
//     const data:Data = await chatMessagesResponse.json();
//     if(data.messages) {
//         messages = JSON.parse(data.messages.message);
//     }
//     return messages;
// }


export default function ChatPage () {
    const params = useParams<{ roomSlug: string; item: string }>()
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Shapes>([]);
    const router = useRouter()

    console.log("Messages array in chatPage component: ", messages);
    useEffect(() => {

        async function fetchMessages(token: string, roomSlug: string) {
            const chatMessagesResponse = await fetch(`http://localhost:3000/chat/${roomSlug}`,  {
                method: "GET",
                headers: {
                    // "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI1NjIxOGJlNy00NjNmLTRiMDQtODFlYy1jNzZhYTAxOTliMjUiLCJpYXQiOjE3NTM0NTYzMTN9.8dvRNJdYw6MwaLVbK3JJz-SM3140AFOjvTwwwcaxEjk",
                "Authorization": token,
                }
            })
            const data:Data = await chatMessagesResponse.json();
            if(data.messages) {
                const parsedMessages = JSON.parse(data.messages.message);
                console.log("ParsedMessages: ", parsedMessages);
                setMessages(parsedMessages);
            }
        }

        if(loading) {
            const tokenVal = localStorage.getItem("token");
            if(tokenVal) {
                fetchMessages(tokenVal, params.roomSlug);
                setLoading(false);
            }else {
                router.push("/auth/signin");
            }
            
        }

    }, [loading, messages, router, params.roomSlug]);

    return (
        <div>
            {!loading && (<div className="h-screen w-screen flex flex-col">
                <Canvas roomSlug={params.roomSlug} messages={messages} setMessages={setMessages}/>
            </div>)}
        </div>
        
    )
}