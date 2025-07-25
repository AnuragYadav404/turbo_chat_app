"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const router = useRouter()

  function handleJoinRoomSubmit() {
    // alert(input)
    router.push(`/chat/${input}`)
  }
  return (
    <main>
      <div className="h-screen w-screen flex justify-center items-center bg-black">
          <div className="bg-white p-4 m-4 rounded-2xl">
              <input onChange={(e) => setInput(e.target.value)} value={input} type="text" placeholder="Enter room name to join" className="m-2 p-2 rounded-2xl border-black border-2 text-black"/>
              <button className="m-4 p-4 rounded-2xl border-black border-2 text-black" onClick={handleJoinRoomSubmit}>Join</button>
          </div>
      </div>
    </main>
  );
}
