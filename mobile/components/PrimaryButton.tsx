import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    StyleProp,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof MaterialIcons.glyphMap;
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

/**
 * Primary action button with gradient background and shadow.
 * Used for main CTAs like "Create New Wallet".
 */
export function PrimaryButton({
    title,
    onPress,
    icon,
    loading = false,
    disabled = false,
    style,
    textStyle,
}: PrimaryButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.85}
            style={[styles.shadowContainer, isDisabled && styles.disabled, style]}
        >
            <LinearGradient
                colors={isDisabled ? ['#6b7280', '#4b5563'] : ['#3713ec', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={WalletColors.white} size="small" />
                ) : (
                    <>
                        <Text style={[styles.text, textStyle]}>{title}</Text>
                        {icon && (
                            <MaterialIcons
                                name={icon}
                                size={20}
                                color={WalletColors.white}
                                style={styles.icon}
                            />
                        )}
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    shadowContainer: {
        borderRadius: 12,
        shadowColor: WalletColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    text: {
        fontFamily: FontFamily.displayBold,
        fontSize: 16,
        color: WalletColors.white,
        letterSpacing: 0.5,
    },
    icon: {
        marginLeft: 8,
    },
    disabled: {
        opacity: 0.6,
    },
});
