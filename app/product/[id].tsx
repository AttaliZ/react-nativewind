import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Trash2, Edit, Package } from 'lucide-react-native';
import { useProductStore } from '../../store/productStore';
import { Header } from '../../components/Header';
import { ProductForm } from '../../components/ProductForm';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { Badge } from '../../components/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ProductFormData } from '../../types';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, updateProduct, deleteProduct, loading } = useProductStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const product = getProduct(id!);
  
  if (!product) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="ไม่พบสินค้า" showBack />
        <View style={styles.notFoundContainer}>
          <Package size={64} color="#D1D5DB" />
          <Text style={styles.notFoundTitle}>
            ไม่พบสินค้า
          </Text>
          <Text style={styles.notFoundDescription}>
            สินค้าที่คุณค้นหาอาจถูกลบไปแล้ว
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const handleUpdate = async (data: ProductFormData) => {
    try {
      await updateProduct(id!, data);
      
      Alert.alert(
        'สำเร็จ',
        'แก้ไขสินค้าเรียบร้อยแล้ว',
        [
          {
            text: 'ตกลง',
            onPress: () => {
              setIsEditing(false);
              router.back(); // เด้งกลับไปหน้าเดิม (เช่น รายการสินค้า) หลังแก้ไข
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'เกิดข้อผิดพลาด', 
        error.message || 'ไม่สามารถบันทึกการแก้ไขได้'
      );
    }
  };
  
  const handleDelete = async () => {
    try {
      await deleteProduct(id!);
      
      Alert.alert(
        'สำเร็จ',
        'ลบสินค้าเรียบร้อยแล้ว',
        [
          {
            text: 'ตกลง',
            onPress: () => router.back(), // เด้งกลับไปหน้าเดิม (เช่น รายการสินค้า) หลังลบ
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'เกิดข้อผิดพลาด', 
        error.message || 'ไม่สามารถลบสินค้าได้'
      );
    }
  };
  
  const isLowStock = product.stock < 5;
  
  // แสดงฟอร์มแก้ไข
  if (isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="แก้ไขสินค้า" showBack />
        
        <ProductForm
          initialData={product}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          submitLabel="บันทึกการแก้ไข"
          isLoading={loading}
          isEdit={true}
        />
      </SafeAreaView>
    );
  }
  
  // แสดงรายละเอียดสินค้า
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="รายละเอียดสินค้า"
        showBack
        rightAction={
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
              accessibilityLabel="แก้ไขสินค้า"
              activeOpacity={0.7}
            >
              <Edit size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              style={styles.deleteButton}
              accessibilityLabel="ลบสินค้า"
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Product Image */}
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Package size={80} color="#D1D5DB" />
          </View>
        )}
        
        {/* Product Info */}
        <View style={styles.content}>
          {/* Name & Badge */}
          <View style={styles.section}>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>
                {product.name}
              </Text>
              {isLowStock && (
                <View style={styles.badgeContainer}>
                  <Badge label="สต็อกต่ำ" variant="danger" />
                </View>
              )}
            </View>
            
            {product.sku && (
              <Text style={styles.sku}>
                SKU: {product.sku}
              </Text>
            )}
          </View>
          
          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                รายละเอียด
              </Text>
              <Text style={styles.description}>
                {product.description}
              </Text>
            </View>
          )}
          
          {/* Price & Stock */}
          <View style={styles.statsContainer}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>
                ราคา
              </Text>
              <Text style={styles.priceValue}>
                {formatCurrency(product.price)}
              </Text>
            </View>
            
            <View style={[styles.stockCard, isLowStock && styles.stockCardLow]}>
              <Text style={[styles.stockLabel, isLowStock && styles.stockLabelLow]}>
                สต็อก
              </Text>
              <Text style={[styles.stockValue, isLowStock && styles.stockValueLow]}>
                {product.stock} ชิ้น
              </Text>
            </View>
          </View>
          
          {/* Timestamps */}
          <View style={styles.timestampCard}>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>สร้างเมื่อ</Text>
              <Text style={styles.timestampValue}>
                {formatDate(product.createdAt)}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>แก้ไขล่าสุด</Text>
              <Text style={styles.timestampValue}>
                {formatDate(product.updatedAt)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <ConfirmDelete
        visible={showDeleteModal}
        productName={product.name}
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#0284C7',
    padding: 8,
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  badgeContainer: {
    marginLeft: 12,
  },
  sku: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C4A6E',
  },
  stockCard: {
    flex: 1,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
  },
  stockCardLow: {
    backgroundColor: '#FEE2E2',
  },
  stockLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  stockLabelLow: {
    color: '#B91C1C',
  },
  stockValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#064E3B',
  },
  stockValueLow: {
    color: '#7F1D1D',
  },
  timestampCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timestampLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timestampValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  notFoundDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});