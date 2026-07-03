/*
  Warnings:

  - You are about to drop the column `accent` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `blurb` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `schools` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "schools" DROP COLUMN "accent",
DROP COLUMN "blurb",
DROP COLUMN "logo";
