import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Package, MapPin, Star, CheckCircle2, QrCode } from "lucide-react";
import { supabase, Product, Order, BlockchainTransaction } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Html5QrcodeScanner } from "html5-qrcode";

const CustomerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [blockchainHistory, setBlockchainHistory] = useState<BlockchainTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        farms:farm_id (
          farm_name,
          location,
          organic_certified
        )
      `)
      .eq("status", "harvested")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching products", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
  };

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
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
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching orders", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !orderAddress) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totalPrice = orderQuantity * parseFloat(selectedProduct.price_per_unit.toString());

    const { error } = await supabase.from("orders").insert({
      customer_id: user.id,
      product_id: selectedProduct.id,
      quantity: orderQuantity,
      total_price: totalPrice,
      delivery_address: orderAddress,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error placing order", variant: "destructive" });
    } else {
      toast({ title: "Order placed successfully!" });
      fetchOrders();
      setSelectedProduct(null);
      setOrderAddress("");
      setOrderQuantity(1);
    }
  };

  const fetchBlockchainHistory = async (productId: string) => {
    const { data, error } = await supabase
      .from("blockchain_transactions")
      .select("*")
      .eq("product_id", productId)
      .order("timestamp", { ascending: false });

    if (error) {
      toast({ title: "Error fetching blockchain history", variant: "destructive" });
    } else {
      setBlockchainHistory(data || []);
      setShowHistory(true);
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
            Customer Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Browse products and track your orders</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Available Products
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((product: any) => (
                  <Card key={product.id} className="border-primary/20 hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {product.product_name}
                        {product.farms?.organic_certified && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription>{product.farms?.farm_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">
                          ${product.price_per_unit}/{product.unit}
                        </span>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {product.quantity} {product.unit} available
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                              className="flex-1"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Order
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Place Order</DialogTitle>
                              <DialogDescription>
                                {product.product_name} from {product.farms?.farm_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Quantity ({product.unit})</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max={product.quantity}
                                  value={orderQuantity}
                                  onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div>
                                <Label>Delivery Address</Label>
                                <Textarea
                                  value={orderAddress}
                                  onChange={(e) => setOrderAddress(e.target.value)}
                                  placeholder="Enter your complete delivery address"
                                />
                              </div>
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="flex justify-between text-lg font-semibold">
                                  <span>Total:</span>
                                  <span className="text-primary">
                                    ${(orderQuantity * parseFloat(product.price_per_unit)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <Button onClick={handlePlaceOrder} className="w-full gradient-tech">
                                Confirm Order
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchBlockchainHistory(product.id)}
                        >
                          View History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  My Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{order.products?.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.products?.farms?.farm_name}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{order.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold text-primary">${order.total_price}</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Blockchain History</DialogTitle>
              <DialogDescription>Complete traceability from farm to delivery</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {blockchainHistory.map((tx) => (
                <div key={tx.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <Badge className="gradient-tech text-secondary-foreground">
                      {tx.action_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {tx.location && (
                    <div className="flex gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{tx.location}</span>
                    </div>
                  )}
                  <code className="text-xs text-primary block">{tx.transaction_id}</code>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CustomerDashboard;