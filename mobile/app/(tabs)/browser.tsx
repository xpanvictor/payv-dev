import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BrowserScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.placeholder}>
                <MaterialIcons name="public" size={48} color={WalletColors.textSecondary} />
                <Text style={styles.title}>Web3 Browser</Text>
                <Text style={styles.subtitle}>Coming soon</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WalletColors.backgroundDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontFamily: FontFamily.displayBold,
        fontSize: 24,
        color: WalletColors.white,
    },
    subtitle: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        color: WalletColors.textSecondary,
    },
});
