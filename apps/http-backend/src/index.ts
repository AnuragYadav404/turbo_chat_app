import express from "express";
import {CreateUserSchema, CreateRoomSchema, SignInSchema} from "@repo/common/types"
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middlewares/authMiddleware";
import {getJwtSecret} from "@repo/backend-common/jwt_secret"
import 'dotenv/config';
import {prisma} from "@repo/db/client"
import cors from "cors";

const app = express();
app.use(express.json())
app.use(cors())
app.post("/signup", async (req, res) => {
    console.log(req.body)
    //zod validation
    const parsedData = CreateUserSchema.safeParse(req.body);
    // console.log(parsedData)
    console.log(req.body)
    if(!parsedData.success) {
        res.status(400).json({
            message: "Bad Request Credentials",
        })
        return
    }

    // here we do db calls to create a user
    //*/ TODO */ but before that we need to hash the password as well
    // wrap in try catch

    try{
        const user = await prisma.user.create({
            data:{
                email:parsedData.data.email,
                hashedPassword: parsedData.data.password
            }
        })
        res.status(200).json({
            message:"User sign up succesfull"
        })
    }catch (e) {
        res.status(409).json({
            message: "User with this email already exists",

        })
        return
    }
})

app.post("/signin", async(req, res) => {
    //zod validaton
    const parsedData = SignInSchema.safeParse(req.body)
    if(!parsedData.success) {
        res.status(400).json({
            message: "Bad Request Credentials",

        })
        return
    }

    // do a db call to *retrieve* User
    // retrieve userID from DB call
    // check if user already exists or not

    try{
        const user = await prisma.user.findFirst({
            where: {
                email:parsedData.data.email,
                hashedPassword: parsedData.data.password
            }
            
        })

        if(!user){
            res.status(400).json({
                message: "Bad Request Credentials. No such user exists",

            })
            return
        }
        // user has been retrieved, and now we want to do what, we want to create token
        const token = jwt.sign({
            userID: user.userID
        }, getJwtSecret())

        res.status(200).json({
            message: "Sign in sucessfull",
            token
        })

    }catch (e) {
        res.status(409).json({
            message: "User with this email already exists",

        })
        return
    }

})

app.post("/create-room", authMiddleware, async(req, res) => {
    // need to add authMiddleware here
    // do zod validation here
    if(!req.userID){
        res.status(403).json({
            message: "Un-authenticated request. No token found"
        })
        return;
    }

    const parsedData = CreateRoomSchema.safeParse(req.body)
    if(!parsedData.success) {
        res.status(400).json({
            message: "Bad Request Credentials",

        })
        return
    }

    const chatRoom = await prisma.chatRoom.create({
        data: {
            adminID: req.userID,
            roomSlug: parsedData.data.slug
        }
    })

    res.status(200).json({
        message: "Room created succesfully",
        slug: chatRoom.roomSlug
    })
    return;

})

app.get("/chat/:roomSlug", authMiddleware,async (req, res) => {
    // here this route is not authenticated based on roles and attributes
    // we need to check whether the current request is member of the chatRoom
    const roomSlug = req.params.roomSlug;

    // here we want to find the message of
    // chatMessges
    // join operation or two DB calls
    try{
        
        // now given we have roomID, we need to find the messages

        const roomMessages = await prisma.chatMessage.findFirst({
            where: {
                chatRooomSlug: roomSlug
            }
        })

        res.status(200).json({
            messages:roomMessages
        })

    }catch(e) {
        res.status(400).json({
            message: "No such room exists",
        })
        return
    }
    
})  




app.listen(3000, () => {
    console.log("HTTP server running on: http://localhost:3000");
    console.log("Jwt secret is: ", getJwtSecret())
})