import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CheckoutButton = () => {
  return (
    <TouchableOpacity style={styles.button}>
      <Ionicons name='cart' size={24} color='white' />
      <Text style={styles.text}>Items kaufen</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4500',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  text: { color: 'white' }
});
export default CheckoutButton;
