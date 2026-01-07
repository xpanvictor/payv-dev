import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WalletColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DualBalanceCardProps {
    privateBalance: string;
    publicBalance: string;
    walletAddress: string;
    onShield?: () => void;
    onUnshield?: () => void;
    onCopyAddress?: () => void;
    onToggleVisibility?: () => void;
    isHidden?: boolean;
}

interface BalanceSectionProps {
    type: 'private' | 'public';
    balance: string;
    isHidden?: boolean;
}

function BalanceSection({ type, balance, isHidden = false }: BalanceSectionProps) {
    const isPrivate = type === 'private';
    const displayBalance = isHidden ? '••••••' : balance;

    return (
        <View style={styles.balanceSection}>
            <View style={styles.balanceHeader}>
                <View style={[
                    styles.balanceTypeIcon,
                    isPrivate ? styles.privateIcon : styles.publicIcon
                ]}>
                    <MaterialIcons
                        name={isPrivate ? 'lock' : 'public'}
                        size={14}
                        color={isPrivate ? WalletColors.primary : WalletColors.success}
                    />
                </View>
                <Text style={styles.balanceTypeLabel}>
                    {isPrivate ? 'Private Balance' : 'Public Balance'}
                </Text>
            </View>
            <Text style={styles.balanceAmount}>{displayBalance}</Text>
        </View>
    );
}

/**
 * Dual balance card showing both private (shielded) and public balances.
 * Includes Shield/Unshield buttons for moving funds between them.
 */
export function DualBalanceCard({
    privateBalance,
    publicBalance,
    walletAddress,
    onShield,
    onUnshield,
    onCopyAddress,
    onToggleVisibility,
    isHidden = false,
}: DualBalanceCardProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e1933', '#131022']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header with visibility toggle */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Wallet Balances</Text>
                    <TouchableOpacity
                        onPress={onToggleVisibility}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons
                            name={isHidden ? 'visibility-off' : 'visibility'}
                            size={18}
                            color={WalletColors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Private Balance Section */}
                <View style={styles.privateContainer}>
                    <BalanceSection
                        type="private"
                        balance={privateBalance}
                        isHidden={isHidden}
                    />

                    {/* Shield/Unshield Buttons */}
                    <View style={styles.shieldButtons}>
                        <TouchableOpacity
                            style={styles.shieldButton}
                            onPress={onShield}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="shield" size={16} color={WalletColors.primary} />
                            <Text style={styles.shieldButtonText}>Shield</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonDivider} />

                        <TouchableOpacity
                            style={styles.shieldButton}
                            onPress={onUnshield}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="lock-open" size={16} color={WalletColors.warning} />
                            <Text style={styles.shieldButtonText}>Unshield</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Public Balance Section */}
                <View style={styles.publicContainer}>
                    <BalanceSection
                        type="public"
                        balance={publicBalance}
                        isHidden={isHidden}
                    />

                    {/* Wallet Address */}
                    <TouchableOpacity
                        style={styles.addressContainer}
                        onPress={onCopyAddress}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.address}>{walletAddress}</Text>
                        <MaterialIcons name="content-copy" size={14} color={WalletColors.textSecondary} />
                    </TouchableOpacity>
                </View>
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
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 12,
        color: WalletColors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    privateContainer: {
        marginBottom: 16,
    },
    publicContainer: {
        marginTop: 16,
    },
    balanceSection: {
        gap: 4,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    balanceTypeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    privateIcon: {
        backgroundColor: 'rgba(55, 19, 236, 0.15)',
    },
    publicIcon: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    balanceTypeLabel: {
        fontFamily: FontFamily.body,
        fontSize: 13,
        color: WalletColors.textSecondary,
    },
    balanceAmount: {
        fontFamily: FontFamily.displayBold,
        fontSize: 28,
        color: WalletColors.white,
        letterSpacing: -0.5,
        marginTop: 4,
        marginLeft: 32,
    },
    shieldButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginLeft: 32,
        backgroundColor: 'rgba(30, 25, 51, 0.8)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignSelf: 'flex-start',
    },
    shieldButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    shieldButtonText: {
        fontFamily: FontFamily.bodyMedium,
        fontSize: 13,
        color: WalletColors.white,
    },
    buttonDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
        marginTop: 12,
        marginLeft: 32,
        alignSelf: 'flex-start',
    },
    address: {
        fontFamily: FontFamily.mono,
        fontSize: 12,
        color: WalletColors.textSecondary,
    },
});
