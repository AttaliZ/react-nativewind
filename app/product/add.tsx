import React from 'react';
import { Alert, StyleSheet, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProductStore } from '../../store/productStore';
import { Header } from '../../components/Header';
import { ProductForm } from '../../components/ProductForm';
import { ProductFormData } from '../../types';

// Toast helper สำหรับ cross-platform
const showToast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('สำเร็จ', message);
  }
};

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct, loading } = useProductStore();
  
  const handleSubmit = async (data: ProductFormData) => {
    try {
      await addProduct(data);
      
      // แสดง Toast notification
      showToast('เพิ่มสินค้าใหม่เรียบร้อยแล้ว');
      
      // เด้งกลับไปหน้า Home
      router.replace('/');
    } catch (error: any) {
      Alert.alert(
        'เกิดข้อผิดพลาด', 
        error.message || 'ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่'
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="เพิ่มสินค้าใหม่"
        showBack
      />
      
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="เพิ่มสินค้า"
        isLoading={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});