/*
  Warnings:

  - The primary key for the `Drink` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Drink` table. All the data in the column will be lost.
  - Changed the type of `ingredients` on the `Drink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `steps` on the `Drink` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_drinkId_fkey";

-- DropForeignKey
ALTER TABLE "DrinkLog" DROP CONSTRAINT "DrinkLog_drinkId_fkey";

-- DropForeignKey
ALTER TABLE "Like" DROP CONSTRAINT "Like_drinkId_fkey";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "drinkId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_pkey",
DROP COLUMN "createdAt",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "ingredients",
ADD COLUMN     "ingredients" JSONB NOT NULL,
DROP COLUMN "steps",
ADD COLUMN     "steps" JSONB NOT NULL,
ADD CONSTRAINT "Drink_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Drink_id_seq";

-- AlterTable
ALTER TABLE "DrinkLog" ALTER COLUMN "drinkId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Like" ALTER COLUMN "drinkId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrinkLog" ADD CONSTRAINT "DrinkLog_drinkId_fkey" FOREIGN KEY ("drinkId") REFERENCES "Drink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
