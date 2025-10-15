import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction }) => {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="กลับ"
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      
      {rightAction || <View style={styles.spacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  spacer: {
    width: 32,
  },
});