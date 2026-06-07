// Tipos para la Shopify Admin API

export type AdminConnection<T> = {
  edges: Array<{
    node: T;
  }>;
};

export type AdminProduct = {
  id: string;
  title: string;
  handle: string;
  status: "ACTIVE" | "ARCHIVED" | "DRAFT";
  createdAt: string;
  updatedAt: string;
  descriptionHtml: string;
  tags: string[];
  images: AdminConnection<AdminImage>;
  variants: AdminConnection<AdminVariant>;
};

export type AdminImage = {
  id: string;
  url: string;
  altText: string | null;
};

export type AdminVariant = {
  id: string;
  title: string;
  price: string;
  inventoryQuantity: number;
  inventoryItem?: {
    id: string;
    inventoryLevels: AdminConnection<AdminInventoryLevel>;
  };
};

export type AdminInventoryLevel = {
  id: string;
  available: number;
  location: {
    id: string;
    name: string;
  };
};

export type AdminCollection = {
  id: string;
  title: string;
  handle: string;
  updatedAt: string;
  productsCount: {
    count: number;
  };
};

export type AdminProductsOperation = {
  data: {
    products: AdminConnection<AdminProduct>;
  };
  variables: { first: number };
};

export type AdminProductOperation = {
  data: {
    product: AdminProduct;
  };
  variables: { id: string };
};

export type AdminCollectionsOperation = {
  data: {
    collections: AdminConnection<AdminCollection>;
  };
  variables: { first: number };
};

export type AdminCollectionOperation = {
  data: {
    collection: AdminCollection;
  };
  variables: { id: string };
};
