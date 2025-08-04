import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken"
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import "dotenv/config"
import { SocketMessage, UserSocket } from './types/customTypes';
import RoomMapUserStore from './RoomMapClient/singleton';
const wss = new WebSocketServer({ port: 8080 });



type Member = UserSocket[];

// const RoomMapUser = new Map<string, UserSocket[]>()

const RoomMapUserInstance = RoomMapUserStore.getInstance();
const RoomMapUser = RoomMapUserInstance.getMap();

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
            console.log("Failed to authenticate request")
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

            RoomMapUserInstance.addUserToMap(ws, socketMessage.roomSlug)

        }else if(socketMessage.type === "chat_message") {

            if(!socketMessage.message) {
               return;
            }
            RoomMapUserInstance.relayMessage(ws, socketMessage.roomSlug, socketMessage.message)

            
            
        }else if(socketMessage.type === "exit_room") {
            //handle room exit logic
            RoomMapUserInstance.handleUserExit(ws, socketMessage.roomSlug);
            
        }else {
            //unrecognized message
            // how do we handle this?

        }
    });

    ws.on("close", () => {

        RoomMapUserInstance.handleWebSocketConnectionClose(ws);

    })
});