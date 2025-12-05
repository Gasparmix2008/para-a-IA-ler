/*
  Warnings:

  - You are about to drop the column `customerName` on the `adminforbusiness` table. All the data in the column will be lost.
  - Added the required column `adminName` to the `AdminForBusiness` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `adminforbusiness` DROP COLUMN `customerName`,
    ADD COLUMN `adminName` VARCHAR(191) NOT NULL;
