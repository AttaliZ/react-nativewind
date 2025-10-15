import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Badge } from './Badge';
import { Package } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const router = useRouter();
  const isLowStock = product.stock < 5;
  
  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${product.id}`)}
      style={styles.card}
      activeOpacity={0.7}
      accessibilityLabel={`${product.name}, ราคา ${formatCurrency(product.price)}, สต็อก ${product.stock} ชิ้น`}
    >
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Package size={48} color="#D1D5DB" />
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {isLowStock && (
            <View style={styles.badgeContainer}>
              <Badge label="Low" variant="danger" />
            </View>
          )}
        </View>
        
        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.price}>
            {formatCurrency(product.price)}
          </Text>
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>สต็อก: </Text>
            <Text style={[styles.stockValue, isLowStock && styles.stockLow]}>
              {product.stock} ชิ้น
            </Text>
          </View>
        </View>
        
        {product.sku && (
          <Text style={styles.sku}>
            SKU: {product.sku}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 192,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: '100%',
    height: 192,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284C7',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  stockLow: {
    color: '#DC2626',
  },
  sku: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
});