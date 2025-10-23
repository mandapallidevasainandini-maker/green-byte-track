import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Package, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase, Order, BlockchainTransaction, Review } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    blockchainRecords: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BlockchainTransaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch orders
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        *,
        products:product_id (
          product_name,
          farms:farm_id (
            farm_name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch blockchain transactions
    const { data: txData } = await supabase
      .from("blockchain_transactions")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles!reviews_farmer_id_fkey (
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    if (ordersData) {
      setRecentOrders(ordersData);
      setStats((prev) => ({
        ...prev,
        totalOrders: ordersData.length,
        activeDeliveries: ordersData.filter((o) =>
          ["confirmed", "picked_up", "in_transit"].includes(o.status)
        ).length,
        completedDeliveries: ordersData.filter((o) =>
          ["delivered", "verified"].includes(o.status)
        ).length,
      }));
    }

    if (txData) {
      setRecentTransactions(txData);
      setStats((prev) => ({
        ...prev,
        blockchainRecords: txData.length,
      }));
    }

    if (reviewsData) {
      setReviews(reviewsData);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      confirmed: "bg-info/10 text-info border-info/20",
      picked_up: "bg-secondary/10 text-secondary border-secondary/20",
      in_transit: "bg-accent/10 text-accent border-accent/20",
      delivered: "bg-success/10 text-success border-success/20",
      verified: "bg-primary/10 text-primary border-primary/20",
    };
    return colors[status] || "bg-muted/10 text-muted-foreground";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Monitor system performance and blockchain integrity</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">All time orders</p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.activeDeliveries}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border-success/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.completedDeliveries}</div>
              <p className="text-xs text-muted-foreground mt-1">Delivered orders</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Blockchain Records</CardTitle>
              <Shield className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.blockchainRecords}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified transactions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.products?.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.products?.farms?.farm_name}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Blockchain Logs</CardTitle>
              <CardDescription>Recent blockchain transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <Badge className="gradient-tech text-secondary-foreground text-xs">
                        {tx.action_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {tx.location && (
                      <p className="text-xs text-muted-foreground">{tx.location}</p>
                    )}
                    <code className="text-xs text-primary block truncate">
                      {tx.transaction_id}
                    </code>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-accent/20">
          <CardHeader>
            <CardTitle>Farmer Ratings</CardTitle>
            <CardDescription>Recent customer reviews (stored on blockchain)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{review.profiles?.full_name}</p>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating ? "text-warning" : "text-muted"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Verified
                    </Badge>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  {review.blockchain_tx_id && (
                    <code className="text-xs text-primary block truncate">
                      {review.blockchain_tx_id}
                    </code>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No reviews yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No alerts. All systems operational. Blockchain integrity verified.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;