import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Copy, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ProductCardProps {
  product: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}

export function ProductCard({
  product,
  isSelected,
  onToggleSelect,
  onToggleStatus,
  onDelete,
  onEdit,
  onDuplicate,
}: ProductCardProps) {
  const getPrice = () => {
    if (product.prices && typeof product.prices === 'object') {
      const prices = Object.values(product.prices);
      return prices[0] || product.price || 0;
    }
    return product.price || 0;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="absolute left-2 top-2 z-10 h-5 w-5"
        />
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="h-48 w-full object-cover"
        />
        <Badge
          className="absolute right-2 top-2"
          variant={product.in_stock ? "default" : "secondary"}
        >
          {product.in_stock ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground">
            {(product.category || 'uncategorized')} • {product.thca_percentage || 0}%
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">${getPrice()}</span>
          <Badge variant="outline">
            Stock: {product.in_stock ? "Available" : "Out"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" size="sm" className="flex-1">
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleStatus}>
                {product.in_stock ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Set Inactive
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Set Active
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
