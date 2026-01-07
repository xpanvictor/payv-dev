import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface BalanceCardProps {
    balance: string;
    changePercent: number;
    changeAmount: string;
    walletAddress: string;
    onCopyAddress?: () => void;
    onToggleVisibility?: () => void;
    isHidden?: boolean;
}

/**
 * Main balance display card with gradient background.
 * Shows total balance, percentage change, and wallet address.
 */
export function BalanceCard({
    balance,
    changePercent,
    changeAmount,
    walletAddress,
    onCopyAddress,
    onToggleVisibility,
    isHidden = false,
}: BalanceCardProps) {
    const isPositive = changePercent >= 0;
    const displayBalance = isHidden ? '••••••••' : balance;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e1933', '#131022']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Balance label with visibility toggle */}
                <View style={styles.labelRow}>
                    <Text style={styles.label}>Total Balance</Text>
                    <TouchableOpacity onPress={onToggleVisibility} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialIcons
                            name={isHidden ? 'visibility-off' : 'visibility'}
                            size={18}
                            color={WalletColors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Balance amount */}
                <Text style={styles.balance}>{displayBalance}</Text>

                {/* Change indicator */}
                <View style={[styles.changeBadge, isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative]}>
                    <MaterialIcons
                        name={isPositive ? 'trending-up' : 'trending-down'}
                        size={16}
                        color={isPositive ? WalletColors.success : WalletColors.error}
                    />
                    <Text style={[styles.changeText, isPositive ? styles.changeTextPositive : styles.changeTextNegative]}>
                        {isPositive ? '+' : ''}{changePercent.toFixed(1)}% ({changeAmount})
                    </Text>
                </View>

                {/* Wallet address */}
                <TouchableOpacity style={styles.addressContainer} onPress={onCopyAddress} activeOpacity={0.7}>
                    <Text style={styles.address}>{walletAddress}</Text>
                    <MaterialIcons name="content-copy" size={14} color={WalletColors.textSecondary} />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(55, 19, 236, 0.2)',
        shadowColor: WalletColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    gradient: {
        padding: 24,
        alignItems: 'center',
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        fontFamily: FontFamily.body,
        fontSize: 14,
        color: WalletColors.textSecondary,
        letterSpacing: 0.5,
    },
    balance: {
        fontFamily: FontFamily.displayBold,
        fontSize: 36,
        color: WalletColors.white,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 20,
    },
    changeBadgePositive: {
        backgroundColor: WalletColors.successLight,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    changeBadgeNegative: {
        backgroundColor: WalletColors.errorLight,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    changeText: {
        fontFamily: FontFamily.bodyBold,
        fontSize: 12,
    },
    changeTextPositive: {
        color: WalletColors.success,
    },
    changeTextNegative: {
        color: WalletColors.error,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    address: {
        fontFamily: FontFamily.mono,
        fontSize: 12,
        color: WalletColors.textSecondary,
    },
});
