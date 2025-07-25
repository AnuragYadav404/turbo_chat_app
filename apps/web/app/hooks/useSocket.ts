import { useEffect, useState } from "react";

export function useSocket() {
    const [socket, setSocket] = useState<WebSocket>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // const ws = new WebSocket("ws://localhost:8080?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI1NjIxOGJlNy00NjNmLTRiMDQtODFlYy1jNzZhYTAxOTliMjUiLCJpYXQiOjE3NTM0NTYzMTN9.8dvRNJdYw6MwaLVbK3JJz-SM3140AFOjvTwwwcaxEjk")
        const ws = new WebSocket("ws://localhost:8080?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIxMzFhM2U2YS0zNjc3LTRjZTEtYjc0NS1lYTNjN2RiZDkyZmYiLCJpYXQiOjE3NTM0Njg4NzN9.VNfnErN-Ajey4PFVBMMEWU8Zci4P2IS5Cgat_7gynps")
        
        
        ws.onopen=()=> {
            setLoading(false)
            setSocket(ws);
        }
        ws.onclose=() => {
            console.log("Socket connection closing")
            console.log("Socket connection closed")
        }
        return () => {
            ws.close();
        }
    }, [])
    

    return {socket, loading}
}