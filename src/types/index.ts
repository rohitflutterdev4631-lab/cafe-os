export type UserRoleType =
  | 'SUPER_ADMIN'
  | 'ADMIN_STAFF'
  | 'CAFE_OWNER'
  | 'CAFE_MANAGER'
  | 'KITCHEN_STAFF'
  | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentMethod = 'COUNTER' | 'CASH' | 'RAZORPAY' | 'UPI';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type FoodType = 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';

export interface CartItemAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart line item id
  menuItemId: string;
  name: string;
  image?: string | null;
  foodType: FoodType;
  basePrice: number;
  variant?: {
    id: string;
    name: string;
    price: number;
  } | null;
  addons: CartItemAddon[];
  quantity: number;
  specialInstructions?: string;
  itemTotalPrice: number;
}

export interface MenuItemWithDetails {
  id: string;
  cafeId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  image?: string | null;
  foodType: FoodType;
  isAvailable: boolean;
  preparationMinutes: number;
  isFeatured: boolean;
  isBestseller: boolean;
  sortOrder: number;
  variants: {
    id: string;
    name: string;
    price: number;
    isDefault: boolean;
  }[];
  menuItemAddonGroups: {
    addonGroup: {
      id: string;
      name: string;
      minSelect: number;
      maxSelect: number;
      required: boolean;
      options: {
        id: string;
        name: string;
        price: number;
        isAvailable: boolean;
      }[];
    };
  }[];
}

export interface CategoryWithItems {
  id: string;
  cafeId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  menuItems: MenuItemWithDetails[];
}

export interface CafePublicData {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  themeColor: string;
  secondaryColor: string;
  fontFamily: string;
  enableDarkMode: boolean;
  cardLayout: string;
  settings: {
    currency: string;
    currencySymbol: string;
    orderingEnabled: boolean;
    dineInEnabled: boolean;
    takeawayEnabled: boolean;
    deliveryEnabled: boolean;
    taxRatePercent: number;
    packagingFee: number;
    minOrderValue: number;
  } | null;
  branches: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
  }[];
  socialLinks: {
    platform: string;
    url: string;
  }[];
}
