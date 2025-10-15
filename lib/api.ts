import Constants from 'expo-constants';
import { Product, ProductFormData } from '../types';

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://119.59.102.61:8005/api';

console.log('🔧 API Base URL:', BASE_URL);

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 API Request:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ API Request Error:', error);
      throw error;
    }
  }

  // GET /products
  async listProducts(): Promise<Product[]> {
    console.log('📥 Calling listProducts()');
    const products = await this.request('/products');
    console.log('📦 Raw API response:', products);
    console.log('📦 Array length:', products?.length);
    
    if (!Array.isArray(products)) {
      console.error('❌ API response is not an array:', typeof products);
      return [];
    }
    
    // แปลงข้อมูลจาก backend format เป็น frontend format
    const mappedProducts = products.map((p: any) => {
      console.log('🔄 Mapping product:', p.id, p.name);
      return {
        id: String(p.id),
        name: p.name,
        description: p.description || '',
        price: parseFloat(p.price) || 0,
        stock: parseInt(p.stock) || 0,
        sku: p.productCode || '',
        imageUrl: p.image ? (p.image.startsWith('http') ? p.image : `${this.baseUrl.replace('/api', '')}${p.image}`) : '',
        createdAt: p.lastUpdate || new Date().toISOString(),
        updatedAt: p.lastUpdate || new Date().toISOString(),
      };
    });
    
    console.log('✅ Mapped products:', mappedProducts.length, 'items');
    return mappedProducts;
  }

  // GET /products/:id
  async getProduct(id: string): Promise<Product> {
    const p = await this.request(`/products/${id}`);
    
    return {
      id: String(p.id),
      name: p.name,
      description: p.description || '',
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      sku: p.productCode || '',
      imageUrl: p.image ? (p.image.startsWith('http') ? p.image : `${this.baseUrl.replace('/api', '')}${p.image}`) : '',
      createdAt: p.lastUpdate || new Date().toISOString(),
      updatedAt: p.lastUpdate || new Date().toISOString(),
    };
  }

  // POST /products
  async createProduct(data: ProductFormData): Promise<Product> {
    const payload = {
      name: data.name,
      description: data.description || '',
      price: data.price,
      stock: data.stock,
      productCode: data.sku || '',
      image: data.imageUrl || '',
      status: 'Active',
    };

    const result = await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // ดึงข้อมูลที่สร้างใหม่
    return this.getProduct(String(result.productId));
  }

  // PUT /products/:id
  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const payload: any = {};
    
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.stock !== undefined) payload.stock = data.stock;
    if (data.sku !== undefined) payload.productCode = data.sku;
    if (data.imageUrl !== undefined) payload.image = data.imageUrl;
    payload.status = 'Active';

    await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // ดึงข้อมูลที่อัปเดต
    return this.getProduct(id);
  }

  // DELETE /products/:id
  async deleteProduct(id: string): Promise<void> {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // POST /upload (สำหรับอัปโหลดรูปภาพ)
  async uploadImage(uri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      // ตรวจสอบว่าเป็น Web หรือ Mobile
      if (uri.startsWith('blob:') || uri.startsWith('data:')) {
        // สำหรับ Web - แปลง blob/data URL เป็น File
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else {
        // สำหรับ Mobile - ใช้ URI ตรงๆ
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success:', result);
      
      // คืน URL จาก backend (เช่น /uploads/images/xxx.jpg)
      return result.file.url;
    } catch (error) {
      console.error('Upload Error:', error);
      throw new Error('Failed to upload image');
    }
  }
}

export const apiClient = new ApiClient(BASE_URL);