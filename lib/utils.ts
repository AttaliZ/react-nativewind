import { ProductFormData } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export interface ValidationError {
  field: string;
  message: string;
}

export const validateProductForm = (data: Partial<ProductFormData>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'ชื่อสินค้าห้ามว่าง' });
  }
  
  if (data.name && data.name.length > 100) {
    errors.push({ field: 'name', message: 'ชื่อสินค้ายาวเกิน 100 ตัวอักษร' });
  }
  
  if (data.price !== undefined && data.price < 0) {
    errors.push({ field: 'price', message: 'ราคาต้องมากกว่าหรือเท่ากับ 0' });
  }
  
  if (data.stock !== undefined && data.stock < 0) {
    errors.push({ field: 'stock', message: 'จำนวนสต็อกต้องมากกว่าหรือเท่ากับ 0' });
  }
  
  if (data.stock !== undefined && !Number.isInteger(data.stock)) {
    errors.push({ field: 'stock', message: 'จำนวนสต็อกต้องเป็นจำนวนเต็ม' });
  }
  
  return errors;
};