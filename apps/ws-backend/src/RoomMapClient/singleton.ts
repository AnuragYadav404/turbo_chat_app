// here we create a class that will return the RoomMapUser store
import { WebSocket } from "ws";
import { SocketMessage, UserSocket } from "../types/customTypes"
import {prisma} from "@repo/db/client"

export default class RoomMapUserStore {

    static instance: RoomMapUserStore

    private map: Map<string, UserSocket[]>

    private constructor() {
        this.map = new Map<string, UserSocket[]>();
    }

    public static getInstance() {
        if(!RoomMapUserStore.instance) {
            RoomMapUserStore.instance = new RoomMapUserStore();
        }
        return RoomMapUserStore.instance;
    }

    public getMap() {
        return this.map;
    }

    public addUserToMap(ws: WebSocket, roomSlug: string) {
        const currentUsers = this.map.get(roomSlug);

        let currentSockets = null;

        // this checks whether the current user is already logged in from some other socket
        currentUsers?.map((user) => {
            if(user.userID == ws.userID) {
                console.log("Existing User joining same room")
                currentSockets = user.sockets;
            }
        })

        
        if(currentSockets) {
            this.map.get(roomSlug)?.map((user) => {
                if(user.userID == ws.userID) {
                    user.sockets.push(ws);
                }
            })
        }else {
            this.map.set(roomSlug, [ ... (this.map.get(roomSlug) || []) , {
                sockets: [ws],
                userID: ws.userID
            }])
        }
    }

    public async relayMessage(ws: WebSocket, roomSlug: string, message: string) {

        const UserIsMember = this.map.get(roomSlug)?.some((userSocket) => userSocket.userID === ws.userID)

        if(UserIsMember) {
            console.log("User was found");
            console.log("previous user reconnecting")
            this.map.get(roomSlug)?.map((userSocket) => {
                userSocket.sockets.map((skt) => {
                    skt.send(JSON.stringify({
                        type:"chat",
                        message: message
                    }))
                })
            })
            try{
                await prisma.chatMessage.upsert({
                    where: {
                        chatRooomSlug: roomSlug
                    },
                    update: {
                        message: message
                    },
                    create: {
                        chatRooomSlug: roomSlug,
                        message: message
                    }
                })
            }catch(e) {
                console.log("Exception ", e)
            }
            
        }
    }

    public handleUserExit(ws: WebSocket, roomSlug: string) {
        const roomUser = this.map.get(roomSlug)?.filter((userSocket) => userSocket.userID!==ws.userID) || []
        this.map.set(roomSlug, roomUser);
        ws.close()
    }

    public handleWebSocketConnectionClose(ws: WebSocket) {
        this.map.forEach((val, key, map) => {
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
        ws.close()
        console.log("Websocket connection closed: ", ws.userID);
    }

    
}