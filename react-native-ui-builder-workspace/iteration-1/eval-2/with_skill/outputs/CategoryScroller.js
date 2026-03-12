import React, { useState, useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME_COLOR } from '../constants/Config';

const categories = ['Vegan', 'Meat', 'Dessert'];

const CategoryScroller = () => {
  const [selected, setSelected] = useState('');
  
  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity 
      onPress={() => setSelected(item)} 
      style={[styles.tab, selected === item && styles.selectedTab]}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, selected === item && styles.selectedText]}>{item}</Text>
    </TouchableOpacity>
  ), [selected]);

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={categories}
      renderItem={renderItem}
      keyExtractor={item => item}
      initialNumToRender={5}
      windowSize={5}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 15 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 5,
    borderRadius: 20
  },
  selectedTab: { backgroundColor: THEME_COLOR },
  tabText: { color: 'white', fontWeight: '600' },
  selectedText: { color: 'white' }
});
export default CategoryScroller;
