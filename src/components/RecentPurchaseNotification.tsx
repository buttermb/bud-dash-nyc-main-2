import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const RecentPurchaseNotification = () => {
  const [visiblePurchase, setVisiblePurchase] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Fetch recent purchases
  const { data: recentPurchases = [] } = useQuery({
    queryKey: ["recent-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recent_purchases")
        .select(`
          *,
          products (name, image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("recent_purchases_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "recent_purchases",
        },
        (payload) => {
          // Show notification for new purchase
          setVisiblePurchase(payload.new);
          setShowNotification(true);
          
          setTimeout(() => {
            setShowNotification(false);
          }, 5000); // Hide after 5 seconds
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Randomly show a purchase from recent history every 10-20 seconds
  useEffect(() => {
    if (recentPurchases.length === 0) return;

    const showRandomPurchase = () => {
      const randomIndex = Math.floor(Math.random() * Math.min(recentPurchases.length, 5));
      const purchase = recentPurchases[randomIndex];
      
      if (purchase) {
        setVisiblePurchase(purchase);
        setShowNotification(true);
        
        setTimeout(() => {
          setShowNotification(false);
        }, 4000);
      }
    };

    // Show first notification after 5 seconds
    const initialTimeout = setTimeout(showRandomPurchase, 5000);
    
    // Then show randomly every 15-25 seconds
    const interval = setInterval(() => {
      const randomDelay = 15000 + Math.random() * 10000;
      setTimeout(showRandomPurchase, randomDelay);
    }, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [recentPurchases]);

  if (!visiblePurchase) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-6 left-6 z-50 max-w-sm"
        >
          <div className="relative bg-card border border-primary/20 shadow-xl rounded-lg p-4 backdrop-blur-sm">
            {/* Close Button - Positioned outside the card flow */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-border shadow-lg hover:bg-destructive hover:text-destructive-foreground hover:border-destructive z-10"
              onClick={() => setShowNotification(false)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-3">
              {/* Product Image or Icon */}
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {visiblePurchase.products?.image_url ? (
                  <img
                    src={visiblePurchase.products.image_url}
                    alt={visiblePurchase.products.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-semibold truncate">
                    {visiblePurchase.customer_name}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  just purchased{" "}
                  <span className="font-medium text-foreground">
                    {visiblePurchase.products?.name || "a product"}
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="capitalize">{visiblePurchase.location}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecentPurchaseNotification;
