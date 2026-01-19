import { styled } from '@tamagui/core';
import { Input as TamaguiInput } from 'tamagui';

/**
 * Text input component with app-specific styling
 */
export const Input = styled(TamaguiInput, {
  backgroundColor: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
  color: '$color',

  focusStyle: {
    borderColor: '$blue10',
    borderWidth: 2,
  },

  variants: {
    variant: {
      default: {
        backgroundColor: '$background',
      },
      filled: {
        backgroundColor: '$gray3',
        borderWidth: 0,
      },
    },
    size: {
      small: {
        fontSize: 14,
        paddingHorizontal: 10,
        paddingVertical: 6,
      },
      medium: {
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
      },
      large: {
        fontSize: 18,
        paddingHorizontal: 14,
        paddingVertical: 12,
      },
    },
    error: {
      true: {
        borderColor: '$red10',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'medium',
  },
});
