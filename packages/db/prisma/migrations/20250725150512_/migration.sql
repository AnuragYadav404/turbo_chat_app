/*
  Warnings:

  - A unique constraint covering the columns `[chatRooomSlug]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_chatRooomSlug_key" ON "ChatMessage"("chatRooomSlug");
