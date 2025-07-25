/*
  Warnings:

  - You are about to drop the column `userID` on the `ChatMessage` table. All the data in the column will be lost.
  - Changed the type of `message` on the `ChatMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userID_fkey";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "userID",
DROP COLUMN "message",
ADD COLUMN     "message" JSONB NOT NULL;
