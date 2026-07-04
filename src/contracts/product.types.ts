export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: number;
  currencyCode: string;
  image: string;
  images: string[];
  category: string;
  tags: string[];
  availableForSale: boolean;
  quantityAvailable: number;
  variantId: string;
  variants?: ProductVariant[];
  options?: ProductOption[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  availableForSale: boolean;
  quantityAvailable: number;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductDetail {
  description: string;
  specs: { label: string; value: string }[];
  colors: string[];
  bundles: ProductBundle[];
  imageCount: number;
}

export interface ProductBundle {
  name: string;
  price: number;
  includes: string[];
}
