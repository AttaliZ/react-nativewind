import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { debounce } from '../lib/utils';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'ค้นหาสินค้า...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    const debouncedChange = debounce(onChangeText, debounceMs);
    debouncedChange(localValue);
  }, [localValue]);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  return (
    <View style={styles.container}>
      <Search size={20} color="#9CA3AF" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={localValue}
        onChangeText={setLocalValue}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
});