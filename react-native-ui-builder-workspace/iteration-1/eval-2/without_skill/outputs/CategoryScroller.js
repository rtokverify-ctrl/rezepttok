import React, { useState } from 'react';
import { FlatList, Text, View, TouchableOpacity, StyleSheet } from 'react-native';

const categories = ['Vegan', 'Meat', 'Dessert'];

const CategoryScroller = () => {
  const [selected, setSelected] = useState('');
  
  return (
    <FlatList
      horizontal
      data={categories}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setSelected(item)} style={styles.tab}>
          <Text>{item}</Text>
        </TouchableOpacity>
      )}
      keyExtractor={item => item}
    />
  );
};

const styles = StyleSheet.create({
  tab: { padding: 10, backgroundColor: '#eee', marginHorizontal: 5 }
});
export default CategoryScroller;
