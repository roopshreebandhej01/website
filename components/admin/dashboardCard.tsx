// components/dashboard-cards.tsx
import { ShoppingCart, Package, Users, IndianRupee } from "lucide-react"
import { StatCard } from "./statCard"
import { getDashboardStats } from "@/helper/dashboard/action"

export async function DashboardCards() {
  const stats = await getDashboardStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Orders" 
        value={stats.totalOrders.toLocaleString()} 
        subtitle="All time orders" 
        subtitleVariant="positive"
        icon={<ShoppingCart className="text-sky-500" size={24} />}
        iconBg="bg-sky-100/50"
      />
      <StatCard 
        title="Total Products" 
        value={stats.totalProducts.toLocaleString()}
        subtitle="All time products" 
        icon={<Package className="text-purple-500" size={24} />}
        iconBg="bg-purple-100/50"
      />
      <StatCard 
        title="Total Users" 
        value={stats.totalUsers.toLocaleString()} 
        subtitle="Registered users" 
        icon={<Users className="text-yellow-500" size={24} />}
        iconBg="bg-yellow-100/50"
      />
      <StatCard 
        title="Total Revenue" 
        value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} 
        subtitle="All time revenue" 
        icon={<IndianRupee className="text-emerald-500" size={24} />}
        iconBg="bg-emerald-100/50"
      />
    </div>
  )
}
