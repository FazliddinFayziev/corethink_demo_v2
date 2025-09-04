/*
  Warnings:

  - The `messages` column on the `projects` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "messages",
ADD COLUMN     "messages" JSONB[];
