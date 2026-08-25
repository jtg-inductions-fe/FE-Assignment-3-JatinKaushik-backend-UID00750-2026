-- CreateIndex
CREATE INDEX "address_userId_idx" ON "address"("userId");

-- CreateIndex
CREATE INDEX "coupon_restaurantId_idx" ON "coupon"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_category_restaurantId_idx" ON "menu_category"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_item_restaurantId_idx" ON "menu_item"("restaurantId");

-- CreateIndex
CREATE INDEX "menu_item_categoryId_idx" ON "menu_item"("categoryId");

-- CreateIndex
CREATE INDEX "order_customerId_idx" ON "order"("customerId");

-- CreateIndex
CREATE INDEX "order_restaurantId_idx" ON "order"("restaurantId");

-- CreateIndex
CREATE INDEX "order_couponId_idx" ON "order"("couponId");

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_menuItemId_idx" ON "order_item"("menuItemId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_idx" ON "order_status_history"("orderId");

-- CreateIndex
CREATE INDEX "order_status_history_changedBy_idx" ON "order_status_history"("changedBy");

-- CreateIndex
CREATE INDEX "refresh_token_userId_idx" ON "refresh_token"("userId");

-- CreateIndex
CREATE INDEX "restaurant_ownerId_idx" ON "restaurant"("ownerId");
