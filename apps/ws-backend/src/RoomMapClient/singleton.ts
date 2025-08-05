// here we create a class that will return the RoomMapUser store
import { WebSocket } from "ws";
import { SocketMessage, UserSocket } from "../types/customTypes"
import {prisma} from "@repo/db/client"
import { createClient, RedisClientType } from "redis";

interface RedisMessage {
    roomSlug: string,
    message: string
}


export default class RoomMapUserStore {

    static instance: RoomMapUserStore

    private redisClient: RedisClientType
    private pubRedisClient: RedisClientType
    private map: Map<string, UserSocket[]>

    private constructor() {
        this.map = new Map<string, UserSocket[]>();
        // here we should check the client connection as well
        this.redisClient = createClient();
        this.pubRedisClient = createClient();
        this.redisClient.connect();
        this.pubRedisClient.connect();
        
    }

    public static getInstance() {
        if(!RoomMapUserStore.instance) {
            RoomMapUserStore.instance = new RoomMapUserStore();
        }
        return RoomMapUserStore.instance;
    }

    public addUserToMap(ws: WebSocket, roomSlug: string) {
        const currentUsers = this.map.get(roomSlug);
        if(currentUsers) {
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
        }else {
            // no users exist for this room as of now

            // here we also add subscription to the redis client
            this.redisClient.subscribe(roomSlug, (message) => {
                this.handleRedisClientMessage(message);
            })

            this.map.set(roomSlug, [{
                sockets: [ws],
                userID: ws.userID
            }])
        }   


        
    }

    public async relayMessage(ws: WebSocket, roomSlug: string, message: string) {
        // this just check if user is member of this room or not
        const UserIsMember = this.map.get(roomSlug)?.some((userSocket) => userSocket.userID === ws.userID)

        if(UserIsMember) {
            // this.map.get(roomSlug)?.map((userSocket) => {
            //     userSocket.sockets.map((skt) => {
            //         skt.send(JSON.stringify({
            //             type:"chat",
            //             message: message
            //         }))
            //     })
            // })
            const redisPublishMessage = JSON.stringify({roomSlug, message})
            this.pubRedisClient.publish(roomSlug, redisPublishMessage)
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
        // here we need to clear out the subscriptions as well
        ws.close()
        this.manageRedisSubscriptions();
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
        this.manageRedisSubscriptions();
        console.log("Websocket connection closed: ", ws.userID);
    }

    private handleRedisClientMessage (redisMessage:string) {
        const {roomSlug, message} = JSON.parse(redisMessage);
        console.log("Message from redis client: ", roomSlug);
        // here we just broadcast the message to all the clients
        this.map.get(roomSlug)?.map((userSocket) => {
            userSocket.sockets.map((skt) => {
                skt.send(JSON.stringify({
                    type:"chat",
                    message: message
                }))
            })
        })
    }

    private manageRedisSubscriptions() {
        // here we need to loop through all keys and vals,
        console.log("map before: ", this.map)
        this.map.forEach((value, key) => {
            let staleRoom = true;
            value.map((userSocket) => {
                if(userSocket.sockets.length != 0) {
                    staleRoom = false;
                }
            })
            if(staleRoom) {
                this.redisClient.unsubscribe(key);
                this.map.delete(key);
                console.log("Stale room detected")
                console.log("map after: ", this.map)
            }
        })
    }
    
}