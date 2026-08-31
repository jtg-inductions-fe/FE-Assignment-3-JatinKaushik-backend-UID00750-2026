/*
  Warnings:

  - You are about to drop the column `total` on the `order` table. All the data in the column will be lost.
  - Changed the type of `vegType` on the `menu_item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `order_status_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dietaryType` on the `restaurant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'RESTAURANT_OWNER');

-- CreateEnum
CREATE TYPE "DietaryType" AS ENUM ('VEG', 'NON_VEG', 'BOTH');

-- CreateEnum
CREATE TYPE "VegType" AS ENUM ('VEG', 'NON_VEG');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REJECTED');

-- AlterTable
ALTER TABLE "menu_item" DROP COLUMN "vegType",
ADD COLUMN     "vegType" "VegType" NOT NULL;

-- AlterTable
ALTER TABLE "order" DROP COLUMN "total",
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "order_status_history" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "restaurant" DROP COLUMN "dietaryType",
ADD COLUMN     "dietaryType" "DietaryType" NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- Add database validation rules (CHECK constraints)
-- Enforce that an address belongs strictly to either a user or a restaurant, never both or neither
ALTER TABLE "address" ADD CONSTRAINT "address_exactly_one_owner_check"
  CHECK (num_nonnulls("userId", "restaurantId") = 1);

-- Validate price, stock balances, sorting limits, and coupon discount limits
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_positive_price_check" 
  CHECK ("price" >= 0.00);

ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_non_negative_stock_check" 
  CHECK ("stockQty" >= 0);

ALTER TABLE "menu_category" ADD CONSTRAINT "menu_category_positive_sort_check" 
  CHECK ("sortOrder" >= 0);

ALTER TABLE "coupon" ADD CONSTRAINT "coupon_valid_discount_percentage_check" 
  CHECK ("discountPercent" >= 0.00 AND "discountPercent" <= 100.00);

-- Validate monetary calculation structures for receipts
ALTER TABLE "order" ADD CONSTRAINT "order_positive_values_check" 
  CHECK ("subtotal" >= 0.00 AND "platformFee" >= 0.00 AND "discount" >= 0.00);

ALTER TABLE "order_item" ADD CONSTRAINT "order_item_positive_values_check" 
  CHECK ("priceSnapshot" >= 0.00 AND "quantity" > 0);
