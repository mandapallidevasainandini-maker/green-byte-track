import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, QrCode, CheckCircle2, Package, Leaf } from "lucide-react";
import { supabase, generateBlockchainTxId, generateQRData, Product, Farm } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

const FarmerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingFarm, setIsAddingFarm] = useState(false);
  const [showQR, setShowQR] = useState<Product | null>(null);
  const { toast } = useToast();

  const [farmForm, setFarmForm] = useState({
    farm_name: "",
    location: "",
    organic_certified: false,
    certification_number: "",
  });

  const [productForm, setProductForm] = useState({
    product_name: "",
    description: "",
    harvest_date: new Date().toISOString().split("T")[0],
    pesticide_used: false,
    pesticide_details: "",
    quantity: "",
    unit: "kg",
    price_per_unit: "",
  });

  useEffect(() => {
    fetchFarms();
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      fetchProducts();
    }
  }, [selectedFarm]);

  const fetchFarms = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching farms", variant: "destructive" });
    } else {
      setFarms(data || []);
      if (data && data.length > 0 && !selectedFarm) {
        setSelectedFarm(data[0].id);
      }
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("farm_id", selectedFarm)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching products", variant: "destructive" });
    } else {
      setProducts(data || []);
    }
  };

  const handleAddFarm = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("farms").insert({
      ...farmForm,
      farmer_id: user.id,
    });

    if (error) {
      toast({ title: "Error adding farm", variant: "destructive" });
    } else {
      toast({ title: "Farm added successfully!" });
      setIsAddingFarm(false);
      fetchFarms();
      setFarmForm({
        farm_name: "",
        location: "",
        organic_certified: false,
        certification_number: "",
      });
    }
  };

  const handleAddProduct = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const txId = generateBlockchainTxId();
    const productId = crypto.randomUUID();
    const qrData = generateQRData(productId, txId);

    const { error: productError } = await supabase.from("products").insert({
      id: productId,
      farm_id: selectedFarm,
      ...productForm,
      quantity: parseFloat(productForm.quantity),
      price_per_unit: parseFloat(productForm.price_per_unit),
      qr_code: qrData,
      blockchain_tx_id: txId,
      status: "harvested",
    });

    if (productError) {
      toast({ title: "Error adding product", variant: "destructive" });
      return;
    }

    // Create blockchain transaction
    await supabase.from("blockchain_transactions").insert({
      transaction_id: txId,
      product_id: productId,
      actor_id: user.id,
      action_type: "harvest",
      metadata: { ...productForm },
    });

    toast({ title: "Product added & blockchain recorded!" });
    setIsAddingProduct(false);
    fetchProducts();
    setProductForm({
      product_name: "",
      description: "",
      harvest_date: new Date().toISOString().split("T")[0],
      pesticide_used: false,
      pesticide_details: "",
      quantity: "",
      unit: "kg",
      price_per_unit: "",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Farmer Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage your farms and products with blockchain verification</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddingFarm} onOpenChange={setIsAddingFarm}>
              <DialogTrigger asChild>
                <Button className="gradient-organic shadow-glow">
                  <Leaf className="w-4 h-4 mr-2" />
                  Add Farm
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Farm</DialogTitle>
                  <DialogDescription>Enter your farm details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Farm Name</Label>
                    <Input
                      value={farmForm.farm_name}
                      onChange={(e) => setFarmForm({ ...farmForm, farm_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={farmForm.location}
                      onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={farmForm.organic_certified}
                      onCheckedChange={(checked) =>
                        setFarmForm({ ...farmForm, organic_certified: checked })
                      }
                    />
                    <Label>Organic Certified</Label>
                  </div>
                  {farmForm.organic_certified && (
                    <div>
                      <Label>Certification Number</Label>
                      <Input
                        value={farmForm.certification_number}
                        onChange={(e) =>
                          setFarmForm({ ...farmForm, certification_number: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <Button onClick={handleAddFarm} className="w-full">
                    Add Farm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
              <DialogTrigger asChild>
                <Button className="gradient-tech shadow-tech">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Product will be registered on blockchain</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={productForm.product_name}
                      onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Harvest Date</Label>
                    <Input
                      type="date"
                      value={productForm.harvest_date}
                      onChange={(e) => setProductForm({ ...productForm, harvest_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={productForm.quantity}
                        onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Price per Unit ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.price_per_unit}
                      onChange={(e) => setProductForm({ ...productForm, price_per_unit: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={productForm.pesticide_used}
                      onCheckedChange={(checked) =>
                        setProductForm({ ...productForm, pesticide_used: checked })
                      }
                    />
                    <Label>Pesticide Used</Label>
                  </div>
                  {productForm.pesticide_used && (
                    <div>
                      <Label>Pesticide Details</Label>
                      <Textarea
                        value={productForm.pesticide_details}
                        onChange={(e) =>
                          setProductForm({ ...productForm, pesticide_details: e.target.value })
                        }
                      />
                    </div>
                  )}
                  <Button onClick={handleAddProduct} className="w-full">
                    Add Product & Generate QR
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {farms.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {farms.map((farm) => (
              <Button
                key={farm.id}
                variant={selectedFarm === farm.id ? "default" : "outline"}
                onClick={() => setSelectedFarm(farm.id)}
                className="whitespace-nowrap"
              >
                {farm.farm_name}
                {farm.organic_certified && <CheckCircle2 className="w-4 h-4 ml-2 text-primary" />}
              </Button>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="border-primary/20 hover:shadow-glow transition-smooth">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.product_name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize bg-primary/10 text-primary border-primary/20">
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{product.quantity} {product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${product.price_per_unit}/{product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harvest:</span>
                  <span className="font-medium">{new Date(product.harvest_date).toLocaleDateString()}</span>
                </div>
                {product.pesticide_used && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    Pesticide Used
                  </Badge>
                )}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowQR(product)}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        View QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{product.product_name}</DialogTitle>
                        <DialogDescription>Blockchain-verified QR Code</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <QRCodeSVG value={product.qr_code || ""} size={256} />
                        </div>
                        <div className="w-full space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">TX ID:</span>
                            <code className="text-xs text-primary">{product.blockchain_tx_id?.slice(0, 16)}...</code>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && farms.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products yet. Add your first product to get started!</p>
            </CardContent>
          </Card>
        )}

        {farms.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Leaf className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No farms yet. Add your first farm to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default FarmerDashboard;