import { StyleSheet } from 'react-native';

export const FontFamily = {
    display: 'SpaceGrotesk',
    displayBold: 'SpaceGrotesk-Bold',
    body: 'NotoSans',
    bodyMedium: 'NotoSans-Medium',
    bodyBold: 'NotoSans-Bold',
    mono: 'SpaceMono',
} as const;

export const TextStyles = StyleSheet.create({
    h1: {
        fontFamily: FontFamily.displayBold,
        fontSize: 36,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontFamily: FontFamily.displayBold,
        fontSize: 24,
        lineHeight: 32,
    },
    h3: {
        fontFamily: FontFamily.displayBold,
        fontSize: 18,
        lineHeight: 24,
    },
    body: {
        fontFamily: FontFamily.body,
        fontSize: 16,
        lineHeight: 24,
    },
    bodySmall: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        lineHeight: 20,
    },
    caption: {
        fontFamily: FontFamily.body,
        fontSize: 12,
        lineHeight: 16,
    },
    captionBold: {
        fontFamily: FontFamily.bodyBold,
        fontSize: 12,
        lineHeight: 16,
    },
    button: {
        fontFamily: FontFamily.displayBold,
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.15,
    },
    mono: {
        fontFamily: FontFamily.mono,
        fontSize: 12,
        lineHeight: 16,
    },
});
