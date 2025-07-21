import {z} from "zod"

export const CreateUserSchema = z.object({
    email: z.string().min(3).max(20),
    password: z.string().min(3).max(20),
})

export const SignInSchema = z.object({
    email: z.string().min(3).max(20),
    password: z.string().min(3).max(20),
})

export const CreateRoomSchema = z.object({
    slug: z.string().min(3).max(20),
})