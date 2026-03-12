import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLOR } from '../constants/Config';

const CheckoutButton = () => {
  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.7}>
      <Ionicons name='cart' size={24} color='white' />
      <Text style={styles.text}>Items kaufen</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});
export default CheckoutButton;
