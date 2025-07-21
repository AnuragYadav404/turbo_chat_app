-- CreateTable
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "username" TEXT,
    "avatarURL" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "messageID" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "chatRooomID" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("messageID")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "roomID" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminID" TEXT NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("roomID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_messageID_key" ON "ChatMessage"("messageID");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_roomID_key" ON "ChatRoom"("roomID");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_slug_key" ON "ChatRoom"("slug");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatRooomID_fkey" FOREIGN KEY ("chatRooomID") REFERENCES "ChatRoom"("roomID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_adminID_fkey" FOREIGN KEY ("adminID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
