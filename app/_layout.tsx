import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useProductStore } from '../store/productStore';

export default function RootLayout() {
  const fetchProducts = useProductStore(state => state.fetchProducts);
  
  useEffect(() => {
    console.log('🚀 App started, calling fetchProducts...');
    // โหลดข้อมูลจาก API
    fetchProducts().catch(error => {
      console.error('💥 fetchProducts failed in _layout:', error);
    });
  }, [fetchProducts]);
  
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F9FAFB' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="product/add" />
        <Stack.Screen name="product/[id]" />
      </Stack>
    </>
  );
}