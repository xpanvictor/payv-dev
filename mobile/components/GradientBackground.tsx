import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/**
 * Ambient gradient background with decorative blur effects.
 * Matches the Web3 wallet design with purple/blue glow blobs.
 */
export function GradientBackground({ children, style }: GradientBackgroundProps) {
    return (
        <View style={[styles.container, style]}>
            {/* Top-left ambient glow */}
            <LinearGradient
                colors={['rgba(55, 19, 236, 0.25)', 'transparent']}
                style={styles.topGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Bottom-right ambient glow */}
            <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                style={styles.bottomGlow}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
            />

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const GLOW_SIZE_TOP = 350;
const GLOW_SIZE_BOTTOM = 280;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WalletColors.backgroundDark,
    },
    topGlow: {
        position: 'absolute',
        top: -GLOW_SIZE_TOP * 0.3,
        left: -GLOW_SIZE_TOP * 0.3,
        width: GLOW_SIZE_TOP,
        height: GLOW_SIZE_TOP,
        borderRadius: GLOW_SIZE_TOP / 2,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: -GLOW_SIZE_BOTTOM * 0.2,
        right: -GLOW_SIZE_BOTTOM * 0.3,
        width: GLOW_SIZE_BOTTOM,
        height: GLOW_SIZE_BOTTOM,
        borderRadius: GLOW_SIZE_BOTTOM / 2,
    },
    content: {
        flex: 1,
        zIndex: 1,
    },
});
