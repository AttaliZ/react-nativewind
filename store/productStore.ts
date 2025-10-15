import { create } from 'zustand';
import { Product, ProductFormData } from '../types';
import { apiClient } from '../lib/api';

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  showLowStockOnly: boolean;
  
  // Actions
  fetchProducts: () => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addProduct: (data: ProductFormData) => Promise<void>;
  updateProduct: (id: string, data: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleLowStockFilter: () => void;
  getFilteredProducts: () => Product[];
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  searchQuery: '',
  showLowStockOnly: false,

  // ดึงรายการสินค้าทั้งหมดจาก API
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      console.log('🔄 Fetching products from API...');
      const products = await apiClient.listProducts();
      console.log('✅ Products loaded:', products.length, 'items');
      console.log('📦 First product:', products[0]);
      set({ products, loading: false });
    } catch (error: any) {
      console.error('❌ Fetch products error:', error);
      
      // Fallback to mock data ถ้า API ล้มเหลว
      console.log('⚠️ Using mock data as fallback');
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'MacBook Pro 16"',
          description: 'Apple M3 Max chip',
          price: 89900,
          stock: 3,
          sku: 'MBP-M3-16',
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      set({ 
        products: mockProducts,
        error: `API Error: ${error.message}. Using mock data.`, 
        loading: false 
      });
    }
  },

  // ดึงสินค้าเดียวจาก state (ไม่เรียก API)
  getProduct: (id: string) => {
    return get().products.find(p => p.id === id);
  },

  // เพิ่มสินค้าใหม่
  addProduct: async (data: ProductFormData) => {
    set({ loading: true, error: null });
    try {
      const newProduct = await apiClient.createProduct(data);
      
      set(state => ({
        products: [newProduct, ...state.products],
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to add product', 
        loading: false 
      });
      throw error;
    }
  },

  // อัปเดตสินค้า
  updateProduct: async (id: string, data: Partial<ProductFormData>) => {
    set({ loading: true, error: null });
    try {
      const updatedProduct = await apiClient.updateProduct(id, data);
      
      set(state => ({
        products: state.products.map(p =>
          p.id === id ? updatedProduct : p
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to update product', 
        loading: false 
      });
      throw error;
    }
  },

  // ลบสินค้า
  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      console.log('🗑️ Deleting product:', id);
      await apiClient.deleteProduct(id);
      
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        loading: false,
      }));
      console.log('✅ Product deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      set({ 
        error: error.message || 'Failed to delete product', 
        loading: false 
      });
      throw error;
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  toggleLowStockFilter: () => {
    set(state => ({ showLowStockOnly: !state.showLowStockOnly }));
  },

  getFilteredProducts: () => {
    const { products, searchQuery, showLowStockOnly } = get();
    
    let filtered = products;
    
    // กรองตาม search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }
    
    // กรองตาม low stock
    if (showLowStockOnly) {
      filtered = filtered.filter(p => p.stock < 5);
    }
    
    return filtered;
  },
}));