import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Phone, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LiveChatWidget } from "@/components/LiveChatWidget";

const Support = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    message: "",
  });
  const [showChat, setShowChat] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to a support system
    toast.success("Message sent! We'll respond within 24 hours.");
    setFormData({ name: "", email: "", orderNumber: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Navigation />
      
      <main className="flex-1 py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Customer Support
            </h1>
            <p className="text-xl text-muted-foreground">
              We're here to help with your delivery experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">
                      Order Number (optional)
                    </Label>
                    <Input
                      id="orderNumber"
                      placeholder="ORD-20250130-XXXX"
                      value={formData.orderNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, orderNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" variant="hero">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Get instant help from our support team
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowChat(true)}
                  >
                    Start Live Chat
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    support@newyorkminutenyc.com
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Response time: Within 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    (555) 123-4567
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Available 8 AM - 10 PM EST daily
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday:</span>
                      <span>8:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday - Sunday:</span>
                      <span>8:00 AM - 10:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Common Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Quick Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Order Tracking Issues</h3>
                  <p className="text-sm text-muted-foreground">
                    If you can't track your order, make sure you're logged in with the
                    same account used for purchase. Check your email for the order
                    confirmation with tracking link.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Delays</h3>
                  <p className="text-sm text-muted-foreground">
                    During peak hours (5-9 PM), deliveries may take longer. Check your
                    order status for real-time updates. Contact support if delayed more
                    than 90 minutes.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Product Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    View detailed product information including lab results, strain
                    lineage, and consumption recommendations on each product page.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Issues</h3>
                  <p className="text-sm text-muted-foreground">
                    Forgot password? Use the "Forgot Password" link on the login page.
                    For other account issues, contact support with your registered email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      {showChat && <LiveChatWidget onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default Support;
