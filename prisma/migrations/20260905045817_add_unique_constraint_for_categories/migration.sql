/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,name]` on the table `menu_category` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "menu_category_restaurantId_name_key" ON "menu_category"("restaurantId", "name");
