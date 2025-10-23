import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, QrCode, CheckCircle2, Package } from "lucide-react";
import { supabase, Order, generateBlockchainTxId } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [checkpointForm, setCheckpointForm] = useState({
    checkpoint_type: "farm_pickup",
    location: "",
    notes: "",
    qr_scanned: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        products:product_id (
          product_name,
          qr_code,
          farms:farm_id (
            farm_name,
            location
          )
        )
      `)
      .in("status", ["confirmed", "picked_up", "in_transit"])
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching orders", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
  };

  const handleScanCheckpoint = async () => {
    if (!selectedOrder || !checkpointForm.location) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate blockchain transaction
    const txId = generateBlockchainTxId();

    // Create blockchain transaction
    await supabase.from("blockchain_transactions").insert({
      transaction_id: txId,
      order_id: selectedOrder.id,
      product_id: selectedOrder.product_id,
      actor_id: user.id,
      action_type: checkpointForm.checkpoint_type,
      location: checkpointForm.location,
      metadata: { notes: checkpointForm.notes },
    });

    // Create checkpoint
    const { error } = await supabase.from("delivery_checkpoints").insert({
      order_id: selectedOrder.id,
      delivery_agent_id: user.id,
      checkpoint_type: checkpointForm.checkpoint_type as any,
      location: checkpointForm.location,
      qr_scanned: checkpointForm.qr_scanned,
      notes: checkpointForm.notes,
      blockchain_tx_id: txId,
    });

    if (error) {
      toast({ title: "Error creating checkpoint", variant: "destructive" });
      return;
    }

    // Update order status
    let newStatus = "in_transit";
    if (checkpointForm.checkpoint_type === "farm_pickup") newStatus = "picked_up";
    if (checkpointForm.checkpoint_type === "customer_delivery") newStatus = "delivered";

    await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", selectedOrder.id);

    toast({ 
      title: "Checkpoint recorded on blockchain!", 
      description: `Transaction ID: ${txId.slice(0, 16)}...` 
    });

    fetchOrders();
    setSelectedOrder(null);
    setCheckpointForm({
      checkpoint_type: "farm_pickup",
      location: "",
      notes: "",
      qr_scanned: false,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-info/10 text-info border-info/20",
      picked_up: "bg-secondary/10 text-secondary border-secondary/20",
      in_transit: "bg-accent/10 text-accent border-accent/20",
      delivered: "bg-success/10 text-success border-success/20",
    };
    return colors[status] || "bg-muted/10 text-muted-foreground";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Delivery Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Scan checkpoints and update blockchain ledger</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Active Deliveries</CardTitle>
              <CardDescription>Orders ready for pickup and delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{orders.length}</div>
            </CardContent>
          </Card>

          <Card className="border-secondary/20">
            <CardHeader>
              <CardTitle>Today's Checkpoints</CardTitle>
              <CardDescription>Blockchain records created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-secondary">0</div>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle>QR Scans</CardTitle>
              <CardDescription>Verified deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">0</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Active Orders
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="border-primary/20 hover:shadow-glow transition-smooth">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.products?.product_name}</CardTitle>
                      <CardDescription>
                        From {order.products?.farms?.farm_name}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Pickup Location:</p>
                        <p className="text-muted-foreground">{order.products?.farms?.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Delivery Address:</p>
                        <p className="text-muted-foreground">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full gradient-tech shadow-tech"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan Checkpoint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Checkpoint</DialogTitle>
                        <DialogDescription>
                          This will be recorded on the blockchain
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Checkpoint Type</Label>
                          <Select
                            value={checkpointForm.checkpoint_type}
                            onValueChange={(value) =>
                              setCheckpointForm({ ...checkpointForm, checkpoint_type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="farm_pickup">Farm Pickup</SelectItem>
                              <SelectItem value="warehouse">Warehouse</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="customer_delivery">Customer Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Location</Label>
                          <Input
                            value={checkpointForm.location}
                            onChange={(e) =>
                              setCheckpointForm({ ...checkpointForm, location: e.target.value })
                            }
                            placeholder="Current location"
                          />
                        </div>

                        <div>
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            value={checkpointForm.notes}
                            onChange={(e) =>
                              setCheckpointForm({ ...checkpointForm, notes: e.target.value })
                            }
                            placeholder="Additional notes about this checkpoint"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="qr_scanned"
                            checked={checkpointForm.qr_scanned}
                            onChange={(e) =>
                              setCheckpointForm({
                                ...checkpointForm,
                                qr_scanned: e.target.checked,
                              })
                            }
                            className="rounded border-border"
                          />
                          <Label htmlFor="qr_scanned">QR Code Scanned</Label>
                        </div>

                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-primary font-medium">
                              This checkpoint will be permanently recorded on the blockchain
                            </span>
                          </div>
                        </div>

                        <Button onClick={handleScanCheckpoint} className="w-full gradient-organic">
                          Record Checkpoint
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {orders.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Truck className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active deliveries at the moment</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DeliveryDashboard;