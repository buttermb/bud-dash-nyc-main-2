import { Suspense, lazy } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useWishlist } from "@/hooks/useWishlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";

const WishlistPageContent = () => {
  const { wishlist, isLoading, removeFromWishlist, count } = useWishlist();

  const handleRemove = (wishlistId: string) => {
    removeFromWishlist(wishlistId);
  };

  const handleClearAll = async () => {
    if (wishlist.length === 0) return;
    
    if (confirm("Remove all items from your wishlist?")) {
      for (const item of wishlist) {
        await removeFromWishlist(item.id);
      }
      toast.success("Wishlist cleared");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="My Wishlist | New York Minute NYC"
        description="Your saved items for later purchase."
      />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">
              {count} {count === 1 ? "item" : "items"} saved
            </p>
          </div>
          
          {count > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Wishlist Items */}
        {count === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start saving items you love!
              </p>
              <Link to="/">
                <Button>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="relative group">
                {item.product && (
                  <>
                    <ProductCard product={item.product} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const Wishlist = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>}>
        <WishlistPageContent />
      </Suspense>
    </ProtectedRoute>
  );
};

export default Wishlist;
