import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken"
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import "dotenv/config"

const wss = new WebSocketServer({ port: 8080 });

// need to write JWT logic on the ws-backend as well

// something like *upgrade* request
wss.on('connection', function connection(ws, req) {
    // how will our request look like:
    // ws://localhost:8080?token=123123
    // we need to extract token value from url params
    const url = req.url;
    if(!url) {
        // here we can do something even better
        // initial req can be intercepted before a websocket connection is established
        ws.close();
        return;
    }

    //extract queryParams from URL
    const urlParams = new URLSearchParams(url.split("?")[1])
    const token = urlParams.get("token") || "";

    const decoded = jwt.verify(token, getJwtSecret())
    if (typeof decoded === "string") {
            ws.close()
            return;    
        }
    if(!decoded || !(decoded as JwtPayload).userID) {
        ws.close();
        return;
    }
    // console.log('Received WebSocket connection with param:', paramValue);
    const userID = decoded.userID;

    ws.on('error', console.error);

    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

    ws.send('something');
});