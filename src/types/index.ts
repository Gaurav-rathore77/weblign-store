export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  imageUrl: string;
  images: string[];
  specifications: { label: string; value: string }[];
  sizes: string[];
  colors: string[];
  category: string;
  categoryId?: string | null;
  stock: number;
  brand?: string | null;
  salesCount?: number;
  rating: number;
  reviewCount: number;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string | null;
  icon?: string | null;
};

export type CartItem = {
  productId: string;
  product: Product;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus?: string;
  paymentId?: string;
  addressId?: string | null;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  couponCode?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  cancelledAt?: string | null;
  returnRequestedAt?: string | null;
  returnedAt?: string | null;
  refundStatus?: string;
  refundAmount?: number;
  createdAt: string;
};

export type Address = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  addressType?: 'home' | 'work';
};

export type Profile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
};

export type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  link: string | null;
  sortOrder: number;
};

export type ProductReview = {
  id: string;
  productId: string;
  userId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  userName?: string | null;
};

export type DeliveryZone = {
  pinCode: string;
  city: string | null;
  state: string | null;
  estimatedDays: number;
  serviceable: boolean;
};

export type Coupon = {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  active: boolean;
  expiresAt: string | null;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: string;
  createdAt: string;
};
