/*
  Warnings:

  - You are about to drop the column `chatRooomID` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `ChatRoom` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roomSlug]` on the table `ChatRoom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatRooomSlug` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomSlug` to the `ChatRoom` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_chatRooomID_fkey";

-- DropIndex
DROP INDEX "ChatRoom_slug_key";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "chatRooomID",
ADD COLUMN     "chatRooomSlug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ChatRoom" DROP COLUMN "slug",
ADD COLUMN     "roomSlug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_roomSlug_key" ON "ChatRoom"("roomSlug");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatRooomSlug_fkey" FOREIGN KEY ("chatRooomSlug") REFERENCES "ChatRoom"("roomSlug") ON DELETE RESTRICT ON UPDATE CASCADE;
