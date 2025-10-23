import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Leaf, Truck, ShoppingBag, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case "farmer":
          navigate("/farmer");
          break;
        case "customer":
          navigate("/customer");
          break;
        case "delivery_agent":
          navigate("/delivery");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Demo role selection page (in production, this would be proper authentication)
  return (
    <div className="min-h-screen bg-background blockchain-grid flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl gradient-organic flex items-center justify-center shadow-glow">
              <Leaf className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            OrganicChain
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Blockchain-Powered Direct-to-Customer Organic Produce Delivery
          </p>
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              🔒 Verified by Blockchain • 🌱 100% Organic Certified
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="group hover:shadow-glow transition-smooth cursor-pointer border-primary/20 bg-card/50 backdrop-blur"
            onClick={() => navigate("/farmer")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg gradient-organic flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Farmer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage farms, products & blockchain verification
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-tech transition-smooth cursor-pointer border-secondary/20 bg-card/50 backdrop-blur"
            onClick={() => navigate("/customer")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg gradient-tech flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Customer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse products, order & track deliveries
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-tech transition-smooth cursor-pointer border-accent/20 bg-card/50 backdrop-blur"
            onClick={() => navigate("/delivery")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                <Truck className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Delivery Agent</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan checkpoints & update blockchain
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-elevated transition-smooth cursor-pointer border-warning/20 bg-card/50 backdrop-blur"
            onClick={() => navigate("/admin")}
          >
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-warning flex items-center justify-center">
                <Shield className="w-6 h-6 text-background" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Admin</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor system & blockchain integrity
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Click any role to access the dashboard • Full blockchain traceability • QR code verified
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;