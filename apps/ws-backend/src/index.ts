import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken"
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import "dotenv/config"

const wss = new WebSocketServer({ port: 8080 });

interface SocketMessage {
    type: string,
    roomSlug: string,
    userID: string,
    message?:string
}

interface UserSocket {
    socket: WebSocket,
    userID: string,
}

const RoomMapUser = new Map<string, UserSocket[]>()

function getUserID(url: string): boolean | null {
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
wss.on('connection', function connection(ws, req) {
    const url = req.url;
    if(!url) {
        // here we can do something even better -> initial req can be intercepted before a websocket connection is established
        ws.close();
        return;
    }
    const userID = getUserID(url)

    if(!userID){
        ws.close();
    }

    ws.on('error', console.error);

    ws.on('message', function message(data) {
        const socketMessage:SocketMessage = JSON.parse(data.toString())
        if(socketMessage.type === "join_room") {
            //join room logic
            // how do we handle join room logic
            // something to do with singleton pattern
            // something to do in memory
            // map of {
            //     "roomSlug": [array of userID]
            // }
            // why? -> we have to be iterating the list of room, on chat_message
            // find a room, and then send message to each user connected in the room

            // we might want to check if room_slug exists or not, but we can only do this using DB
            RoomMapUser.set(socketMessage.roomSlug, [ ... (RoomMapUser.get(socketMessage.roomSlug) || []) , {
                socket: ws,
                userID: socketMessage.userID
            }])

        }else if(socketMessage.type === "chat_message") {
            //send message in chat
            console.log(socketMessage.message)
            //check if user is memeber of the room
            // const UserArray = RoomMapUser.get(socketMessage.roomSlug);
            // // how does UserArray look like?
            // // [{socket:WebSocket, userID:string}, {socket:WebSocket, userID:string}]
            // // we want to check if there exists an entry with specfic userID
            // const UserIsMember = UserArray?.some((userSocket) => userSocket.userID===socketMessage.userID) ?? false;
            const UserIsMember = RoomMapUser.get(socketMessage.roomSlug)?.some((userSocket) => userSocket.userID === socketMessage.userID)
            console.log(socketMessage.userID);
            // console.log(RoomMapUser.get(socketMessage.roomSlug)[0])
            console.log(RoomMapUser)
            if(UserIsMember) {
                console.log("User was found")
                RoomMapUser.get(socketMessage.roomSlug)?.map((userSocket) => {
                    userSocket.socket.send(JSON.stringify(socketMessage.message))
                })
            }
            
        }else if(socketMessage.type === "exit_room") {
            //handle room exit logic
            const roomUser = RoomMapUser.get(socketMessage.roomSlug)?.filter((userSocket) => userSocket.userID!==socketMessage.userID) || []
            RoomMapUser.set(socketMessage.roomSlug, roomUser);
            ws.close()
        }else {
            //unrecognized message
        }
    });
});