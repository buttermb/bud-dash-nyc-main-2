import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useCallback } from "react";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  notes?: string;
  product?: any;
}

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get wishlist items
  const {
    data: wishlist = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("wishlists")
        .select("*, product:products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!user,
  });

  // Add to wishlist
  const addToWishlist = useMutation({
    mutationFn: async ({ productId, notes }: { productId: string; notes?: string }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          product_id: productId,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success("Added to wishlist");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Already in your wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    },
  });

  // Remove from wishlist
  const removeFromWishlist = useMutation({
    mutationFn: async (wishlistId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", wishlistId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some((item) => item.product_id === productId);
  }, [wishlist]);

  // Get wishlist item ID for a product
  const getWishlistItemId = useCallback((productId: string) => {
    const item = wishlist.find((item) => item.product_id === productId);
    return item?.id;
  }, [wishlist]);

  // Toggle wishlist (add if not in, remove if in)
  const toggleWishlist = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      if (!user) throw new Error("Must be logged in");
      
      const existingItem = wishlist.find((item) => item.product_id === productId);
      
      if (existingItem) {
        // Remove
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", existingItem.id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add
        const { error } = await supabase
          .from("wishlists")
          .insert({
            user_id: user.id,
            product_id: productId,
          });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast.success(data.action === 'added' ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Already in your wishlist");
      } else {
        toast.error("Failed to update wishlist");
      }
    },
  });

  return {
    wishlist,
    isLoading,
    error,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
    isInWishlist,
    getWishlistItemId,
    toggleWishlist: toggleWishlist.mutate,
    isToggling: toggleWishlist.isPending,
    count: wishlist.length,
  };
}

