ALTER TABLE "orders" ADD COLUMN "shipping_phone_2" varchar(20);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_new_arrival" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_trending" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "second_phone" varchar(20);