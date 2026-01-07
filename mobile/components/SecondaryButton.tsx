import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    StyleProp,
    View,
} from 'react-native';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface SecondaryButtonProps {
    title: string;
    onPress: () => void;
    icon?: keyof typeof MaterialIcons.glyphMap;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

/**
 * Secondary action button with outlined/transparent style.
 * Used for alternative actions like "I already have a wallet".
 */
export function SecondaryButton({
    title,
    onPress,
    icon,
    disabled = false,
    style,
    textStyle,
}: SecondaryButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            style={[styles.container, disabled && styles.disabled, style]}
        >
            {icon && (
                <MaterialIcons
                    name={icon}
                    size={20}
                    color={WalletColors.white}
                    style={styles.icon}
                />
            )}
            <Text style={[styles.text, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'transparent',
    },
    text: {
        fontFamily: FontFamily.displayBold,
        fontSize: 16,
        color: WalletColors.white,
        letterSpacing: 0.15,
    },
    icon: {
        marginRight: 8,
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.5,
    },
});
