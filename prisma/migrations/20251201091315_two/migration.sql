/*
  Warnings:

  - A unique constraint covering the columns `[businessId]` on the table `BusinessSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `BusinessSettings_businessId_key` ON `BusinessSettings`(`businessId`);
