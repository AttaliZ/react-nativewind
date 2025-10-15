export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;