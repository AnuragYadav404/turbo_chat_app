import { Canvas } from "../../components/Canvas";

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

async function getChatMessages(roomSlug:string) {
    let messages:Shapes = [];
    const chatMessagesResponse = await fetch(`http://localhost:3000/chat/${roomSlug}`,  {
        method: "GET",
        headers: {
            "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI1NjIxOGJlNy00NjNmLTRiMDQtODFlYy1jNzZhYTAxOTliMjUiLCJpYXQiOjE3NTM0NTYzMTN9.8dvRNJdYw6MwaLVbK3JJz-SM3140AFOjvTwwwcaxEjk",
        }
    })
    const data:Data = await chatMessagesResponse.json();
    if(data.messages) {
        messages = JSON.parse(data.messages.message);
    }
    return messages;
}


export default async function ChatPage ({params}: {
        params: {
            roomSlug: string
        }   
}) {
    const roomSlug = (await params).roomSlug;
    const messages = await getChatMessages(roomSlug)

    return (
        <div className="h-screen w-screen flex flex-col">
            <Canvas roomSlug={roomSlug} messages={messages}/>
        </div>
    )
}