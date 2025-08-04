import { WebSocket } from "ws";

export interface SocketMessage {
    type: string,
    roomSlug: string,
    // userID: string, // need to remove this from here
    message?:string
}

export interface UserSocket {
    sockets: WebSocket[],
    userID: string,
}

export type Member = UserSocket[];