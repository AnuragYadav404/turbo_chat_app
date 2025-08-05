import { WebSocket } from "ws";

export enum SupportedMessages {
    JoinRoom = "join_room",
    ChatMessage = "chat_message",
    ExitRoom = "exit_room",
}

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