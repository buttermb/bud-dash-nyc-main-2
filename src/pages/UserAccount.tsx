import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, TrendingUp, CheckCircle, AlertTriangle, FileText, Gift } from "lucide-react";
import PurchaseGiveawayEntries from "@/components/account/PurchaseGiveawayEntries";
import LoyaltyPoints from "@/components/LoyaltyPoints";
import IDVerificationUpload from "@/components/IDVerificationUpload";

export default function UserAccount() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setProfile(profileData);
      setOrders(ordersData || []);
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case "vip": return "bg-green-500";
      case "regular": return "bg-blue-500";
      case "new": return "bg-yellow-500";
      default: return "bg-red-500";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!profile) {
    return <div className="container mx-auto p-6">Profile not found</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      {/* Account Status Alert */}
      {profile.account_status !== "active" && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your account status is: {profile.account_status.toUpperCase()}
            {profile.account_status === "suspended" && " - Please contact support."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trust Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Your Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold">
                      <span className={getRiskScoreColor(profile.risk_score || 50)}>
                        {profile.risk_score || 50}
                      </span>
                      <span className="text-lg text-muted-foreground">/100</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Trust Level: <Badge className={getTrustLevelColor(profile.trust_level)}>
                        {profile.trust_level?.toUpperCase() || "NEW"}
                      </Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Account Status</p>
                    <Badge variant={profile.account_status === "active" ? "default" : "destructive"}>
                      {profile.account_status?.toUpperCase() || "ACTIVE"}
                    </Badge>
                  </div>
                </div>

                <Progress value={profile.risk_score || 50} className="h-3" />

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Build Trust By:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li className="flex items-center gap-2">
                        {profile.id_verified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="w-4 h-4 border-2 rounded-full" />
                        )}
                        Verify ID
                      </li>
                      <li className="flex items-center gap-2">
                        {profile.total_orders > 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="w-4 h-4 border-2 rounded-full" />
                        )}
                        Complete orders
                      </li>
                      <li className="flex items-center gap-2">
                        {profile.total_orders >= 5 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="w-4 h-4 border-2 rounded-full" />
                        )}
                        Reach 5+ orders
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Benefits:</p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Higher spending limits</li>
                      <li>• Priority delivery</li>
                      <li>• Exclusive deals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spending Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Spending Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">${profile.total_spent?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{profile.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                  <p className="text-2xl font-bold">${profile.average_order_value?.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Value</p>
                  <p className="text-2xl font-bold">${profile.lifetime_value?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total_amount?.toFixed(2)}</p>
                        <Badge variant={order.status === "delivered" ? "default" : "outline"}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Giveaway Entries */}
          <PurchaseGiveawayEntries />

          {/* Loyalty Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Loyalty & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoyaltyPoints />
            </CardContent>
          </Card>

          {/* ID Verification */}
          {!profile.id_verified && <IDVerificationUpload />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Spending Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Daily Limit</span>
                  <span className="font-semibold">${profile.daily_limit?.toFixed(0) || 500}</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Weekly Limit</span>
                  <span className="font-semibold">${profile.weekly_limit?.toFixed(0) || 2000}</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Orders per day: <span className="font-semibold">{profile.order_limit || 3}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs">{profile.user_id_code || "Pending"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Verified</span>
                <span>{profile.id_verified ? "✓ Yes" : "✗ No"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/my-orders")}>
                <FileText className="w-4 h-4 mr-2" />
                View All Orders
              </Button>
              {!profile.id_verified && (
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Identity
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}