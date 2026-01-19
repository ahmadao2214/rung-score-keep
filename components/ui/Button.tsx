import { styled } from '@tamagui/core';
import { Button as TamaguiButton } from 'tamagui';

/**
 * Base button component with app-specific styling
 */
export const Button = styled(TamaguiButton, {
  backgroundColor: '$blue10',
  color: '$white',
  borderRadius: 10,
  paddingHorizontal: 20,
  paddingVertical: 12,
  fontWeight: '600',
  fontSize: 16,

  variants: {
    variant: {
      primary: {
        backgroundColor: '$blue10',
        color: '$white',
        pressStyle: {
          backgroundColor: '$blue9',
        },
      },
      secondary: {
        backgroundColor: '$gray5',
        color: '$gray12',
        pressStyle: {
          backgroundColor: '$gray6',
        },
      },
      danger: {
        backgroundColor: '$red10',
        color: '$white',
        pressStyle: {
          backgroundColor: '$red9',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$blue10',
        color: '$blue10',
        pressStyle: {
          backgroundColor: '$blue2',
        },
      },
    },
    size: {
      small: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontSize: 14,
      },
      medium: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
      },
      large: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        fontSize: 18,
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});
