"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { orders } from "@/db/schema/orders";
import { users } from "@/db/schema/users";
import { products } from "@/db/schema/products";

const dashboardStatsFallback = {
  totalProducts: 0,
  totalOrders: 0,
  totalUsers: 0,
  totalRevenue: 0,
};

export async function getDashboardStats() {
  try {
    const [stats] = await Promise.race([
      db.execute<{
        totalProducts: number;
        totalOrders: number;
        totalUsers: number;
        totalRevenueInPaise: string | number | null;
      }>(sql`
        select
          (select count(*)::int from ${products}) as "totalProducts",
          (select count(*)::int from ${orders} where ${orders.status} != 'pending' and  ${orders.status} != 'cancelled' and  ${orders.status} != 'refunded') as "totalOrders",
          (select count(*)::int from ${users}) as "totalUsers",
          (select coalesce(sum(${orders.totalAmount}), 0) from ${orders} where ${orders.status} != 'pending' and  ${orders.status} != 'cancelled' and  ${orders.status} != 'refunded') as "totalRevenueInPaise"
      `),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Dashboard stats timed out")), 4_000);
      }),
    ]);

    const totalRevenueInPaise = Number(stats?.totalRevenueInPaise ?? 0);

    return {
      totalProducts: stats?.totalProducts ?? 0,
      totalOrders: stats?.totalOrders ?? 0,
      totalUsers: stats?.totalUsers ?? 0,
      totalRevenue: totalRevenueInPaise / 100,
    };
  } catch (error) {
    console.error("Dashboard stats failed:", error);
    return dashboardStatsFallback;
  }
}
