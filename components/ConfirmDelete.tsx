import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmDeleteProps {
  visible: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  visible,
  productName,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <AlertTriangle size={32} color="#DC2626" />
            </View>
            <Text style={styles.title}>
              ยืนยันการลบ
            </Text>
          </View>
          
          <Text style={styles.message}>
            คุณต้องการลบสินค้า{' '}
            <Text style={styles.productName}>"{productName}"</Text>{' '}
            ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.button, styles.cancelButton]}
              accessibilityLabel="ยกเลิก"
            >
              <Text style={styles.cancelButtonText}>
                ยกเลิก
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.button, styles.deleteButton]}
              accessibilityLabel="ยืนยันการลบ"
            >
              <Text style={styles.deleteButtonText}>
                ลบสินค้า
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  productName: {
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});