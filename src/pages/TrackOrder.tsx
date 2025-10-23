import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function TrackOrder() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trackingCode, setTrackingCode] = useState(code || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code) {
      fetchOrder(code);
      const interval = setInterval(() => fetchOrder(code), 15000);
      return () => clearInterval(interval);
    }
  }, [code]);

  const fetchOrder = async (orderCode: string) => {
    setLoading(true);
    try {
      // Use secure tracking function instead of direct query
      const { data, error } = await supabase
        .rpc('get_order_by_tracking_code', { code: orderCode.toUpperCase() });

      if (error) throw error;
      
      if (!data) {
        throw new Error('Order not found');
      }
      
      // Parse the jsonb result (type cast for safety)
      const orderData = data as any;
      
      // Transform to match expected format
      const transformedData = {
        ...orderData,
        merchants: orderData.merchant,
        couriers: orderData.courier,
        order_items: orderData.order_items || []
      };
      
      setOrder(transformedData);
    } catch (error) {
      toast({
        title: "Order not found",
        description: "Please check your tracking code and try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Enter tracking code",
        description: "Please enter your tracking code",
        variant: "destructive"
      });
      return;
    }
    navigate(`/track/${trackingCode.toUpperCase()}`);
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    return steps.indexOf(status);
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
              <p className="text-muted-foreground">Enter your tracking code to see order status</p>
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="ABC-DEF-GH12"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono"
                maxLength={13}
              />
              <Button 
                onClick={handleTrack} 
                className="w-full h-12 text-lg"
                disabled={!trackingCode.trim()}
              >
                Track Order
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center mt-6">
              Your tracking code was sent to you via SMS or email
            </p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStep = getStatusStep(order.status);
  const steps = [
    { label: 'Placed', status: 'pending' },
    { label: 'Confirmed', status: 'confirmed' },
    { label: 'Preparing', status: 'preparing' },
    { label: 'Out for Delivery', status: 'out_for_delivery' },
    { label: 'Delivered', status: 'delivered' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <div className="flex-1 pb-20">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Order Tracking</h1>
            <p className="text-lg font-mono">{order.tracking_code}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Progress Bar */}
          <Card className="p-6">
            <div className="relative">
              {/* Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>
              
              {/* Steps */}
              <div className="relative flex justify-between">
                {steps.map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      transition-all duration-300 z-10
                      ${index <= currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {index <= currentStep ? '✓' : index + 1}
                    </div>
                    <p className={`
                      text-xs mt-2 text-center max-w-[80px]
                      ${index <= currentStep ? 'text-foreground font-semibold' : 'text-muted-foreground'}
                    `}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Current Status */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Current Status</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {order.status === 'pending' && '📝'}
                  {order.status === 'confirmed' && '✅'}
                  {order.status === 'preparing' && '👨‍🍳'}
                  {order.status === 'out_for_delivery' && '🚗'}
                  {order.status === 'delivered' && '🎉'}
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {(order.status || 'pending').replace('_', ' ')}
                  </p>
                  {order.estimated_delivery && (
                    <p className="text-sm text-muted-foreground">
                      ETA: {new Date(order.estimated_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Restaurant Info */}
          {order.merchants && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">📦 Pickup From</h3>
              <p className="font-bold">{order.merchants.business_name}</p>
              <p className="text-sm text-muted-foreground">{order.merchants.address}</p>
            </Card>
          )}

          {/* Delivery Address */}
          {order.addresses && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">📍 Delivery To</h3>
              <p className="font-bold">{order.addresses.street}</p>
              <p className="text-sm text-muted-foreground">
                {order.addresses.city}, {order.addresses.state} {order.addresses.zip_code}
              </p>
            </Card>
          )}

          {/* Courier Info */}
          {order.couriers && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">🚗 Your Courier</h3>
              <p className="font-bold">{order.couriers.full_name}</p>
              <p className="text-sm text-muted-foreground">{order.couriers.vehicle_type}</p>
              {order.couriers.phone && (
                <Button variant="outline" className="mt-3" asChild>
                  <a href={`tel:${order.couriers.phone}`}>📞 Call Courier</a>
                </Button>
              )}
            </Card>
          )}

          {/* Order Items */}
          {order.order_items && order.order_items.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">📋 Your Items</h3>
              <div className="space-y-3">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.products?.name || item.product_name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${item.price}</p>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${order.total_amount}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Auto-refresh notice */}
          <p className="text-center text-sm text-muted-foreground">
            This page refreshes automatically every 15 seconds
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
