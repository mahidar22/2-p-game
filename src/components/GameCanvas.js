import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function GameCanvas({ children, style }) {
  return <View style={[styles.canvas, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  canvas: { width, height: height * 0.7, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
});