import { Product } from './domain';

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: any;
  discountPercent?: number;
  discountAmount?: number;
  appliedRuleId?: string;
  originalItemTotal?: number;
}

export interface Cart {
  items: CartItem[];
  totalItemCount?: number;
  itemCount?: number;
  total: number;
  totalDiscount?: number;
  finalTotal?: number;
  estimatedDeliveryFee?: number;
  platformFee?: number;
  freeDeliveryThreshold?: number;
  debug_config?: any;
  backendTotal?: number;
}
