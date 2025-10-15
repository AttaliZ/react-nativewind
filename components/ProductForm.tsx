import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { ProductFormData } from '../types';
import { validateProductForm, ValidationError } from '../lib/utils';
import { apiClient } from '../lib/api';
import { Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ปรับ type นี้ให้ตรงกับ navigation stack ของคุณ (เช่น ชื่อ screen 'Home' หรือ 'ProductList')
type RootStackParamList = {
  Home: undefined; // หรือชื่อหน้าแรกจริงของคุณ เช่น ProductList, Dashboard ฯลฯ
  // เพิ่ม screens อื่น ๆ ที่ใช้ใน app เช่น AddProduct, EditProduct
};

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>; // ต้องเป็น async function ที่ return Promise
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  isEdit?: boolean; // ถ้า true = edit mode
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'บันทึก',
  isLoading = false,
  isEdit = !!initialData?.name,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    sku: initialData?.sku || '',
    imageUrl: initialData?.imageUrl || '',
  });
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  
  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => e.field !== field));
  };
  
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets[0]) {
          setUploading(true);
          try {
            const uri = result.assets[0].uri;
            const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'http://119.59.102.61:9001/api';
            
            const response = await fetch(uri);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
            
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            
            const uploadResponse = await fetch(`${apiBaseUrl}/upload`, {
              method: 'POST',
              body: formDataUpload,
            });
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }
            
            const uploadResult = await uploadResponse.json();
            console.log('Upload result:', uploadResult);
            const imageUrl = uploadResult.file.url;
            updateField('imageUrl', imageUrl);
            Alert.alert('สำเร็จ', 'อัปโหลดรูปภาพเรียบร้อยแล้ว');
          } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถอัปโหลดรูปภาพได้: ${error.message}`);
          } finally {
            setUploading(false);
          }
        }
      } catch (error: any) {
        Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถเลือกรูปภาพได้: ${error.message}`);
      }
      return;
    }
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('ขออนุญาต', 'กรุณาอนุญาตให้เข้าถึงคลังรูปภาพ');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const uploadedUrl = await apiClient.uploadImage(result.assets[0].uri);
        console.log('Mobile upload result:', uploadedUrl);
        updateField('imageUrl', uploadedUrl);
        Alert.alert('สำเร็จ', 'อัปโหลดรูปภาพเรียบร้อยแล้ว');
      } catch (error: any) {
        console.error('Mobile upload error:', error);
        Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถอัปโหลดรูปภาพได้: ${error.message}`);
      } finally {
        setUploading(false);
      }
    }
  };
  
  const handleSubmit = async () => {
    console.log('Form submission started with data:', formData);
    
    const validationErrors = validateProductForm(formData);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      setErrors(validationErrors);
      Alert.alert('ข้อมูลไม่ถูกต้อง', validationErrors[0].message);
      return;
    }
    
    if (!formData.name || formData.price === undefined || formData.stock === undefined) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อสินค้า ราคา และจำนวนสต็อก');
      return;
    }
    
    setInternalLoading(true);
    try {
      console.log('Calling onSubmit with:', formData);
      await onSubmit(formData as ProductFormData);
      
      const successMessage = isEdit ? 'แก้ไขสินค้าเรียบร้อยแล้ว' : 'เพิ่มสินค้าเรียบร้อยแล้ว';
      Alert.alert('สำเร็จ', successMessage, [
        {
          text: 'ตกลง',
          onPress: () => {
            if (isEdit) {
              navigation.navigate('Home'); // เด้งไปหน้าแรก (ปรับชื่อ 'Home' ถ้าต่างกัน)
            } else {
              // สำหรับ add: สามารถ reset form หรือ navigate ตามต้องการ
              // setFormData({ name: '', description: '', price: 0, stock: 0, sku: '', imageUrl: '' }); // optional reset
            }
          }
        }
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถบันทึกได้: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    } finally {
      setInternalLoading(false);
    }
  };
  
  const getErrorMessage = (field: string) => {
    const error = errors.find(e => e.field === field);
    return error?.message;
  };
  
  const loading = isLoading || internalLoading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Image Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>รูปภาพสินค้า</Text>
        <TouchableOpacity
          onPress={pickImage}
          style={styles.imagePicker}
          activeOpacity={0.7}
          disabled={loading || uploading}
        >
          {uploading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.imagePlaceholderText}>กำลังอัปโหลด...</Text>
            </View>
          ) : formData.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: formData.imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Camera size={24} color="white" />
                <Text style={styles.imageOverlayText}>แตะเพื่อเปลี่ยนรูป</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={48} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>แตะเพื่อเลือกรูปภาพ</Text>
            </View>
          )}
        </TouchableOpacity>
        {formData.imageUrl && !uploading && (
          <Text style={styles.imageSuccessText}>อัปโหลดรูปภาพเรียบร้อยแล้ว</Text>
        )}
      </View>
      
      {/* Name */}
      <View style={styles.section}>
        <Text style={styles.label}>
          ชื่อสินค้า <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, getErrorMessage('name') && styles.inputError]}
          placeholder="เช่น MacBook Pro 16 inch"
          placeholderTextColor="#9CA3AF"
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          editable={!loading}
        />
        {getErrorMessage('name') && (
          <Text style={styles.errorText}>{getErrorMessage('name')}</Text>
        )}
      </View>
      
      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>รายละเอียด</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสินค้า"
          placeholderTextColor="#9CA3AF"
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>
      
      {/* Price & Stock */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>
            ราคา (บาท) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, getErrorMessage('price') && styles.inputError]}
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={formData.price?.toString()}
            onChangeText={(text) => updateField('price', parseFloat(text) || 0)}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          {getErrorMessage('price') && (
            <Text style={styles.errorText}>{getErrorMessage('price')}</Text>
          )}
        </View>
        
        <View style={styles.halfWidth}>
          <Text style={styles.label}>
            สต็อก <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, getErrorMessage('stock') && styles.inputError]}
            placeholder="0"
            placeholderTextColor="#9CA3AF"
            value={formData.stock?.toString()}
            onChangeText={(text) => updateField('stock', parseInt(text) || 0)}
            keyboardType="number-pad"
            editable={!loading}
          />
          {getErrorMessage('stock') && (
            <Text style={styles.errorText}>{getErrorMessage('stock')}</Text>
          )}
        </View>
      </View>
      
      {/* SKU */}
      <View style={styles.section}>
        <Text style={styles.label}>SKU (รหัสสินค้า)</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น MBP-M3-16"
          placeholderTextColor="#9CA3AF"
          value={formData.sku}
          onChangeText={(text) => updateField('sku', text)}
          editable={!loading}
        />
      </View>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.button, 
            styles.submitButton,
            onCancel ? styles.halfButton : styles.fullButton,
            loading && styles.submitButtonDisabled
          ]}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'กำลังบันทึก...' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  imagePicker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  imagePreview: {
    width: '100%',
    height: 192,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 192,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  imageSuccessText: {
    fontSize: 14,
    color: '#059669',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: '100%',
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#0284C7',
  },
  submitButtonDisabled: {
    backgroundColor: '#7DD3FC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});