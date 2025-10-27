import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  variant?: "default" | "icon" | "outline";
  showLabel?: boolean;
}

export function WishlistButton({ 
  productId, 
  className,
  variant = "default",
  showLabel = true 
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, isToggling, count } = useWishlist();
  const [isAnimating, setIsAnimating] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleClick = () => {
    if (!user) {
      toast.error("Please sign in to save items to your wishlist");
      return;
    }

    setIsAnimating(true);
    toggleWishlist({ productId });
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isToggling}
      variant={variant === "default" ? "ghost" : variant}
      size={variant === "icon" ? "icon" : "sm"}
      className={cn(
        "transition-all duration-300",
        inWishlist && "text-red-500 hover:text-red-600",
        isAnimating && "scale-110",
        className
      )}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={cn(
          "transition-all duration-300",
          inWishlist ? "fill-current" : "fill-none"
        )}
        size={variant === "icon" ? 20 : 16}
      />
      {showLabel && (
        <span className="ml-2">
          {inWishlist ? "Saved" : "Save"}
        </span>
      )}
    </Button>
  );
}

