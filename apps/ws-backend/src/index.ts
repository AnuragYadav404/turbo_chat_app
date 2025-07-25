import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken"
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import "dotenv/config"
import {prisma} from "@repo/db/client"
const wss = new WebSocketServer({ port: 8080 });

interface SocketMessage {
    type: string,
    roomSlug: string,
    // userID: string, // need to remove this from here
    message?:string
}

interface UserSocket {
    sockets: WebSocket[],
    userID: string,
}

[
    {
        userID: "abc",
        sockets: []
    },
    {
        userID: "bcd",
        sockets: []
    }
]

type Member = UserSocket[];

const RoomMapUser = new Map<string, UserSocket[]>()

function getUserID(url: string): string | null {
    // how will our request look like:
    // ws://localhost:8080?token=123123
    // we need to extract token value from url params
    //extract queryParams from URL
    const urlParams = new URLSearchParams(url.split("?")[1])
    const token = urlParams.get("token") || "";

    try {
        const decoded = jwt.verify(token, getJwtSecret())
        if (typeof decoded === "string") {
                return null 
            }
        if(!decoded || !(decoded as JwtPayload).userID) {
            return null
        }
        return decoded.userID
    }catch(e){
        return null
    }

    
}

// need to write JWT logic on the ws-backend as well

// something like *upgrade* request
wss.on('connection', function connection(ws: WebSocket, req) {
    const url = req.url;
    if(!url) {
        // here we can do something even better -> initial req can be intercepted before a websocket connection is established
        ws.close();
        return;
    }
    const userID = getUserID(url)

    if(!userID){
        ws.close();
        return;
    }

    ws.userID = userID
    console.log("User connected: ", ws.userID);

    ws.on('error', console.error);

    ws.on('message', async function message(data) {
        const socketMessage:SocketMessage = JSON.parse(data.toString())
        if(socketMessage.type === "join_room") {
            
            console.log("User joined room", ws.userID);

            const currentUsers = RoomMapUser.get(socketMessage.roomSlug);

            let currentSockets = null;
            currentUsers?.map((user) => {
                if(user.userID == ws.userID) {
                    console.log("Existing User joining same room")
                    currentSockets = user.sockets;
                }
            })

            if(currentSockets) {
                RoomMapUser.get(socketMessage.roomSlug)?.map((user) => {
                    if(user.userID == ws.userID) {
                        user.sockets.push(ws);
                    }
                })
            }else {
                RoomMapUser.set(socketMessage.roomSlug, [ ... (RoomMapUser.get(socketMessage.roomSlug) || []) , {
                    sockets: [ws],
                    userID: ws.userID
                }])
            }

            

        }else if(socketMessage.type === "chat_message") {
            //send message in chat
            // console.log(socketMessage.message)
            console.log("Total users connected: ", RoomMapUser.get(socketMessage.roomSlug)?.length)
            console.log("Existing Users: ", RoomMapUser.get(socketMessage.roomSlug))
            if(!socketMessage.message) {
                return;
            }
            console.log("User sent message in room", ws.userID);
            //check if user is memeber of the room
            // const UserArray = RoomMapUser.get(socketMessage.roomSlug);
            // // how does UserArray look like?
            // // [{socket:WebSocket, userID:string}, {socket:WebSocket, userID:string}]
            // // we want to check if there exists an entry with specfic userID
            // const UserIsMember = UserArray?.some((userSocket) => userSocket.userID===socketMessage.userID) ?? false;
            const UserIsMember = RoomMapUser.get(socketMessage.roomSlug)?.some((userSocket) => userSocket.userID === ws.userID)
            console.log(ws.userID);
            // console.log(RoomMapUser.get(socketMessage.roomSlug)[0])
            // console.log(RoomMapUser)
            if(UserIsMember) {
                console.log("User was found");
                console.log("previous user reconnecting")
                RoomMapUser.get(socketMessage.roomSlug)?.map((userSocket) => {
                    userSocket.sockets.map((skt) => {
                        skt.send(JSON.stringify({
                            type:"chat",
                            message: socketMessage.message
                        }))
                    })
                })
                try{
                    //some prisma constraint fails here
                    // here we need to send Json values
                    // console.log("Insert values: ", {
                    //     userID: ws.userID,
                    //     message: socketMessage.message,
                    //     chatRooomSlug: socketMessage.roomSlug
                    // })

                    // message is okay, but we do not create but rather update
                    await prisma.chatMessage.upsert({
                        where: {
                            chatRooomSlug: socketMessage.roomSlug
                        },
                        update: {
                            message: socketMessage.message
                        },
                        create: {
                            chatRooomSlug: socketMessage.roomSlug,
                            message: socketMessage.message
                        }
                    })
                }catch(e) {
                    console.log("Exception ", e)
                }
                
            }
            
        }else if(socketMessage.type === "exit_room") {
            //handle room exit logic
            const roomUser = RoomMapUser.get(socketMessage.roomSlug)?.filter((userSocket) => userSocket.userID!==ws.userID) || []
            RoomMapUser.set(socketMessage.roomSlug, roomUser);
            ws.close()
        }else {
            //unrecognized message
        }
    });

    ws.on("close", () => {
        // here we need to log the user out from all the rooms he was participating
        // RoomMapUser.forEach((val, key, map) => {
        //     const newVal = val.filter((userSocket) => userSocket.userID!==ws.userID);
        //     map.set(key, newVal)
        // })
        // const roomUser = RoomMapUser.get(socketMessage.roomSlug)?.filter((userSocket) => userSocket.userID!==ws.userID) || []
        // RoomMapUser.set(socketMessage.roomSlug, roomUser);
        

        // here we execute clearing websocket entries which are closed due to closing of windosw
        // this is going to be a compute expensive operation
        /*
        Map <
            "roomID": [
                {
                    userID: "bac",
                    sockets: [abc, dbc, ws]
                }
            ]
        >
        */
       // we want to transform this to:
       /*
        Map <
            "roomID": [
                {
                    userID: "bac",
                    sockets: [abc, dbc]
                }
            ]
        >
        */
       // we do not know the room though
       // User might be connected in many rooms
       RoomMapUser.forEach((val, key, map) => {
            const members = val;
            const roomSlug = key;
            members.forEach((mem) => {
                if (mem.userID === ws.userID) {
                    const index = mem.sockets.findIndex((skt) => skt === ws);
                    if (index !== -1) {
                        mem.sockets.splice(index, 1);
                    }
                }
            });
        });
       // RoomMapUser.forEach((val, key, map) => {
        //     const newVal = val.filter((userSocket) => userSocket.userID!==ws.userID);
        //     map.set(key, newVal)
        // })
        ws.close()
        console.log("Websocket connection closed: ", ws.userID);

    })
});