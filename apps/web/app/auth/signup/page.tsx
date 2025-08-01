"use client"

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react"

// will be a client component
// will send requests to HTTP backend directly
export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();


    async function handleSignUpSubmit() {
        // here we make calls to the backend
        // do some input validations here
        // make the api call with values;
        
        // endpoint: 
        if(email && password) {
            try{
                const response = await axios.post("http://localhost:3000/signup", {
                    email: email,
                    password: password,
                })
                if(response.status ==200) {
                    router.push("/auth/signin")
                }
            }
            catch(e) {
                console.log(e)
                // alert(e);
            }
        }
    }

    return (
        <div>
            <input type="text" placeholder="Enter email" required={true} value={email} onChange={(e) => setEmail(e.target.value)}/>
            <input type="text" placeholder="Enter email" required={true} value={password} onChange={(e) => setPassword(e.target.value)}/>
            <button onClick={handleSignUpSubmit}>Sign up</button>
        </div>
    )
}