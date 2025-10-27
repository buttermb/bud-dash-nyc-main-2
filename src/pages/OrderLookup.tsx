import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrderLookup = () => {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    const searchTerm = orderId.trim();

    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Please enter an order ID or tracking code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("Looking up order:", searchTerm);

      // Try searching by tracking_code first (most common)
      let { data, error } = await supabase
        .from("orders")
        .select("id, user_id, tracking_code")
        .eq("tracking_code", searchTerm)
        .maybeSingle();

      // If not found by tracking code, try by ID
      if (!data && !error) {
        console.log("Not found by tracking code, trying by ID");
        const { data: idData, error: idError } = await supabase
          .from("orders")
          .select("id, user_id, tracking_code")
          .eq("id", searchTerm)
          .maybeSingle();

        data = idData;
        error = idError;
      }

      if (error) {
        console.error("Database error:", error);
        throw new Error(error?.message || "Database error occurred");
      }

      if (data) {
        console.log("Order found:", data.id);
        navigate(`/track/${data.tracking_code || data.id}`);
      } else {
        console.log("No order found for:", searchTerm);
        toast({
          title: "Order Not Found",
          description: `No order found with ID or tracking code: ${searchTerm}. Please check and try again.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to lookup order";
      console.error("Error looking up order:", {
        message: errorMsg,
        error: error,
        searchTerm: searchTerm
      });

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-lg text-muted-foreground">
              Enter your order ID to view the status and details of your delivery
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleLookup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <div className="relative">
                  <Input
                    id="orderId"
                    placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your order ID can be found in your confirmation email or on the order confirmation page
                </p>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Looking up..." : "Track Order"}
              </Button>
            </form>
          </Card>

          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-semibold text-center">Need Help?</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Can't find your order ID?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check your email confirmation or log in to view your order history.
                </p>
                <Button variant="outline" onClick={() => navigate("/my-orders")} className="w-full">
                  View My Orders
                </Button>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-2">Having issues?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our support team is here to help with any questions or concerns.
                </p>
                <Button variant="outline" onClick={() => navigate("/support")} className="w-full">
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderLookup;
