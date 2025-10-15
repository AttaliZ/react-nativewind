import React from 'react';
import { View, FlatList, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, RefreshCw } from 'lucide-react-native';
import { useProductStore } from '../store/productStore';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';

export default function HomeScreen() {
  const router = useRouter();
  const {
    loading,
    error,
    searchQuery,
    showLowStockOnly,
    setSearchQuery,
    toggleLowStockFilter,
    getFilteredProducts,
    fetchProducts,
  } = useProductStore();
  
  const filteredProducts = getFilteredProducts();
  
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchProducts();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Inventory Manager"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleManualRefresh}
              style={styles.refreshButton}
              accessibilityLabel="รีเฟรชข้อมูล"
              activeOpacity={0.7}
            >
              <RefreshCw size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/product/add')}
              style={styles.addButton}
              accessibilityLabel="เพิ่มสินค้าใหม่"
              activeOpacity={0.7}
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.filterContainer}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="ค้นหาชื่อสินค้า, รายละเอียด, หรือ SKU"
          debounceMs={300}
        />
        
        {/* Low Stock Toggle */}
        <TouchableOpacity
          onPress={toggleLowStockFilter}
          style={[styles.toggleButton, showLowStockOnly && styles.toggleButtonActive]}
          accessibilityLabel="แสดงเฉพาะสินค้าสต็อกต่ำ"
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, showLowStockOnly && styles.toggleTextActive]}>
            แสดงเฉพาะสินค้าสต็อกต่ำ (น้อยกว่า 5 ชิ้น)
          </Text>
          <View style={[styles.toggleSwitch, showLowStockOnly && styles.toggleSwitchActive]}>
            <View style={[styles.toggleThumb, showLowStockOnly && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>กำลังโหลดสินค้า...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ เกิดข้อผิดพลาด</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => useProductStore.getState().fetchProducts()}
            style={styles.retryButton}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={searchQuery || showLowStockOnly ? 'ไม่พบสินค้า' : 'ยังไม่มีสินค้า'}
          description={
            searchQuery
              ? 'ลองค้นหาด้วยคำอื่น'
              : showLowStockOnly
              ? 'ไม่มีสินค้าที่สต็อกต่ำในขณะนี้'
              : 'เริ่มต้นด้วยการเพิ่มสินค้าใหม่'
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: '#6B7280',
    padding: 8,
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: '#0284C7',
    padding: 8,
    borderRadius: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleButtonActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  toggleTextActive: {
    color: '#B91C1C',
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#DC2626',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    marginLeft: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});