import { styled, Stack } from '@tamagui/core';

/**
 * Card container component for grouping related content
 */
export const Card = styled(Stack, {
  backgroundColor: '$backgroundStrong',
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '$borderColor',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundStrong',
      },
      green: {
        backgroundColor: '$green',
      },
      elevated: {
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    },
    padding: {
      none: {
        padding: 0,
      },
      small: {
        padding: 8,
      },
      medium: {
        padding: 16,
      },
      large: {
        padding: 24,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    padding: 'medium',
  },
});
