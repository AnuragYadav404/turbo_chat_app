import express from "express";
import {CreateUserSchema, CreateRoomSchema, SignInSchema} from "@repo/common/types"
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/authMiddleware";
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import 'dotenv/config';
const app = express();

app.post("/signup", (req, res) => {
    // do zod validation here
    const data = CreateUserSchema.safeParse(req.body);

    if(!data.success) {
        res.json({
            message: "Bad Request Credentials",
            error: data.error
        })
        return
    }
    // do a db call to *create* User
    // retrieve userID from DB call
    let userID = "123123";
    res.json({
        message: "Sign up sucessfull",
        userID
    })
})

app.post("/signin", (req, res) => {
    // do zod validation here

    const data = SignInSchema.safeParse(req.body)

    if(!data.success) {
        res.json({
            message: "Bad Request Credentials",
            error: data.error
        })
        return
    }

    // do a db call to *retrieve* User
    // retrieve userID from DB call
    // check if user already exists or not
    let userID = "123123";

    const token = jwt.sign({
        userID
    }, getJwtSecret())
    res.json({
        message: "Sign in sucessfull",
        token
    })
})

app.post("/create-room", authMiddleware,(req, res) => {
    // need to add authMiddleware here
    // do zod validation here
    const data = CreateRoomSchema.safeParse(req.body)
    if(!data.success) {
        res.json({
            message: "Bad Request Credentials",
            error: data.error
        })
        return
    }

    res.json({
        message: "Room created",
        roomID: "123123"
    })
})

app.listen(3000, () => {
    console.log("HTTP server running on: http://localhost:3000");
    console.log("Jwt secret is: ", getJwtSecret())
})