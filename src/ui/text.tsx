import { StyleSheet, Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { useColors } from './theme';

type Variant = 'title' | 'heading' | 'body' | 'caption';

export type TextProps = NativeTextProps & {
  variant?: Variant;
  muted?: boolean;
};

export function Text({ variant = 'body', muted = false, style, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <NativeText
      style={[styles[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
});
