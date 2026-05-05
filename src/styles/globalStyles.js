import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from './theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  text: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
});