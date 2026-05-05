import { StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from './theme';

export default StyleSheet.create({
  gameContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gameCanvas: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
});