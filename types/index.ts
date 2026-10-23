export interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  active: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'customer' | 'restaurant_owner' | 'admin';
}

export interface RestaurantCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  city_id: string;
  category_id?: string;
  name: string;
  slug: string;
  cnpj: string;
  phone: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  delivery_fee_cents: number;
  delivery_time_min: number;
  delivery_time_max: number;
  min_order_cents: number;
  commission_rate_percent: number;
  is_open: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  active: boolean;
}

export interface ProductOptionItem {
  id: string;
  group_id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
}

export interface ProductOptionGroup {
  id: string;
  product_id: string;
  title: string;
  min_options: number;
  max_options: number;
  required: boolean;
  items?: ProductOptionItem[];
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price_cents: number;
  image_url?: string;
  is_available: boolean;
  option_groups?: ProductOptionGroup[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: {
    groupTitle: string;
    item: ProductOptionItem;
  }[];
  totalItemPriceCents: number;
  notes?: string;
}
